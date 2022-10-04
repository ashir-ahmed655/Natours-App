const AppError=require('./../util-by-ash/global-err-handling');

const handleCastErrorDB= err=>{ // whole point of this & other funcs like this in prod env is to distinguish b/w operational & prog errors.
    const message=`Invalid ${err.path}: ${err.value}`; // But mongoose doesn't send meaningful error msgs so they can't be classified as operat. errors
    return new AppError(message,400);  // Hence we wrapped them in AppError obj which will add field of isOperational on them. 
}

const handleDuplicateField_DB= err=>{ 
    const message=`Duplicate Field Value: "${err.keyValue.name}" found. Please Use another Field Value Name`;
    return new AppError(message,400);
}

const handleValidation_inUpdateDB= err=>{ 
    const msgArr=Object.values(err.errors).map(ele=>ele.message); //obj.vals to loop over the objs in errors while ele is the obj present in each iteration.
    const message="Following entered values found incorrect: "+msgArr.join(", ");
    return new AppError(message,400);
}

const handle_InValid_Token=err=>{
    const message=`Token has an ${err.message}. Please try to Login again.`;
    return new AppError(message,401);
}

const handle_Expired_Token=err=>{
    const message= `Session-Token Expired. Please Log in again.`
    return new AppError(message,401);
}

const sendErrorDev= (err,req,res)=>{
    //! A) API ERROR:
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status:err.status,
            message:err.message,
            // stack:err.stack,
            error:err
        });
    }
    //! B) WEBSITE ERROR (RENDERING THE ERROR):
    console.log('Error: '+err)
    res.status(err.statusCode).render('error',{
        title:"Something Went Wrong.",
        msg:err.message
    })
}

const sendErrorProd= (err,req,res)=>{
    //! A) API ERROR:
    if(req.originalUrl.startsWith('/api')){
        if(err.isOperational){ // Operational Error ie: id not found or tried to create a db doc without req fields 
            return res.status(err.statusCode).json({
                status:err.status,
                message:err.message,
            });
    
        }// Programming Error / Unexpected Error. Not to tell the client about this error
        // console.error("Error SEND ERROR PROD: ",err);
        return res.status(500).json({
            status:'error',
            message:"Something went very wrong",
        })
    }

    //! B) WEBSITE ERROR (RENDERING THE ERROR):
    if(err.isOperational){ 
        // if(err.message.includes('Email OR Password')){
        //     return;
        // }
        return res.status(err.statusCode).render('error',{
            title:"Something Went Wrong.",
            msg:err.message
        })}

        return res.status(500).render('error',{
        title:"Something Went Wrong.",
        msg:"Please Try again Later"})
}

module.exports=(err,req,res,next)=>{ // we are stepping towards using a global error handling method than manually defining error handling response in each method.
    // console.log(err.stack)
    err.statusCode= err.statusCode || 500;
    err.status= err.status || 'error';
    // console.log("NODE ENV EQUAL IN errcontrler exports: "+process.env.NODE_ENV);
    if(process.env.NODE_ENV=='development'){
        sendErrorDev(err,req,res);
        
    }else if(process.env.NODE_ENV=='production'){
        // let ErrCopy = {...err}; //^ **NOTE:CHUTIYAP METHOD OF COPYING OBJS //DID this to not overwrite our err obj-- To adhere to Modular Prog standards
        let ErrCopy=JSON.parse(JSON.stringify(err)); //! GOOD METHOD TO COPY OBJS yet it didn't copy err.message to ErrCopy Why?? need to chk later
        // console.log(JSON.stringify(err))  property doesn't exist on err (concluded becuz can't see on stringify.)Maybe it comes from globl err handling class
        ErrCopy.message=err.message //becuz this msg property probably comes from Err(built-in)clss which globl err extended hence we put it in errcopy too.
 
 // NOTE: BELOW IF-Conditions are designed by observing error msgs & they aren't same for all hence conditions for all mongoose error to be handled is different
        if(ErrCopy.name==="CastError") {ErrCopy=handleCastErrorDB(ErrCopy)} // Handle invalid ID error from mongoose with meaningful msg to client
                                                                         //  as he don't know about any CastError.
        if(ErrCopy.code===11000) {ErrCopy=handleDuplicateField_DB(ErrCopy)}

        if(ErrCopy.name==="ValidationError") {ErrCopy=handleValidation_inUpdateDB(ErrCopy)}//handle fields not adhering to validators specified in tourModel
      
        if(ErrCopy.name==="JsonWebTokenError"){ ErrCopy= handle_InValid_Token(ErrCopy)}

        if(ErrCopy.name==="TokenExpiredError") {ErrCopy= handle_Expired_Token(ErrCopy)}
        // console.log(err.message)
        // console.log(ErrCopy.message)
        sendErrorProd(ErrCopy,req,res);

    }





    // console.log('In error Controller') Used it to check if it was working after 7th vid in section 9: Was Working 
}