const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Username is required"],
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:[true,"Email should be Unique"],
        lowercase:true,
        validate:[validator.isEmail,"Email might not be correct or might contain some typo."]
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    role:{
        type:String,
        enum:['admin','lead-guide','guide','user'],
        default:'user'
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[8,"Password must contain atleast 8 chars"],
        select:false // to not show pass inDB...
    },
    passChanged_Time:{
        type:Date,
    },

    passwordConfirm:{
        type:String,
        required:[true,"Confirm Password Please."],
        validate:{ // will only work on create or save!!!!
            validator:function(val){
                return val===this.password;
            },
            message:"Password and Confirm Password Do not Match. Please retype them."
        }
    },
    passwordResetToken: String,
    passwordResetTokenExpires:Date,
    role:{
        type:String,
        default:'user',
        enum:{
            values:['user','guide','lead-guide','admin'],
            message:"Roles can either be of types: User,Guide,Lead-Guide,Admin"
        }
    },
    active:{
        type:Boolean,
        default:true
    }
    
})



userSchema.pre('save', async function(next){ // doc-middleware
    if(!this.isModified('password')) return next(); // save will be called all time on create/update hence check if pass has been changed or not
    // console.log("prehook");
    this.password= await bcrypt.hash(this.password, 12); // returns promise params:passField,len of str to encrypt pass with
    this.passwordConfirm=undefined // only needed pass confirm to check if user enter correct pass. now set undefined As it may create problem with the hashing
    next();
})


userSchema.pre('save',function(next){// chngs passChngTime property to current time if password is resetted.
    if(!this.isModified('password') || this.isNew){ return next()} // to check if password was not modified or is a new doc 
    this.passChanged_Time= Date.now()-1000; // rarely jwt is generated before this line is executed resulting in token being invalid due to chkpassChng func 🔻
    next();                       // hence we delay time of passChng property so that token does not become invalid due to a few millisec unintentional error.

})

userSchema.pre(/^find/,function(next){
    this.find({active: {$ne: false}})
    next();
})


userSchema.methods.checkPass= async function(candidatePass,encryptedPass){ // made on schema methods & is available on all docs probably like static in java 
    return await bcrypt.compare(candidatePass,encryptedPass);
}

userSchema.methods.check_pass_changed= function(JWT_issueTime){
    if(this.passChanged_Time){
        const ChangeTime_inSec=parseInt(this.passChanged_Time.getTime()/1000,10); // returns time in ms so /1000 return in secs formatted to integer with base10
        // console.log(ChangeTime_inSec,JWT_issueTime); // since timestamp of JWT is in secs so our pass Time should also be in secs..
        return ChangeTime_inSec > JWT_issueTime; // if token was of before pass change so returns true else false on pass not changed OR token issued  
    }                                            // after pass change

    return false;
}


userSchema.methods.createResetPassToken= function(){

    generateToken= crypto.randomBytes(32).toString('hex');
    this.passwordResetToken= crypto.createHash('sha256').update(generateToken).digest('hex');// ecrypted token to store in DB whereas send the ogtoken to user.
    
    console.log({generateToken} , this.passwordResetToken);

    this.passwordResetTokenExpires=Date.now() + 10 * 60 * 1000 // set expire token to be of 10mins.
    return generateToken; //return token to send using email
}


const userModel=mongoose.model('User',userSchema);



module.exports =userModel;