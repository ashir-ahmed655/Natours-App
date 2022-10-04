process.on('uncaughtException',err=>{ // For SYNC CODE: global exception error handling. This is at top because unhandled promises propagate downwards.WHILE
    console.log(err);               // Exceptions stay at place hence we define handler at top. So now any error present even in app.js will get handled 
    process.exit(1);            // Becuz this func is defined before app.js is defined. Other than that all erros related to express like in routes etc,
                              // will be handled through the error controller. 
    
});


const app=require('./app');
const mongoose=require('mongoose');
const DB_string="mongodb+srv://ashir655:1234@cluster0.nvrpiyn.mongodb.net/natours?retryWrites=true&w=majority"

// const DB_string="mongodb://ashir655:1234@ac-wgd6iuy-shard-00-00.nvrpiyn.mongodb.net:27017,ac-wgd6iuy-shard-00-01.nvrpiyn.mongodb.net:27017,ac-wgd6iuy-shard-00-02.nvrpiyn.mongodb.net:27017/?ssl=true&replicaSet=atlas-8hrj10-shard-0&authSource=admin&retryWrites=true&w=majority"

mongoose.connect(DB_string,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true  // updated smth in MONGODB tested on 31st Aug didn't have any problems in code uptil section 8...

}).then(conn=>{// returns a promise
    // console.log(conn.connection);
    console.log("Connection Successful");
}) 

// ^The Code below was to test connecting to DB and has served its purpose but still here for reference on how to do it...
// const testTour= new tourModel({  // Making doc from Model
//     name:"The Forest Hiker",
//     rating:4.7,
//     price:497
// });
// testTour.save() // saving doc to db, returns a promise
// .then(doc=>{console.log(doc)})
// .catch(err=> console.log("Error Saving to DB: "+err));
//!x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
port=6969;
// console.log(app.get('env'));
// console.log(process.env);
const server = app.listen(port,()=>{  // returns a server object.
    console.log(`App running on port: ${port}`);
});

//^ To Handle errors other than mongoose/express errors ie: DB failures etc.  

process.on('unhandledRejection',err=>{ // For ASYNC CODE: global promise rejection error handling.
    console.log(err);
    server.close(()=>{
        process.exit(1); // 1: to exit the process with an uncaught exception --0: to exit the program successfully 
    })
});

//For SYNC CODE SEE AT TOP 🔼


