const express=require('express');
const morgan=require('morgan');
const exp = require('constants');
const path= require('path');
const tour_router=require('./routes/Tour_Routes');
const user_router=require('./routes/User_Routes');
const review_router=require('./routes/Review_Routes');
const booking_router= require('./routes/Booking_Routes');
const view_router=require('./routes/View_Routes');

const cookieParser= require('cookie-parser');
const appErr= require('./util-by-ash/global-err-handling');
const errHandler=require('./controllers/errorController');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const compression= require('compression')

const app= express();

app.enable('trust proxy') // So that express trust proxies as heroku itself works as a proxy so req.secure won't work 
app.set('view engine','pug'); // to use pug templates NOTE: Node already supports pug and other popular template engines by default
app.set('views', path.join(__dirname,'views')) // sets views folder as our view engine and path is a native module which joins view folder path with dir name.
//^ NOTE**: views folder should be named 'views' nothing else. Becuz it wont work then...

app.use(express.static(path.join(__dirname,'public')));// This sets route for static files eg: html,css,js,imgs --cannot access whole folders just 1 file at a time

app.use(helmet());

// app.use(helmet.contentSecurityPolicy({
//     directives:{
//         "script-src":["'self'","api.mapbox.com"],
       
//     }
// })) // will return a func which will sit with app.use until the app calls the middleware. USED to set security Http headers

// app.use(helmet.crossOriginResourcePolicy({
//     policy:"cross-origin"
// }))

// app.use(helmet.crossOriginEmbedderPolicy({
//     policy:
// }))

if(process.env.NODE_ENV==="development") app.use(morgan('dev')); // 3rd Party Middle-Ware Funcs. DEVELOPMENT Logging

app.use(express.json()); // middleware   ----Reads data in req.body

const limiter= rateLimit({ // resets on restarting program. LIMIT reqs from API
    max:100, //max reqs
    windowMs: 60*60*1000, // to reset no. of reqs after 1 hr in millisecs
    message: "Too many reqs from this IP. Please try again later after an hr"
})
app.use('/api',limiter);

app.use(express.urlencoded({extended: true, limit:'10kb'})) // to get data out of html forms use extended in options for passing complex data not necessary here.

app.use(mongoSanitize()) // to prevent against nosql query injection
app.use(xss()); // will clean user input from malicious html code 

app.use(hpp({ // clear up the query string from duplicate fields like sort param twice in query string is leading to bizarre errors
 whitelist:['duration','ratingsAverage','ratingsQuantity','maxGroupSize','difficulty','price'] // to allow some duplicate fields
})); 

app.use(cookieParser());

app.use(compression());

// Simple User-Defined Global Middle-Ware:  ---(here globl means the req now has property of time which can be accessed from any below get post etc funcs). 
// app.use((req,res,next)=>{
//     req.request_Time=new Date().toISOString();
//     next();
// })

// app.use((req,res,next)=>{
//         req.request_Time=new Date().toISOString();
//         console.log(req.cookies)

//         next();
//     })

// ^EXPRESS BASICS
// app.get('/',(req,res)=>{
//     res.status(200).json({message:'Hello from server',app:'natour'});
// });

// app.post('/',(req,res)=>{
//     res.send('you can post too');
// })
//  ^END

app.use('/',view_router);
app.use('/api/v1/users',user_router);
app.use('/api/v1/tours',tour_router);
app.use('/api/v1/reviews',review_router)
app.use('/api/v1/bookings',booking_router);

//Handling Routes not Defined.
// The logic here is that all the routes that didn't go towards either tour or user would be undefined hence they would reach the below methods..
// Now here we have to handle get,post,patch etc reqs for all those routes so instead we just use all method.
app.all('*',(req,res,next)=>{ // here * represents anything present in the route 
    // res.status(404).json({
    //     status:'fail',
    //     message:`Route requested ${req.originalUrl} Does not Exist at the moment...`
    // }); // Below is Updated Global One 
    // const err= new Error(`Route requested ${req.originalUrl} Does not Exist at the moment...`); // this here would be the message passed in err.message
    // err.status="fail"; 
    // err.statusCode=404;
    // next(err); // here passing err obj in next would allow express to automatically leap over other middlewares straight to the global error middleware.
    //^ Further below is Class Error One.
    next(new appErr(`Route requested ${req.originalUrl} Does not Exist at the moment...`,404));

})

app.use(errHandler)
module.exports=app;


