class AppError extends Error{
    constructor(msg,statusCode){
        super(msg); 
        this.statusCode=statusCode;
        this.status= `${this.statusCode}`.startsWith('4')? "fail" : "error" // if statuscode =400smth then fail else if 500smth then error
        this.isOperational= true; // so that we can later distinguish b/w programming & operational error
        Error.captureStackTrace(this,this.constructor) // smth about not polluting the stacktrace. Will update in Future

    }    
}

module.exports= AppError;