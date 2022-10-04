
const express=require('express');
const userController=require('./../controllers/UserController');
const authController=require('./../controllers/authenticationController');
const user_router=express.Router();  // used to put these routes in separate files

  //////////////////////////^ Routes Defined for User Uses

user_router.post('/signup',authController.signup);

user_router.post('/login',authController.login);

user_router.post('/forgotPassword',authController.forgot_pass);

user_router.patch('/resetPassword/:token',authController.reset_pass);

user_router.get('/logout',authController.logout);

  //~xxxxxxxxxx All these routes below should have protect midlewre so that only logged-in users can interact with them and not anyone using our API
  user_router.use(authController.protect_Tour); //* This midlewre would add protect midlewre to all below routes without us manually adding them one by one.

user_router.patch('/updatePassword',authController.updatePassword);

user_router.patch('/update-my-Profile',userController.upload_UserImg,userController.resizeImg,userController.Update_userInfo);

user_router.delete('/delete-my-Profile',userController.delete_userInfo);

user_router.get('/me',userController.getMe); // here photo is the field in html form holding the img. and single to uplod single img


   //////////////////////////^ Routes Defined for Admin Uses
  user_router.use(authController.restrictTo('admin'))

user_router.route('/').get(userController.getAllUsers).post(userController.create_User);

user_router.route('/:id').get(userController.getUser).patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports=user_router;












//^ A Look in the Past, To see where we stand from 1 month ago to today 20-9-22 and ponder over why we did it this way.

// ^Before
//  app.route('/api/v1/users').get(getAllUsers).post(create_User);
// *After
// user_router.route('/').get(userController.getAllUsers).post(userController.create_User);
// ^Before
//  app.route('/api/v1/users:id').get(getUser).patch(updateUser).delete(deleteUser);
// *After
// user_router.route('/:id').get(userController.getUser).patch(userController.updateUser)
// .delete(authController.protect_Tour,authController.restrictTo('admin'),userController.deleteUser);