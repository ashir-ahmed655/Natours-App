import axios from 'axios'
import { showAlert } from './alert';

export const login= async (email,password)=>{

    try{
    const res= await axios({ //Only modern browsers can run this async await code.
        method:'POST',
        url:'/api/v1/users/login',  //'http://127.0.0.1:6969/api/v1/users/login' used this but now using relative url becuz app & api will be hosted on same server
        data:{
            email:email,  // 1st email is the email sent in req.body 2nd is the email parameter in this func.
            password:password
        }
    })
    // console.log(res);
    if(res.data.status==='success'){ // checking if we sent res success after hitting the above url successfully.
        // console.log("Success");
        showAlert('success','Logged In Successfully')
        window.setTimeout(()=>{
            location.assign('/') // reload the home-page
        },1200)
    }
}
    catch(err){ 
        console.log("Error")
        showAlert('error',err.response.data.message);}
}

export const logout= async ()=>{
    try{
        const res= await axios({
            method:'GET',
            url:'/api/v1/users/logout',
        })
        if(res.data.status==="success"){
            showAlert('success',"Logged Out Successfully")
            window.setTimeout(()=>{
                location.reload(true) // if true the reload comes from server else. It comes from browser cache which can still retain old data. 
            },1500);
           
        }
    }catch(Err) {
        // console.log(Err)
        showAlert("error","Error Logging Out.")
    }
}