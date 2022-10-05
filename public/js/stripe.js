const stripe = Stripe("pk_test_51LopSlIkUpKKxr58KHKIROQYdrkgmVcnI6RqfT3SQvkclDaHF7atuyXtPO4Kdu7N6xc04BRcvs1ohHjb8y9DEPnu00SjBtEkKF") //publicKey got from my stripe account Also this Stripe
import axios from 'axios'                                  // obj was gotten from having stripe script in our tour pug
import { showAlert } from './alert';

export const bookTour= async tourId=>{
    try{
        //1) get chckout session from api
        const session = await axios(`/api/v1/bookings/checkoutSession/${tourId}`)  //simple get req from axios else we also have a complex way in other files in this js folder.
        // console.log(session)

        //2) create checkoutForm & charge the card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id // where sessionId is present on our session Obj as we saw in consoleLog it was in data/session/id
        })
        //3) 

    } catch(err){
        console.log(err);
        showAlert('error',err);
    }
}  