const { findByIdAndUpdate } = require("../models/userModels");
const userModel = require("../models/userModels");
const catchAsync=require('./../util-by-ash/catchAsync-sec9-vid7');
const AppError = require('./../util-by-ash/global-err-handling');
const factoryHandler=require('./factoryHandler'); // to delete user
const multer= require('multer');    // used to retrieve imgs from html forms.
const sharp= require('sharp') // for img processing(resizing & cropping etc.)


//! Can't use this becuz don't want to save the img directly in our system read the below imgUpload method to know more.
// const multerStorage= multer.diskStorage({ // multer require diskStorage to store files with extension and to allow storage of file in local storage.
//     destination: (req,file,cb)=>{ // cb here is callback. does similar work to next in express.
//         cb(null,'public/img/users'); // first param is where any error handling can be passed if dest does not exist we keeping null here for simplicity.
//     },
//     filename: (req,file,cb)=>{ // file here is the req.file which has all stuff related to file including mime(file extension).
//         const file_extension= file.mimetype.split('/')[1]; // mimetype example: (image/jpeg) here 1st part tells what is the file it is second the extension.
//         cb(null,`user-${req.user._id}-${Date.now()}.${file_extension}`); // first is error if want to pass on name collisions with other files. Second is how to write name
//                                                       // here we write file name as: user-3534rbqrk111-0013924234 
//     }
//   }
// )

const multerStorage= multer.memoryStorage(); // storing img to memory buffer for axeing 1 operation and deceasing our time.
const multerFilter= (req,file,cb)=>{ //So that only images pass our filter and get into the db and nothing else.
 if (file.mimetype.startsWith('image')){
    cb(null,true)
 }
 else{
    cb(new AppError("Not an Image. Please Upload an image",400),false);
 }
}

// const imgUpload= multer({dest: "public/img/users"}); //!Previous amateur upload
const imgUpload= multer({storage:multerStorage, fileFilter:multerFilter} ); //* Good image upload with security.But what bout resizing and making sure the pic
                                                                            //! is of reasonable size so not to exceed our user document limit of 14mb.
exports.upload_UserImg= imgUpload.single('photo') // takes single img from photo id in form. See toursContrler for multiple images upload.// maybe calls next automatically.


exports.resizeImg= catchAsync( async(req,res,next)=>{
    if(!req.file) return next() // means img was not uploaded hence something else was updated.
    req.file.filename=`user-${req.user._id}-${Date.now()}.jpeg` // specifying jpeg becuz toFormat would make sure its always in jpeg hence no hurt here.
    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.filename}`)
    //! since memoryStorage on multer goes to req.file.buffer(instead of req.file) hence taking img from there, then resizing, then specifying format, 
    //! then jpeg quality(to reduce & save space), then specifying save location on local storage. 
    next();
})






const filter_the_Body= (body,...allowedFields)=>{
    
    // const {email,name}=body; 
    // console.log(email);  ** achieves same result with less looping but method not scalable for multiple fields. Like we can't use the same method for 
    // console.log(name);   ** usecases like somewhere we might need to filter only email and not name and somewhere we need to filter some other params. 
    // return {email,name};
    /* Below **Method** is Scalable to above mentioned use cases*/
    const newBody={}
    Object.keys(body).forEach(ele=>{ // assembles properties of obj in an array on which we call foreach hence (ele) is property name ie:email, name
        if(allowedFields.includes(ele)){
            newBody[ele]=body[ele];
        }
    })
    return newBody;
}


exports.Update_userInfo= catchAsync( async (req,res,next)=>{    //~ UPDATE EMAIL & USERNAME...
    // console.log(req.file)
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError("Cannot update password here. Try /updatePassword route",400));
    }

    const filteredBody= filter_the_Body(req.body,'email','name');
    if(req.file) filteredBody.photo=req.file.filename; // auto created using multer, had to create when using sharp.
    // console.log(filteredBody);
    const updateBody= await userModel.findByIdAndUpdate(req.user.id,filteredBody,{new:true,runValidators:true});  
    // here we use update and not the save method which we used in authentication section becuz here we want to run validators on email but not on passwords,
    // so save can only gives us permission to run all validators or run none. 
    res.status(200).json({
        status:"success",
        data:updateBody
    })
})

exports.delete_userInfo= catchAsync( async (req,res)=>{ // here we don't actually delete user for further accounting/audit reasons or if user wanted to get back 
    await userModel.findByIdAndUpdate(req.user.id,{active: false}); // on the platform again, but we mark it as inactive.
    res.status(204).json({
        status:"success"
    })

})



exports.create_User=(req,res)=>{
    res.status(500).json({  // we use 500 here because the func has not been yet implemented hence 500: internal server error
        status:'Route Not Defined...Please use /signup',
    })
} 

//^ Do Not Update password with this. As auth middlewares won't run. So pass would not be hashed, hence db would have normal pass(not hashed),
//^  Meanwhile logging in, pass entered would be hashed, So logging-in to that acc would never be possible. 
exports.updateUser= factoryHandler.updateOne(userModel);
exports.deleteUser=factoryHandler.deleteOne(userModel);
exports.getUser= factoryHandler.getOne(userModel);
exports.getAllUsers= factoryHandler.getAll(userModel);
exports.getMe= factoryHandler.getOne(userModel); // gets the currently logged-in user




//^ Was used before factory handler func.
// exports.getAllUsers= catchAsync( async (req,res,next)=>{
//     const users=await userModel.find();
    
//     res.status(200).json({
//         status: 'success',       // wrapped using jsend protocol with obj containing status and data with data wrapped in actual data 
//         results: users.length,
//         data: {
//             users  // where the left-side tours is to specify that this resource here is also the name of endpoint ->(see above app.get(url))
//         }
//         // Time:req.request_Time,   // here we use the above user-defined middle ware, was only used for testing.
//     })
// });


