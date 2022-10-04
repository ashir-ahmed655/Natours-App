module.exports= (func)=>{ // here the basic idea is to wrap all async funcs with this func so that we can get rid of the try & catch blocks
    // func(req,res,next).catch(err=>next(err)) // Our logic ends here, we called whatever func was wrapped inside our async but the problem is these 
                             // Controller funcs require req,res Now: 
                            // How are we supposed to inject these params from catchAsync as it doesn't take those params, So we can do smth like tis,
                           // How about we return a func with those params which in turn calls our Controller funcs. So in short it would work like tis,
                          // ie: getAllTours gets wrapped with catchAsync now when the code is read by node value of tours is set to be that function which in turn
                         //  accepts params like req,res etc when the tour & that func in turn call our real Tour func injecting its arguments in the real tour func.
        return(req,res,next)=>{
            func(req,res,next).catch(err=>next(err));
        }
    
    }