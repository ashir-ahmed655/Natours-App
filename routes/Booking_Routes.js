const express= require('express');
const booking_Router= express.Router(); // specified options to get access to stuff in ('/') route.
const bookingController= require('../controllers/bookingController.js');
const authController= require('./../controllers/authenticationController');
 
booking_Router.use(authController.protect_Tour);

booking_Router.get('/checkoutSession/:tourId',bookingController.getCheckout_Session);

booking_Router.use(authController.restrictTo('admin','lead-guide'));


booking_Router.route('/').get(authController.protect_Tour,bookingController.getAllBookings).post(bookingController.createNewBooking)

booking_Router.route('/:id').get(bookingController.getBooking_byid)
.patch(bookingController.updateBooking).delete(bookingController.deleteBooking);



module.exports=booking_Router;


