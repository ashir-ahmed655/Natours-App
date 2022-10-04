const catchAsync=require('./../util-by-ash/catchAsync-sec9-vid7');
const appError=require('./../util-by-ash/global-err-handling');
const apiFeature=require('../util-by-ash/utilities-features');

//^ Specified a handler file so that we can code in all repeating methods 

exports.deleteOne=Model=>{return catchAsync( async (req,res,next)=>{
    // try{
        const doc=await Model.findByIdAndDelete(req.params.id);

        if(!doc){
            return next(new appError("No Document defined by this ID",404)); // checks if doc is null and throws global err defined in utilities
        } 
        res.status(204).json({ 
            status:'success',
            data: null
    })
})};



exports.updateOne= Model=>catchAsync( async (req,res,next)=>{

    const doc= await Model.findByIdAndUpdate(req.params.id,req.body,{  // takes id,updated obj, options(optional-> do certain work check documentation)
        new:true,  // return new updated obj instead of original one
        runValidators:true // It runs all the validators present in the Model ie:if there's validator for name len greater than 10 then upon updating the
                            //name, the validators would run and ensure the name is valid before updation every time. 
    })
    if(!doc){
        return next(new appError("No Doc defined by this ID",404)); // checks if tour is null and throws global err defined in utilities
    } 
    res.status(200).json({
        status:"Success",
        data:doc
    })
});



exports.createOne= Model=>catchAsync( async (req,res,next)=>{ /// create new docs
    const doc=await Model.create(req.body);
    res.status(201).json({
                status:"success",
                data:doc,
            })

});




exports.getOne= (Model,populate_options)=>catchAsync( async (req,res,next)=>{   
    if(!req.params.id) req.params.id=req.user.id
    const query= Model.findById(req.params.id);

    if(populate_options) {query.populate(populate_options);}
    const doc=await query;

    if(!doc){
        return next(new appError("No Document defined by this ID",404)); // checks if tour is null and throws global err defined in utilities
    } 
    res.status(200).json({ 
        status:"Success",
        data: doc
    });
    
});


exports.getAll= Model=>catchAsync(async (req,res,next)=>{    // get all tours
    //*  Using DB to save the new tour & Async await
    //^ 1st way of writing query (Mongoose method):
    // const tours= await tourModel.find().where('duration').equals(5).where('difficulty').equals('easy'); //find returns a query obj 

    //^ 2nd way of writing query (MongoDb method):
    /*const tours=await tourModel.find({
        difficulty:'easy',duration:5
    });
    Using 2nd method rn because we already get an obj coming from req.query that matches the way we write second method in param of find method. */
    
    //^ Execute Query
    let filter={}
    if(req.params.tourid) filter= {tour:req.params.tourid};
    const FilterFeature=new apiFeature(Model.find(filter),req.query).filter().sort().limitfield().paginate();
    // const doc=await FilterFeature.query.explain(); This is used to check our docs stats like how mny docs were queried for. And how many were examined in
    // how much time. was Useful for checking our indeces Check tourModel(tourSchema.index) for more info
    const doc=await FilterFeature.query;
    res.status(200).json({
        status: 'success',       // wrapped using jsend protocol with obj containing status and data with data wrapped in actual data 
        results: doc.length,
        data: {
            data: doc  // where the left-side tours is to specify that this resource here is also the name of endpoint
        }
    })
});
