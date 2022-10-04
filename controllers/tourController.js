
const tourModel=require('./../models/tourModels');
const apiFeature=require('../util-by-ash/utilities-features');
const catchAsync=require('./../util-by-ash/catchAsync-sec9-vid7');
const appError=require('./../util-by-ash/global-err-handling')
const factoryHandler=require('./factoryHandler'); // to delete tour
const multer= require('multer');    // used to retrieve imgs from html forms.
const sharp= require('sharp') // for img processing(resizing & cropping etc.)


const multerStorage= multer.memoryStorage(); // storing img to memory buffer for axeing 1 operation and deceasing our time.

const multerFilter= (req,file,cb)=>{ //So that only images pass our filter and get into the db and nothing else.
 if (file.mimetype.startsWith('image')){
    cb(null,true)
 }
 else{
    cb(new AppError("Not an Image. Please Upload an image",400),false);
 }
}

const imgUpload= multer({storage:multerStorage, fileFilter:multerFilter} );

exports.upload_TourImgs= imgUpload.fields([{name:'imageCover', maxCount:1},{name:'images',maxCount:3}]) //since we have two fields from which images should be taken
// and the rest of the code is self-explanatory.ie:taking max 1,3 images and their field name(to take these ids from form.)// Will use req.files// Maybe calls next automatically.

//~ Other ways of getting imgs in different scenarios.
//!NOTE** below ways will not work together in one route. ie: they can't be added in 1 middlwre together cause they are a middlewre themselves 
//! and can't be added like two middlewares one after another in same route.
//  imgUpload.array('images',3); // when there are multiple with same name of Fields// will use req.files
//  imgUpload.single('imageCover'); // when there is only one. //will use req.file(singular)

exports.resizeImg= catchAsync( async(req,res,next)=>{
    console.log(req.files) //becuz we using "fields" in uploadTourimg check that func
    if(!req.files.imageCover || !req.files.images) return next() // means img was not uploaded hence something else was updated.
    req.body.imageCover=`tour-${req.params.id}-${Date.now()}-cover.jpeg` // specifying jpeg becuz toFormat would make sure its always in jpeg hence no hurt here.
    //upon inspecting update tours func, we see that it takes the whole req.body & update it on tour doc. hence we make req.body.imageCover with the filename so
    // that in the next middlwre imgs names gets updated also in tour doc.

    //For ImageCover
    await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/tours/${req.body.imageCover}`)
    //! since memoryStorage on multer goes to req.file.buffer(instead of req.file) hence taking img from there, then resizing it to 3/2 ratio, then specifying format, 
    //! then jpeg quality(to reduce & save space), then specifying save location on local storage. 
    // req.imageCover= imgCover_Filename 
    req.body.images=[]
    await Promise.all(req.files.images.map(async (img,index) => { 
        req.body.images.push(`tour-${req.params.id}-${index+1}.jpeg`)
        await sharp(req.files.images[index].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/tours/${req.body.images[index]}`)
    })); //see above this req.files.images[index].buffer can be simplified to img.buffer where img is the element in map method.
    //^ In above code we used map instead of foreach. But in practice it was noted that forEach worked as well then why the extra promise.all & map method on img array.
    //^ Simply put we used this becuz our async await won't work inside the forEach loop and next might be called before the imgs are processed in some cases. So map would
    //^ return an array and since we used async await, hence array of promises which we await using promise.all ensuring each img gets processed before moving to next middlwre.  
    next();
})


exports.topTour=async (req,res,next)=>{
    
    // req.query.sort('-price,ratingAverage');
    req.query.limit='5';
    req.query.sort="-ratingsAverage,price";
    
    req.query.fields='price,name,ratingsAverage,duration';
    // req.query.fields('price,name,difficulty,duration');
    next(); 
};


/*////////// *Defining a way to send all tours as json response to client */
// const tours =JSON.parse( fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.getAllTours= factoryHandler.getAll(tourModel);


/*//////////////////// *Getting a Tour when connected to DB using Factory Functions*/
exports.getTour_By_ID= factoryHandler.getOne(tourModel,{path:'reviews'}); // also check below commented code for this same func for different populating ways.


/*//////////////////// *Creating a Tour using res.data by accessing Middle-Ware Created DB hence commented code */
exports.create_Tour= factoryHandler.createOne(tourModel);


/*//////////////////// *Updating Tours by ID using Patch, Also Implemented DB & ASYNC AWAIT */
exports.updateTour_By_ID= factoryHandler.updateOne(tourModel);


/*//////////////////// *Deleting Tours By ID using Delete, Also Implemented DB & ASYNC AWAIT */
exports.deleteTour_By_ID= factoryHandler.deleteOne(tourModel);




exports.getTour_stats= catchAsync( async (req,res,next)=>{

    const stats= await tourModel.aggregate([
        {$match: {ratingsAverage:{$gte:4.5}}},
     
            // How it Works is that mongoose iterate over all docs & check for the var declared in String & $sign & performs specific operation on it through
            // the logical oeprators defined & stores the ans in accumulator & put the ans in the fields defined here: avgRating,numof_tours etc

        {$group: {
            // _id:null, // to put and calculate for all vals in one grp 
            // _id:"$difficulty", //Will Blow your MIND!!!!! All fields can either have 3 of the defined difficulties: ez,med,hard
                                 //  so it groups the same difficulty tours together & performs the operations on it
            // _id:"$ratingsAverage",
            _id:{$toUpper:"$difficulty"},                    
            numof_Ratings:{$sum:'$ratingsQuantity'},
            numof_Tours:{$sum:1},  
            avgRating:{$avg:'$ratingsAverage'}, // avg is a mathmetical operator which calcs avg while the $ratingsAverage is our var from tourModel
            avgPrice:{$avg:'$price'}, // To reference the tourModel var it is mandatory to include ($) sign with var name
            minPrice:{$min:'$price'},
            maxPrice:{$max:'$price'}
        }},
        {$sort:
            {avgPrice:-1  } // here we have to understand that at this point after group our docs have been altered already as they go through the pipeline
                            // or in a more technical way the data injected in the pipeline has been altered the og data is present in the DB but we can't bring
                            // it in the middle of pipeline stage hence we have to use the altered var name we specified for geting average rating
                            // Also to Note we don't use the ($) sign with altered var names becuz they are part of pipeline. So the observation would say that
                            // we only use $ sign with either the logical operators or referencing the tourModel vars.
        },
        // {$match:{ // point of this is to show stages can be repeated but data altered can't come back
        //     _id:{$ne:"EASY"} // $ne=> not equal hence we will get difficulties other than easy
        // }}

        
    ]);
    res.status(200).json({
        status:"Succeed",
        data:{stats}
    });
});


exports.calcBusiestMonth= catchAsync( async (req,res,next)=>{
    const year=req.params.year*1;
    const plan= await tourModel.aggregate([
        {
            $unwind:'$startDates' // basically destructures the array and makes a document for each element of the array
        },
        {$match:{
            startDates:{
                $gte:new Date(`${year}-01-01`), // YY/MM/DD
                $lte:new Date(`${year}-12-31`)
            }
        }},
        {$group:{
            _id:{$month:'$startDates'},
            numof_tours:{$sum:1},
            toursName:{$push:'$name'}, // makes an array and push incoming docs in it
             }
        },
        {
            $addFields:{month:'$_id'} // to replace _id with month var name. here it takes what var name to add & then the var in which val is kept
        },
        {
            $project:{_id:0} // send field value to next stages or not, 0:No --1:Yes(Default).
                            // Remember if a field is set to zero its value is lost then in the next stages & will not appear in the final output
        },
        {
            $sort:{
                numof_tours:-1
            }
        }


    ]);
    res.status(200).json({
        status:"Succeed",
        data:{plan}
    });
});



exports.get_tours_nearMe= catchAsync(async (req,res,next)=>{ //^ How the url looks like: /tours-within/:distance/center/:lat_lng/unit/:unit
    const {distance,lat_lng,unit}=req.params;                //^ Example URL: /tours-within/300/center/133,123/unit/km
    const [lat,lng]= lat_lng.split(',');

    if(!lat || !lng) next(new appError('Please provide latitude & longitude in the format like this=> lat,lng',400));

    const earth_Rad=[3963.2,6378.1] // earths radius in miles & km 
    const radians_radius= unit==='mi'? distance/earth_Rad[0] : distance/earth_Rad[1]; // should be in radians=> Now distance from point A to B = earth'sRadius*radians

    const tours= await tourModel.find({
        startLocation: {$geoWithin: {$centerSphere: [[lng,lat], radians_radius]}} // geoWithin is a geospatial operator, which requires centerSphere to draw the circle
        //! Thats right it will draw a circle from given lat&lng as center with radius=radians. ALso for geo queries to work we need to set the index on the 
        //! startLocation  
    })

    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{
        data:tours
        }
    })

})


exports.getTourDistance_fromMe= catchAsync( async (req,res,next)=>{
    const {lat_lng,unit}=req.params;             
    const [lat,lng]= lat_lng.split(',');

    if(!lat || !lng) next(new appError('Please provide latitude & longitude in the format like this=> lat,lng',400));

    const distMutiplier= unit==='mi' ? (1/1609) : (1/1000) // to conv meters to miles or meters to km 

    const distances= await tourModel.aggregate([
        //Always needs to be the 1st stage in the pipeline. for geoloc aggregation. Also require geoLoc index on which coords are defined. Here also its startLoc
        //Will take startLoc automatically if no other geoLoc index defined else use keys to define which index u want to take.
        {$geoNear: {
            near: {//Our loc passed as geoJson which will be compared with all other tours starting points. 
                type: 'Point',
                coordinates: [lng * 1, lat * 1] // multiply by 1 to convert into nums since theyll be in strings when fetched from url.
            },
            distanceField:'distance', // used to define property name 'distance' on tours in which will have all our distances. in meters.
            distanceMultiplier: distMutiplier // available in geoNear to multiply distanceField with any num.

          } 
        },
        {$match:{secretTour:{$ne:true}}}, // this accounts for not showing the secret Tours. 
        {$project: {distance: 1, name: 1}} // stage in aggregation to only show distances and tours name.
    ])

    res.status(200).json({
        status:'success',
        results: distances.length,
        data:{
        data:distances // returns result sorted in ascending order automatically 
        }
    })
})






//^ Used factory handler one-liner instead of all this below code.

// exports.getAllTours=catchAsync(async (req,res,next)=>{    // get all tours
//     //*  Using DB to save the new tour & Async await
//     //^ 1st way of writing query (Mongoose method):
//     // const tours= await tourModel.find().where('duration').equals(5).where('difficulty').equals('easy'); //find returns a query obj 

//     //^ 2nd way of writing query (MongoDb method):
//     /*const tours=await tourModel.find({
//         difficulty:'easy',duration:5
//     });
//     Using 2nd method rn because we already get an obj coming from req.query that matches the way we write second method in param of find method. */
    
//     // try{
//     //^ Execute Query
//     const FilterFeature=new apiFeature(tourModel.find(),req.query).filter().sort().limitfield().paginate();
//     // const x=
//     const tours=await FilterFeature.query;
//     // console.log(x);
//     res.status(200).json({
//         status: 'success',       // wrapped using jsend protocol with obj containing status and data with data wrapped in actual data 
//         results: tours.length,
//         data: {
//             tours: tours  // where the left-side tours is to specify that this resource here is also the name of endpoint ->(see above app.get(url))
//         }
//         // Time:req.request_Time,   // here we use the above user-defined middle ware, was only used for testing.
//     })       
// });


//^ Used factory handler one-liner instead of all this below code.
// exports.getTour_By_ID= catchAsync( async (req,res,next)=>{   

//    //^ Was used before connecting to DB:
//    /*// thing to note: '/api/v1/tours/:id?' we could add this Q-mark at end of param to make 'em optional

// console.log(req.params); // here req.params would have all the parameters specified by colon 
// if(req.params.id>=tours.length) return res.status(404).json({
// status:'Failed'
// })

// res.status(200).json({
// status: 'success',       // wrapped using jsend protocol with obj containing status and data with data wrapped in actual data 
// // results: tours.length,
// data: {
// tours:tours[req.params.id] // where the left-side tours is to specify that this resource here is also the name of endpoint ->(see above app.get(url))
//     }})*/

//^     Using DB to save the new tour & Async await

//     // const tour= await tourModel.findById(req.params.id).populate('guides');  //^ 1st way to simply populate... 
//     // const tour= await tourModel.findById(req.params.id).populate({   ^ Another way of populate but show or not show selected fields in the referenced doc.
//     //     path:'guides', select:'-__v -passChanged_Time' //^ Will only populate for this route. So we have to copy-paste the populate func to every route.
//     // });                                              //^ instead we should populate using query middleware in tourModels... So all routes are populated...

//     const tour= await tourModel.findById(req.params.id).populate('reviews')
//     // const tour= await tourModel.findOne({"name":req.params.id+""}); //^  <--To find by Name or other params if how to write mongodb in console is learnt:
//     if(!tour){
//         return next(new appError("No Tour defined by this ID",404)); // checks if tour is null and throws global err defined in utilities
//     } 
//     res.status(200).json({ 
//         status:"Success",
//         data: tour
//     });
    
// });


//^ Used factory handler one-liner instead of all this below code.
// exports.create_Tour= catchAsync( async (req,res,next)=>{ /// create new tours
//     // // have to use middleware to access data in req becuz express out of the box doesn't include data from client in req obj
//     // // console.log(req.body);  // req.body available becuz used middleware
//     // const newId=tours[tours.length-1].id+1;
//     // const newTour= Object.assign({id:newId},req.body);  // merge id with the new tour from post req
//     // tours.push(newTour);
//     // console.log(tours);
//     // fs.writeFile(`${__dirname}/../dev-data/data/tours-simplee.json`,JSON.stringify(tours),err=>{
//     //     console.log("Error"+err)
//     //     res.status(201).json({
//     //         status:"success",
//     //         data:newTour,
//     //     })
//     // })
//     // NO need to send below response again because sent it with json abv
//     // res.send('Done');  // need to send back smth to finish request/response cycle
//     /*Using DB to save the new tour & Async await*/
//     // ^ ---Method 1---
//     // newTour=await new tourModel({});  Make document using model then save document..
//     // newTour.save();
//     // ^ ---Method 2---

//     newTour=await tourModel.create(req.body);
//     res.status(201).json({
//                 status:"success",
//                 data:newTour,
//             })

// });



//^ Used factory handler one-liner instead of all this below code.
// exports.updateTour_By_ID= catchAsync( async (req,res,next)=>{

//     const tour= await tourModel.findByIdAndUpdate(req.params.id,req.body,{  // takes id,updated obj, options(optional-> do certain work check documentation)
//         new:true,  // return new updated obj instead of original one
//         runValidators:true // It runs all the validators present in the tourModel ie:if there's validator for name len greater than 10 then upon updating the
//                             //name, the validators would run and ensure the name is valid before updation every time. 
//     })
//     if(!tour){
//         return next(new appError("No Tour defined by this ID",404)); // checks if tour is null and throws global err defined in utilities
//     } 
//     res.status(200).json({
//         status:"Success",
//         data:tour
//     })
// });



//^ Used factory handler one-liner instead of all this below code.
// exports.deleteTour_By_ID= catchAsync( async (req,res,next)=>{ // Handled using factory handler.
//     // try{
//         const tour=await tourModel.findByIdAndDelete(req.params.id);

//         if(!tour){
//             return next(new appError("No Tour defined by this ID",404)); // checks if tour is null and throws global err defined in utilities
//         } 
//         res.status(204).json({ 
//             status:'success',
//             data: null
//     })
// });


//^ Was needed a long time ago before integration with DB.  
// exports.checkBody=((req,res,next)=>{ Not Needed 
//     if(!req.body.name || !req.body.price){ // then sending 400 bad request to client
//         return res.status(400).json({
//             status:"Failed Bad Request",
//         })
//     }
//     next();
// })


//^ No longer need because DB will do the checking of id present itself.
// exports.check_Tour_present=((req,res,next,value)=>{    // param middle-ware with 1 extra param equal to param
//     if(value>=tours.length) {
//         console.log("ID: "+value);
//         return res.status(404).json({
//         status:'Failed'
//         })}
//         next();
// })