const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY); //exposes func which when given secretKey gives stripe obj.
const tourModel= require('./../models/tourModels');
const bookingModel= require('./../models/bookingModel');
const userModel= require('./../models/userModels');
const catchAsync= require('./../util-by-ash/catchAsync-sec9-vid7')
const factoryHandler=require('./factoryHandler'); // to delete tour
const appError=require('./../util-by-ash/global-err-handling');
const ExpressMongoSanitize = require('express-mongo-sanitize');

exports.getCheckout_Session= catchAsync( async (req,res,next)=>{
//1) get Currently booked tour

    const bookedTour= await tourModel.findById(req.params.tourId)

//2) create checkout session
//* Note: We replaced our insecure way of making booking doc after success url is hit with a secure one (web-hook one) Hence we didn't need below 2 lines so commented out, but kept code
//* for future references.
//! here we make queryString in sucess url becuz we need to make bookings doc after tour is successfully booked. Although this is not secure and will move to webHooks once proj gets deployed.
//    success_url: `${req.protocol}://${req.get('host')}/my-bookings?tour=${req.params.tourId}&user=${req.user.id}&price=${bookedTour.price}`,
    const session= await stripe.checkout.sessions.create({
        payment_method_types: ['card'], 
        success_url: `${req.protocol}://${req.get('host')}/my-bookings`, // secure way Using web-Hooks
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`, // all stuff from starting till before line_items is session info & all these are stripe defined var names.
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, // set this field to tourId so that we can later reference it while using web-hooks(might be useful to make booking doc)
        mode: 'payment',


        line_items:[{ // info of what user is gonna purchase 
            price_data:{
                unit_amount: bookedTour.price*100,
                currency: 'usd',
                product_data: {
                            name: `${bookedTour.name}`,
                            description: bookedTour.summary,
                            images: [`https://www.natours.dev/img/tours/${bookedTour.imageCover}`], //imgs need to be live ie: hosted somewhere.
                        },
            },
        quantity: 1,
    }],
    

    })

  
//3) create sessions as response
res.status(200).json({
    status: 'success',
    session: session
})

})

// exports.createBookingCheckOut= catchAsync( async (req,res,next)=>{
//     const {tour,user,price} = req.query
//     if(!tour || !user || !price) return next()
    
//     await bookingModel.create({tour,user,price}) //First we redirect user to Homepage from successUrl in above func with queryParams then we use those queryParams to create new Booking then
//     return res.redirect(req.originalUrl.split('?')[0])  // We redirect user back to the homePage without the queryString attached. To make it a lil bit secure & as mentioned above suces url
//     // we will later also implement this using webHooks.
// })


const createBookingCheckOut=  async sessionData=>{ // here sessionData is the same session that we made in above getChkoutSesssion but returned to us from stripe by listening to
    const tour= sessionData.client_reference_id              // the event(checkout.session.completed)
    const user= (await userModel.findOne({ email: sessionData.customer_email})).id 
    const price= (sessionData.object.amount_total) /100 // since stripe takes the min amount of that currency($=>pence) so there we conv. it but need $ here to make bookingDoc
    await bookingModel.create({tour,user,price})

}

exports.webHookCheckout= (req,res,next)=>{
    const signature= req.headers['stripe-signature']; // Stripe adds this signature to our headers when we hit the above controler func (getChkOut Session).
    let event //declared outside try/catch so that we have access to this event and it doesn't get scope-blocked by stripe.
    try{
     event= stripe.webhooks.constructEvent(req.body,signature,process.env.WEBHOOK_SECRET); // here it is mandatory our body should be a bufferStream or string so 
    //we had to place that appJs route before converting it to Json. So it takes params as: buffer Body & signature it set on Headers & secret we got from Stripe WebHook dashboard.
    }catch(err){
        return res.status(400).send(`WebHook error ${err.message}`) // sending the error to Stripe cause this implementation hidden from us, only stripe can tell what's wrong.
    }
    if(event.type==="checkout.session.completed"){ // just to be double sure that the event we listened to, is the event we got from Stripe.

        createBookingCheckOut(event.data.object); //passing sessionObj returned from Stripe 
        }
    res.status(200).json({receivedSessionData: true}) // send response to Stripe so that we can later look at it in our Stripe DashBoard.
    
}

exports.getAllBookings= factoryHandler.getAll(bookingModel);
exports.createNewBooking= factoryHandler.createOne(bookingModel);
exports.deleteBooking= factoryHandler.deleteOne(bookingModel);
exports.updateBooking= factoryHandler.updateOne(bookingModel);
exports.getBooking_byid= factoryHandler.getOne(bookingModel);

