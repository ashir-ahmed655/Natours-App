
const express=require('express');
const tour_router=express.Router();  // here this router is a simple middle-ware 
const tourController= require('./../controllers/tourController')
const authController=require('./../controllers/authenticationController');
const reviewRoutes= require('./Review_Routes');

// const reviewController= require('./../controllers/reviewController');  // was needed for simple nested routing. No longer needed.
// tour_router.param('id',tourController.check_Tour_present); // No Longer needed after DB, was needed to check for tour present.

/* app.get('/api/v1/tours',getAllTours);
   app.get('/api/v1/tours/:id',getTour_By_ID);
   app.post('/api/v1/tours',create_Tour);
   app.patch('/api/v1/tours/:id',updateTour_By_ID);
   app.delete('/api/v1/tours/:id',deleteTour_By_ID)*/
   tour_router.route('/statistics-aggregate-pipeline').get(tourController.getTour_stats);
   tour_router.route('/top-5-bestRated').get(tourController.topTour,tourController.getAllTours);

   tour_router.route('/tours-within/:distance/center/:lat_lng/unit/:unit').get(tourController.get_tours_nearMe); // new way of defining routes, 
   // could also use query strings which wouldve looked like this: /tours-within?distance=300&center=133,123&unit=km
   // But we went with this standard way.=================>        /tours-within/300/center/133,123/unit/km

   tour_router.route('/distances-ofAllTours-from-Me/:lat_lng/unit/:unit').get(tourController.getTourDistance_fromMe);

   tour_router.route('/busiest-month/:year')
   .get(authController.protect_Tour,authController.restrictTo('admin','lead-guide','guide'),tourController.calcBusiestMonth);

//^Before 
// app.route('/api/v1/tours').get(getAllTours).post(create_Tour);
//*After
tour_router.route('/')
   .get(tourController.getAllTours) 
   .post(authController.protect_Tour,authController.restrictTo('admin','lead-guide'),tourController.create_Tour);

// app.use((req,res,next)=>{ // NON GLOBAL  Middle-Ware  ---(here this middle-ware would execute with below routes and
//                        not with above becuz the above routes get & post send responses before below middleware is executed ending the req-res cycle
//     console.log("Hello from Middle-Ware")
//     next();    // used becuz we aint sending a response here but will send in below routes ie: below middle-wares
// })

/*//^Before */
//app.route('/api/v1/tours/:id').get(getTour_By_ID).patch(updateTour_By_ID).delete(deleteTour_By_ID); 
//*After
tour_router.route('/:id')  // get only tour at id (here id after : is var name and can be any-other name)
.get(tourController.getTour_By_ID).patch(authController.protect_Tour,authController.restrictTo('admin','lead-guide'),
                    tourController.upload_TourImgs,tourController.resizeImg,tourController.updateTour_By_ID)
.delete(authController.protect_Tour,authController.restrictTo('admin','lead-guide'),tourController.deleteTour_By_ID); 


//^ Since below code for nested route is kinda duplicated from reviewRoutes('/' route.), hence implementing a better sol.
// tour_router.route('/:tourid/reviews').post(authController.protect_Tour,authController.restrictTo('user'),reviewController.createNewReview);

tour_router.use('/:tourid/reviews',reviewRoutes); // redirecting reviewRoute to its own router.


module.exports=tour_router;