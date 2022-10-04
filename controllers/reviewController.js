const reviewModel=require('./../models/reviewModel');
const factoryHandler=require('./factoryHandler'); // to delete reviews


//~--- Here we could also, have included these 2 lines in factory Handler.getAll method and it wouldn't have ruined implementation for others because filter 
//~ would have been an empty obj going in find() of mongoose which we know doesn't cause problems. So we would be saved from this middleware below.

// exports.take_auto_tourID_from_url= (req,res,next)=>{  
//     //^ below code makes so that only reviews of certain tour are accessed and due to just below 2 lines of code of filter due to the fact that we implmntd
//       //^ nested routing for our post req. hence not needed heavy lifting there. 
//       if(req.params.tourid) req.body.filter= {tour:req.params.tourid};
//       next();
//   }

exports.setAuto_Tour_User_ids_from_url= (req,res,next)=>{
    //Allow nested routes

    if(!req.body.tour) {req.body.tour= req.params.tourid}
    if(!req.body.user) {req.body.user= req.user.id}
    next();
}

exports.getAllReviews= factoryHandler.getAll(reviewModel);
exports.createNewReview= factoryHandler.createOne(reviewModel);
exports.deleteReview= factoryHandler.deleteOne(reviewModel);
exports.updateReview= factoryHandler.updateOne(reviewModel);
exports.getReview_byid= factoryHandler.getOne(reviewModel);







// ^ Was needed before factory handler.
// exports.createNewReview= catchAsync( async (req,res,next)=>{
//     //Allow nested routes

//     if(!req.body.tour) {req.body.tour= req.params.tourid}
//     if(!req.body.user) {req.body.user= req.user.id}

//     const reviewCreated= await reviewModel.create(req.body);
//     res.status(201).json({
//         status:"success",
//         data:{reviewCreated}
//     })
// })


// ^ Was needed before factory handler.
// exports.getAllReviews= catchAsync( async (req,res,next)=>{  
// let filter={}
//   if(req.params.tourid) filter= {tour:req.params.tourid};
//     const reviews= await reviewModel.find(filter);
//     res.status(200).json({
//         status:"success",
//         results:reviews.length,
//         data:{reviews}
//     })
// });