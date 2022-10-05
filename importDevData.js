const mongoose=require('mongoose');
const fs=require('fs');

const DB_string= process.env.DB_KEY.replace('<PASSWORD>',process.env.DB_PASS)

const tourModel=require('./models/tourModels');
const reviewModel=require('./models/reviewModel');
const userModel=require('./models/userModels');

mongoose.connect(DB_string,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false

}).then(conn=>{// returns a promise
// console.log(conn.connection);
    console.log("Connection Successful");
}) 

const tours=JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours.json`,'utf-8'));
const users=JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/users.json`,'utf-8'));
const reviews=JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/reviews.json`,'utf-8'));

const create_Tour= async (tours)=>{ /// create new tours
    try{
       await tourModel.create(tours); // the model can take an array of objects as parameter to create docs
       await userModel.create(users,{ validateBeforeSave: false});
       await reviewModel.create(reviews);
    }catch(err){
               console.log(err);    
                }
}
create_Tour(tours);



const deleteTours=async ()=>{ 
    try{
        await tourModel.deleteMany();
        await reviewModel.deleteMany();
        await userModel.deleteMany();
        
    }catch(err){
        console.log(err);
    }
}
deleteTours();


