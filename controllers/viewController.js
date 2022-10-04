const AppError = require('../util-by-ash/global-err-handling');
const tourModel= require('./../models/tourModels');
const bookingModel= require('./../models/bookingModel');

const catchAsync= require('./../util-by-ash/catchAsync-sec9-vid7')
const userModel= require('./../models/userModels')

exports.getOverview=catchAsync( async (req,res,next)=>{
    // 1) Get all tour data
    const tours= await tourModel.find() // got the tours. Also passed in overview.pug

    // 2) Build Template --DONE in Overview.pug
    // 3) Render that template with tour data. --DONE in Overview.pug
    res.status(200).render('overview',{
        title:"All Tours",
        tours:tours
    })
})

exports.getTour=catchAsync( async (req,res,next)=>{
    // 1) Get specific tour data along with reviews & guides populated
    const tour= await tourModel.findOne({slug:req.params.slug}).populate({
        path:'reviews',fields:"review rating user"
    }) // Used findOne but find will also return only 1 doc(Duhh slug is unique). but in an array, so got saved from unnecessary hassle.
    // console.log(tour);
    if(!tour) {return next(new AppError("There is no tour with that name",404))}
    // console.log(tour);
    // 2) Build Template 
    // 3) Render that template with tour data.

   
    res.status(200).render('tour',{ 

        title:`${tour.name} Tour`, 
        tour:tour
    })
})


exports.getLoginForm=(req,res)=>{
    res.status(200).render('login',{
        title:"Log into your Account"
    })
}

exports.getMyProfile= (req,res)=>{
    res.status(200).render('account',{
        title:"My Profile"
    })
}

exports.updateProfile= catchAsync( async (req,res)=>{

    const Updated_user = await userModel.findByIdAndUpdate(req.user.id,{name:req.body.name, email:req.body.email},{new:true,runValidators:true})
    res.status(200).render('account',{
        title:"Your Account",user:Updated_user
    })

    // next()
})

exports.getMyBookings= catchAsync( async (req,res,next)=>{
    //1)Find all bookings of particular user.
    const bookings= await bookingModel.find({user: req.user.id})

    //2)Find tours with userId
    const tourIds= bookings.map(booking=> booking.tour) // would return an array of tourIds from bookings array
    const tours= await tourModel.find({_id: { $in: tourIds } } ) // in would return all docs whose tourIds matched with _id

    res.status(200).render('overview',{
        title: `${req.user.name}'s Booked Tours`,
        tours:tours
    })
})



// exports.getHome=(req,res)=>{ // Was just a test with base pug
//     res.status(200).render('base',{
//         title:"Exciting tours for adventurous people",
//         tour:"The Forest Hiker",
//         user:"ash"
//     }) // sends base.pug as html to the browser where it searches for base in views folder which we specified to contain pug.
// }