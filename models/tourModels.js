const mongoose=require('mongoose');
const slugify=require('slugify');
// const reviewModel = require('./reviewModel'); **Imported for some reason Don't remember but not being used at time of commenting out. Reason of cmnting out
// is that circular dependency no longer allowed in nodejs means: want to import tourMdel in reviewMdel and review in tour, this causes error SO since not
// being used here hence commented out becuz need to use it in reviewModel.
// const userModel=require('./userModels');  ** Did for embedding guides not Needed now..

const tourSchema= new mongoose.Schema({ // mongoose.Schema takes 2 params One the mongoose obj with schema def & 2nd option objs to specify optional params
    //Can be of Two types:
    name:{
        type:String,  // schema type options
        required:[true,"Tour should have a name"], // can have single boolean val or an validator ie: can throw error msg  
        unique:[true,"Tour should be unique"],
        trim:true,
        maxlength:[50,"The max Tour Name can be of 50 chars only."],
        minlength:[10,"The Tour Name length must be of 10 chars min "],

    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },

    // price:Number,  // specifying only data types of schema fields
    price:{
        type:Number,
        required:true
    },
    ratingsAverage:{
        type:Number,
        default:4.0,  // default if no val specified.
        min:[1,"Rating have to be atleast 1 star"], // ALSO work for dates
        max:[5,"Rating have to be max 5 stars"],
        set: val=> Math.round(val*10)/10 // setter for rounding off avgRatings. ie: 4.66666667 would be made 46.666667 then rounded 47 then /10= 4.7
    }, 
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: // To specify if a val should be in between a range of different vals, we specify enum with array. **Only available on STRINGS**
        { values:['easy','medium','difficult'], // Here this object way is the real way while the array way like in max & min is just syntactic sugar, BUT we
          message:"The Difficulty level has to be between Easy, Medium & Difficult" // can't write it in enum the way we wrote min&max length &required fields
        }
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    priceDiscount: {
        type: Number,
        validate:{ // like enum if we want to customize our own message we have to wrap it in object
        validator:function(discount){ // made our own validator function
            return this.price>discount; // should return true or false.. **TO NOTE: this here points to the doc only if the doc is being created 
                                        // and won't work on update
            },
        message:"Discount Price cannot be Greater than Actual Price"
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
        createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false, // not show at output while retrieving data 
    },
    slug:{ // made tis for document middleware
        type:String,
    },
    secretTour:{ // made tis for query middleware
        type:Boolean,
        default:false
    },
    startLocation:{ // It could've been modeled using locations but we decided to kweep strt loc separate 
        type:{ // This is a geospatial json ie: with LATi & LONgi
            type:String,
            default:"Point",  // here it could be line polygon or any other complex geometry with the coords but we only want line..
            enum:["Point"]
        },
        coordinates:[Number],  // takes an array of number with 1st being longitude and 2nd as latitude
        address:String,
        description:String
    },

    locations:[ // This is how we specify doc inside a doc 
        { // Embedded GeoJSON data Document **Not to be confused with above schema type options
            type:{ // This is a geospatial json ie: with LATi & LONgi
                type:String,
                default:"Point",  // here it could be line polygon or any other complex geometry with the coords but we only want line..
                enum:["Point"]
            },
            coordinates:[Number],  // takes an array of number with 1st being longitude and 2nd as latitude
            address:String,
            description:String,
            day:Number
        },
    ],
    // guides:Array **Used incase of Embedding with pre-hook( of save) see commented code somewhere below in save pre-hooks.
   
    guides:[{ // How We specify Referencing
        type:mongoose.Schema.ObjectId,
        ref:'User' // put name of the Model here from: mongoose.model(name,schema).
        } 
    ]

   
},{
    toJSON:{virtuals:true}, // both needed to show the virtual properties else it won't show
    toObject:{virtuals:true}
});


// tourSchema.index({price:1}) // It makes a list out of all docs with list items being the param specified and 1 Or -1 being ascnd or dscnding ordr,
// So this list having prices can be searched while sorting by price instead of visiting each doc one by one and chking price there. Hence saves alot of Time.

tourSchema.index({price:1, ratingsAverage:-1}); //This one indexes 2 diffrnt proprties so that both can be searched while sorting with these proprties.
// Key Note**: Only index proprties which are to be queried for a lot. Also** donot use them with high-write apps as indexes also have to be updted each time 
// docs are updted hence it will bear a huge overhead. and outweighs its pros.
tourSchema.index({slug:1}); //Will query for slugs while making dynamic site. Note** Indexes once created cannot be un-created by commnting out the code like we
// did with (price)index. We manually have to drop them from the db using compass.

tourSchema.index({startLocation:'2dsphere'});

//^ Virtual Properties
tourSchema.virtual('duration_in_weeks').get(function(){ // used to define virtual props(properties) which won't be there in DB,
    //  also we can't query for these props. Only used so that we don't have to save props that can be easily derived from other props like:
    // duration in weeks can be derived from days so we don't have to save a weeks prop and that saves space. 
    return this.duration/7;
});

//^ Virtual Populate.
tourSchema.virtual('reviews',{   //^ This populates the tour doc with a ref. field containing review doc. Same as child ref. but without its overhead
    ref:'Review',
    foreignField: 'tour',    //^ name of field that links the other docs to this one ie:tour in reviewModel which contains id of tour
    localField: '_id'        //^ name of that field in this doc ie: _id, since tour field(reviewModel) contains id of tours hence here we ref. _id 
})




//^ Document MiddleWare
tourSchema.pre('save',function(next){ // Document Middleware / **PRE HOOK** will run before .create/.save is run on the model to save a doc. Won't run for 
    // Insert Many/ FindOne & update/ FindID& update etc. Also no arrow function in callback as the current doc is passed with **(this)** keyword.
    this.slug=slugify(this.name,{lower:true}); // is a pkg which was told in express end vids will make this.name in url format or smth.
    next(); // here the job of this whole pre-hook is to populate a field called slug of the current doc before the saving/creation of the current doc. 
    // So we can see the usecases of these middlewares here which can create & populate fields for document to be created.
});

//^ We used below func to embed guides to new tour doc but embeding bad here(see why=> sec11_vid3) So,we goin referncing route. But keep codehere just inCase.  
/*tourSchema.pre('save',async function(next){ // since we pass an array of (guide) ids when creating tour. Hence we know are gonna fetch guides first then embed them.
    const guidesPromises= this.guides.map(async ele=> await userModel.findById(ele)); // now map will return promises hence we named var as guidepromises
    this.guides=await Promise.all(guidesPromises); // now we replace ids(guide) array with embedded user(guides) objects
    next()
});*/

// tourSchema.pre('save',function(next){ // reason for this pre-hook is to show that same pre-hooks can be used to apply chaining of different doc-middleware 
//     console.log('Saving Document');   // functions. Here both of these pre-hooks will run one after another.
//     next();
// });

// tourSchema.post('save',function(doc,next){ // called POST HOOK also a doc middleware. Injects the parameters of the newly created document & next
//     console.log(doc);                     // Will be called after the document is saved/created.
//     next();
// });
/**/
//^ Query MiddleWare

tourSchema.pre(/^find/,function(next){ // PRE-HOOK FOR FIND Hence Query Middleware, Will run before a query with find is initiated.
// tourSchema.pre('find',function(next){    
    this.find({secretTour:{$ne:true}}) // Here this keyword will point to query/cursor obj rather than document obj, 
    next();                            // Also this function as a whole here would remove all docs with secret tour marked as true in the search.
// Here One problem is that this works only for normal find. If we were to search for findByID tis will fail. Now if we wanted to do tis for findBYID aswell
// then we will have to either re-define a whole func like tis with the pre-hook being findOne & update rather than find Or we use regex in tis pre-hook
});

tourSchema.pre(/^find/,function(next){ // used this query middlewre to populate all tour routes with guides 
    this.populate({    
        path:'guides', select:'-__v -passChanged_Time' 
    });
    next()
})

// tourSchema.post(/^find/,function(docs,next){ // here we get an array of all docs queried for in this funcs parameter which will be there for all find & findBYID 
//     console.log(docs[0]);
//     next();
/*//})*/

//^ AGGREGATION MiddleWare

tourSchema.pre('aggregate',function(next){
    // console.log(this); // here we can see we get a whole bunch of stuff but we are interested in the pipeline method so lets check that
    // console.log(this.pipeline()); // here we get the same aggregation pipeline array that we specified in the getTourStats method. 
    
    if('$geoNear' in this.pipeline()[0]){ // becuz geoNear should be the 1st stage in pipeline whenever called (here called in tourController.getDist.fromMe)
        next();
        return; // we return because we don't want to unshift our geoNear stage as the 2nd one with below one as 1st.             
    }
    this.pipeline().unshift({$match:{secretTour:{$ne:true}}}); // here we add another method in pipeline for data to pass through which results in hiding the 
    next();                                                 // super secret tour from the pipeline too. 

});
















 // mongoose needs models to create documents and models need schemas
const tourModel=mongoose.model('Tour',tourSchema); // here we have made models with Collection-name:Tours(in lowercase & plural) and schema defined, 
                                            // next will make docs based on these models.
module.exports=tourModel;

// tourModel.ensureIndexes(function(err){
//     console.log("Ensured Indices")
//     if(err) console.log(err)
// })