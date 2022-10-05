const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY) //exposes func which when given secretKey gives stripe obj.
const tourModel= require('./../models/tourModels')
const bookingModel= require('./../models/bookingModel')
const catchAsync= require('./../util-by-ash/catchAsync-sec9-vid7')
const factoryHandler=require('./factoryHandler'); // to delete tour
const appError=require('./../util-by-ash/global-err-handling')

exports.getCheckout_Session= catchAsync( async (req,res,next)=>{
//1) get Currently booked tour

    const bookedTour= await tourModel.findById(req.params.tourId)

//2) create checkout session
    const session= await stripe.checkout.sessions.create({
        payment_method_types: ['card'], 
        //! here we make queryString in sucess url becuz we need to make bookings doc after tour is successfully booked. Although this is not secure and will move to webHooks once proj gets deployed.
        success_url: `${req.protocol}://${req.get('host')}/my-bookings?tour=${req.params.tourId}&user=${req.user.id}&price=${bookedTour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`, // all stuff from starting till before line_items is session info & all these are stripe defined var names.
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
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

exports.createBookingCheckOut= catchAsync( async (req,res,next)=>{
    const {tour,user,price} = req.query
    if(!tour || !user || !price) return next()
    
    await bookingModel.create({tour,user,price}) //First we redirect user to Homepage from successUrl in above func with queryParams then we use those queryParams to create new Booking then
    return res.redirect(req.originalUrl.split('?')[0])  // We redirect user back to the homePage without the queryString attached. To make it a lil bit secure & as mentioned above suces url
    // we will later also implement this using webHooks.
})


exports.getAllBookings= factoryHandler.getAll(bookingModel);
exports.createNewBooking= factoryHandler.createOne(bookingModel);
exports.deleteBooking= factoryHandler.deleteOne(bookingModel);
exports.updateBooking= factoryHandler.updateOne(bookingModel);
exports.getBooking_byid= factoryHandler.getOne(bookingModel);

