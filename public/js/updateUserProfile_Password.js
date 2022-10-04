import axios from 'axios'
import { showAlert } from './alert'

export const update_userInfo= async (form)=>{
  
    try{
        const updated_User= await axios({
            method:"Patch",
            url:"http://127.0.0.1:6969/api/v1/users/update-my-Profile",
            data:form
        })

    // console.log(updated_User);
    if(updated_User.data.status==="success"){
        showAlert('success',"User Profile Updated Successfully")
        window.setTimeout(()=>{
            location.assign('/me')
        },1300)
    }}
    catch(err){
        showAlert('error',err.response.data.message)
    }
    
}


export const updatePassword= async (password,change_password,change_passwordConfirm)=>{
    try{
        const resp= await axios({
            method:"Patch",
            url:"http://127.0.0.1:6969/api/v1/users/updatePassword",
            data:{
                password,
                change_password,
                change_passwordConfirm
            }
        })

        if(resp.data.status==="success"){
            showAlert("success","Password Updated Successfully")
        }
    }catch(err){
        console.log(err);
        
        showAlert('error',err.response.data.message);
    }
}




