const express= require('express');
const review_Router= express.Router({mergeParams: true}); // specified options to get access to stuff in ('/') route.
const reviewController= require('./../controllers/reviewController');
const authController= require('./../controllers/authenticationController');


// '/tour/:tourid/reviews' Request hits tour routes then get redirected to reviewRoutes. 
// Example route=> '/tour/15265r621/reviews where only this portion of route makes its way '/reviews' to be matched in review routes.
// Also we need to merger params of tour router and review router becuz review router is routed from tour router due to above url hence their params are merged
// Else reviewRoute will not have access to tourid..

//~ All reviews should only be manipulated by someone logged-in.
    review_Router.use(authController.protect_Tour);

review_Router.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'),reviewController.setAuto_Tour_User_ids_from_url,reviewController.createNewReview);

review_Router.route('/:id').get(reviewController.getReview_byid)
.patch(authController.restrictTo('user'),reviewController.updateReview).delete(authController.restrictTo('admin','user'),reviewController.deleteReview);


module.exports=review_Router;


