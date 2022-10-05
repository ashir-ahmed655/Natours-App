const userModel= require('./../models/userModels');
const catchAsync=require('./../util-by-ash/catchAsync-sec9-vid7');
const jwt=require('jsonwebtoken');
const AppError = require('./../util-by-ash/global-err-handling');
const {promisify}= require('util'); // becuz we only needed one func from the whole pkg hence for speed purposes..
const Email= require('./../util-by-ash/email');
const crypto=require('crypto');

const createToken=(id)=>{ return jwt.sign({id:id}, process.env.JWT_MY_SECRET_PASSWORD,{ // params: payload,secretString(**Len MUST be >32 chars) ,options
    expiresIn:process.env.JWT_EXPIRES_IN  //eg: "1d", "20h", 60s"
}) }

const create_token_and_send_res= (user,statusCode,res)=>{
    const token= createToken(user._id);
    const cookie_specific_options={
        expires:new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // so that cookie expires after 90 days from when it is generated.
        // secure:true, // so that the cookie is sent over only https **Note: Can't use this in development mode becuz using htttp rn.
        httpOnly:true // so that the cookie is stored only by browser and sent only when sending reqs and not stored in local storage.
    }

    if(process.env.NODE_ENV=='production'){ cookie_specific_options.secure=true} // becuz will use https in prod.

    res.cookie('jwt',token,cookie_specific_options)

    user.password=undefined // so that pass doesn't show on response in signup.
    res.status(statusCode).json({
        status:"success",
        token,
        user
    })
}


exports.signup = catchAsync( async (req,res,next)=>{
    // const newUser= await userModel.create(req.body); // fked-up way creating users right from user data. Never do tis... Instead Do this->
    const newUser= await userModel.create({ // Better Way of implementing signup
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
        passChanged_Time:req.body.passChanged_Time || undefined,
        role:req.body.role || "user"
    });
                // http://127.0.0.1:6969/me // here it supposes you're signing up from the website hence it redirects you to your profile page upon clicking the btn.
    const url=`${req.protocol}://${req.get('host')}/me`
    // console.log(url);
    await new Email(newUser,url).sendWelcome();
    create_token_and_send_res(newUser,201,res)

    // const token=createToken(newUser._id);

    // res.status(201).json({
    //     status:'success',
    //     token,
    //     data: newUser,
    // })
});


exports.login= catchAsync( async(req,res,next)=>{
    const {email,password}= req.body; // OBJ destructuring. // 1).Checking for email & pass in req body

    if(!email || !password) { return next(new AppError("Email OR Password Empty",400));}

    const user= await userModel.findOne({email:email}).select('+password')  // +pass here becuz we excluded pass from showing in userModel but need it here 

    if(!user || ! await user.checkPass(password,user.password)){ // 2). CHecking if email exists & pass is correct.
        return next(new AppError("Incorrect Email OR Password",401));
    }
    // const token= createToken(user._id);  // 3). sending token as verification complete.
    // res.status(200).json({
    //     status:"success",
    //     token
    // })

    create_token_and_send_res(user,200,res)
});


exports.protect_Tour= catchAsync( async (req,res,next)=>{  // fked up with the naming here should've been protect
    //^ 1). Checking if Token is present & Getting  token..
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){ // auth should be the header obj name while Bearer should be with the token
         token=req.headers.authorization.split(" ")[1];                         // This above line is industry standard so always include Bearer...
    }
    else if(req.cookies.jwt){
        token = req.cookies.jwt
    }
    if(!token) return next(new AppError("Token does not exist. Log in to get a new Token",401));

    //^ 2). Verifying Token.
    // jwt.verify(token,'qwertypoiuzxcvmnb098123-is-my-secretString') *** has a callback so we promisify becuz we are comfortable with async-await
    const payload= await promisify(jwt.verify)(token,process.env.JWT_MY_SECRET_PASSWORD) // promisify returns a promise func which we call immediately
    // console.log(payload);                                                       // hence returning promise. On which we use await which gives decoded data.
    
    //^ 3). Verify that user still exists. // must be easy to do since we already have payload/decoded data with us
     const user_exists= await userModel.findById(payload.id); // returns the user if it exists.
     if(!user_exists) return next(new AppError("The Token Owner/User does not exists",401));

    //^ 4). Check if user has changed password. 
    // console.log(user_exists);
    if(user_exists.check_pass_changed(payload.iat)){
        return next(new AppError("Password Changed Recently. Login again to get new Token",401));
    }

    // Grant access to protected route.
    req.user=user_exists; // did it to keep track of who logged in recently and the usecase of that was in restrictTo method below..
    res.locals.user=user_exists // this var user will be available to each and every pug template by default

    next();

});


exports.restrictTo=(...roles)=>{ // Used rest operator to take array of params that was passed to a func which returned below middleware in tour_routes
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){ // here is where the req.user comes in use that we did in protect_Tour..
            next(new AppError("You are not qualified for this role!!!",403));
        }
        // console.log("GG");
        // console.log("From restrictTo func: "+req.user.email);
        next();
    }
}


exports.forgot_pass= catchAsync( async(req,res,next)=>{
// 1). Get user based on Posted email
        
        const user = await userModel.findOne({email: req.body.email })
        if(!user){ return next(new AppError("The User Doesn't Exist",404));}

// 2). Generate random reset token
        const resetToken= user.createResetPassToken(); // we specified a static func on userModel so all users can have access to it.
        await user.save({validateBeforeSave: false}); // because we updated expire-Time in that func hence save the model again.**Note: param inside save IMP
                                                //  it turns of all validators, so we don't have to give req fields of user model once again ie: password etc.


// 3). Send it to user's email

        try{    
            const reset_URL= `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
            await new Email(user,reset_URL).sendResetPass_mail()
            res.status(200).json({
                status:"success",message:"Token send to email"
            })
        }
        catch(err){
            user.passwordResetToken= undefined
            user.passwordResetTokenExpires= undefined
            await user.save({validateBeforeSave: false});
            return next(new AppError("There was an error sending the Email. Try again later",500));
            // res.status(500).json({
            //     status:"failed",message:err
            // })
        }
});

exports.reset_pass= catchAsync( async (req,res,next)=>{
    // 1) Get user based on token
        const hashed_token= crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user= await userModel.findOne(
            {passwordResetToken: hashed_token,             // checking if user exists.
             passwordResetTokenExpires: {$gt: Date.now()}  // checking for token expiration.
            });                                        // will return undefined in user if either condition falls short

    // 2) If token has not expired, set new password & delete reset Token
        if(!user){return next(new AppError("Token is invalid or has expired",400))}
        user.password= req.body.password;
        user.passwordConfirm= req.body.passwordConfirm;
        user.passwordResetToken=undefined;
        user.passwordResetTokenExpires=undefined;
        // user.passChanged_Time= Date.now(); Don't want to do it here because will refactor this func in future 

        await user.save();

    // 3) Update the pass_changedAt property to reflect the time of change Note** DID it in userModel using pre-hook

    // 4) Log user in
    // const token= createToken(user._id);  // 3). sending token as verification complete.
    // res.status(200).json({
    //     status:"success",
    //     token
    // });
    create_token_and_send_res(user,200,res)
})


exports.updatePassword= catchAsync(async(req,res,next)=>{
    // 1). Get user from collection
        const user= await userModel.findById(req.user.id).select('+password'); // becuz pass is hidden by default in usrModl

    // 2). Check if POSTed current password == OG password
        if(!(await user.checkPass(req.body.password,user.password))) { return next(new AppError("current Password entered is wrong.",401))}

    // 3). IF yes, update the pass
        user.password= req.body.change_password
        user.passwordConfirm= req.body.change_passwordConfirm
        await user.save();

    // 4). Log user in , send jwt.        
        // const token= createToken(user._id);
        // res.status(200).json({
        //     status:"success",
        //     token
        // })

        create_token_and_send_res(user,200,res)
});


//Only for Rendered pages. Will never throw errors

exports.LoggedIn_orNot=  async (req,res,next)=>{  // fked up with the naming here should've been protect
    //^ 1). Checking if Token is present & Getting  token..

    //ANY CONFUSION IN THIS CHECK PROTECT TOUR MIDDLEWARE ABOVE.
    if(req.cookies.jwt){

    //^ 2). Verifying Token.
    try{
    const payload= await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_MY_SECRET_PASSWORD) // promisify returns a promise func which we call immediately
                                          
    //^ 3). Verify that user still exists. // must be easy to do since we already have payload/decoded data with us
     const user_exists= await userModel.findById(payload.id); // returns the user if it exists.
     if(!user_exists) next()

    //^ 4). Check if user has changed password. 
    // console.log(user_exists);
    if(user_exists.check_pass_changed(payload.iat)){
        return next();
    }

    // User is Logged IN
    res.locals.user=user_exists // this var user will be available to each and every pug template by default
    return next();
    }catch(err){
        return next()
    }
}
    next()
};


exports.logout= async (req,res,next)=>{ // logic:Overwriting the token in jwt Cookie with text so that auth is not possible next time and have to signin
    res.cookie('jwt',"LoggedOut",       // to get new cookie which overwrites previous cookie(but the cookie expires in 10sec and gets discarded).
        { httpOnly:true,
            expiresIn: new Date(Date.now() +(10*100))
        }
    ) //takes cookie name,cookieValue,options(expiration:10secs).
    res.status(200).json({status:'success'});
}


