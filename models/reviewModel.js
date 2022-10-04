const mongoose=require('mongoose');
const tourModel=require('./../models/tourModels');

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        required:[true,"Review field can't be empty"]
    },
    rating:{
        type:Number,
        default:4.0,
        min:1.0,
        max:5.0
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
   tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,"Review must belong to a tour."]
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,"Review must belong to a User."]
    }

},
{
    toJSON:{virtuals:true}, // both needed to show the virtual properties else it won't show
    toObject:{virtuals:true}
});
// Below line might not work right away and might take a day or two to work.
reviewSchema.index({tour:1,user:1} , {unique:true}) //To make sure 1 user gets to set 1 reviw for 1 tour. Without this 1 user can set multiple revs for the tour.


reviewSchema.pre(/^find/,function(next){ /// Populate tours and users so that when getting review model we get user posting them and tour posted on.

    //^ Code with tour populated, But commented out becuz all tours having reviews populated are also having tour populated inside reviews hence
    //^ this weird heirarchy of tour having reviews which in turn have tour inside them. Hence trading off tour having reviews instead of reviews having tours.
    // this.populate({
    //     path:'tour',select:'name'
    // }).populate({
    //     path:'user',select:'name photo'
    // });

    this.populate({ //^ Hence not populating tour but only user due to dillema described abv
        path:'user',select:'name photo'
    });
    next()
})

//^ For calc avgRatings field on tours from reviews created for those tours.

reviewSchema.statics.calcAvgRatings= async function(tourId){ // This method is static. Means is available on the model itself. 
    const stats= await this.aggregate( [    //this contains the model.       // Meanwhile instance methods are available on all docs created from that model.
    {$match:{tour:tourId}}, // select all reviews by matching passed in tourID.
    {$group:{
        _id:null, // _id:null **This line was also checked and didn't find any diff in working .I think  
        nRating:{$sum:1},
        avgRating:{$avg:'$rating'} //rating becuz each review has rating field
    }}

    ])  
    // console.log(stats);
    if(stats.length > 0){ // If no reviews present then the arr is empty which will throw error becuz we'll be trying to access [0] index of empty arr..
        await tourModel.findByIdAndUpdate(tourId,{  // got in a fkin dilemma here check tourModel imports and keep that in mind.
            ratingsQuantity:stats[0].nRating,
            ratingsAverage:stats[0].avgRating
        })
    }
    else{ // Did this to put fake ratings since there are no actual reviews present.
        await tourModel.findByIdAndUpdate(tourId,{  // got in a fkin dilemma here check tourModel imports and keep that in mind.
            ratingsQuantity:0,
            ratingsAverage:4.5
        })
    }

}

reviewSchema.post('save',function(){ // this in document-Middleware point to the current review doc.***Used post becuz since review not yet saved
    //hence the match will not return that newly created review. Also post desn't have access to next() So don't call it.
    // reviewModel.calcAvgRatings(this.tour); // Note**: reviewModel does not exist at this moment of time. 
                                              // It exists afterwards hence we need some way of accessing the model.
     this.constructor.calcAvgRatings(this.tour);  // Since 'this' contains the current reviewDoc when we reference its construc, That means the model itself.                                      
})


//^ For updating avgRating on tours due to deletion & updation of reviews

//* To access tourId from reviews being deleted/updated. Also** Can't execu calcAvgrtng here becuz it hasn't been updated/deleted yet so we wont hv true results
reviewSchema.pre(/^findOneAnd/,async function(next){ // using findOneAnd becuz findByIdAndDel/Upd use findOne behind the scenes. 
    this.reviewDoc= await this.findOne() //'this' in queryMiddlwre point to the query to be executd. So awaiting yields the rev doc which has the tourID we need.
    // console.log(this.reviewDoc);
    next();
}); 

//* To change the avgRating on tours(got from the pre-method)
reviewSchema.post(/^findOneAnd/,async function(){
    //~ Now we have to call the calcAvgrating static method defined above on the reviewModel
    await this.reviewDoc.constructor.calcAvgRatings(this.reviewDoc.tour)

    //!(STUPID THOUGHT that took 2 hrs of my fkin time)=> 'this' in post usually referred to the current doc but here the doc is in this.reviewDoc. 
    //! Firstly 'this' doesnot depend on pre/post-hooks but depend on whether the middlwre is query or doc. (find is queryMiddlewre) So this has query in it
    //! Secondly since 'this' has query but in post-hook we can't execute it becuz it has execu. already. So we have to rely on making a property of 'this' in
    //!  pre-hook to access our doc. Then use that property in post-hook to access the revModel and execu the calcAvgRating method.

})


const reviewModel= mongoose.model('Review',reviewSchema);

module.exports= reviewModel;

// reviewModel.ensureIndexes(function(err){
//     console.log("Ensured Indices")
//     if(err) console.log(err)
// })