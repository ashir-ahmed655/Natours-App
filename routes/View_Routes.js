const express= require('express');
const view_router= express.Router();
const viewController= require('./../controllers/viewController');
const authController=require('./../controllers/authenticationController');
const bookingController=require('./../controllers/bookingController');


// view_router.use(authController.LoggedIn_orNot); //this will run for all routes but its similar to protect which'll run for only last route hence doing 
// dual operations on a route so better to comment this and add logged in manually to all routes.

view_router.get('/',authController.LoggedIn_orNot,viewController.getOverview)

view_router.get('/tour/:slug',authController.LoggedIn_orNot,viewController.getTour)

view_router.get('/login',authController.LoggedIn_orNot,viewController.getLoginForm)

view_router.get('/me',authController.protect_Tour,viewController.getMyProfile)

view_router.get('/my-bookings',authController.protect_Tour,viewController.getMyBookings)


// view_router.post('/submit-user-data',authController.protect_Tour,viewController.updateProfile)





module.exports= view_router


