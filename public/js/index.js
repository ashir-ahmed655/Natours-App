import '@babel/polyfill'; // added as 1st line to make es6 syntax work in older browser as well.
import { displayMap } from './mapbox'
import { login, logout } from './login' // similar to require but this is es6 syntax we've been doing common module syntax till now. Using this becuz parcel
import { update_userInfo, updatePassword } from './updateUserProfile_Password' //doesn't understand common module but js & es6 syntax.
import { bookTour } from './stripe' 

//^ This index.js file is used for taking data from front end and delegating it to other funcs imported from other files.

//! DOM ELEMENTS:
const mapBox= document.getElementById('map');
const loginPage= document.querySelector('.form--loogin'); //name stupid becuz we couldn't use prev(.form) becuz we needed it to send updates from
                                                                 // another form(Think account updation form (chk account.pug))
const logoutBtn= document.querySelector('.nav__el--logout') // class present on logout btn
const userProfileForm= document.querySelector('.form-user-data')
const userPassForm= document.querySelector('.form-user-password')
const bookTourBtn= document.getElementById('book-tour')

//! DELEGATING METHODS:
if(mapBox){ // If html has an element with id 'map' then mapbox will be called.Assuming only tours detail page have an element with id 'map'
    //We first put all location data(json format) in html in map-id in data-var_name(here locations). Here we get that json data from dataset.
    const locations= JSON.parse(mapBox.dataset.location); 
    //  console.log(locations)
     
    displayMap(locations);

}

if(loginPage){
loginPage.addEventListener('submit',e=>{
    e.preventDefault();
    const email= document.getElementById('email').value;
    const password= document.getElementById('password').value;
    login(email,password);

})}

if(logoutBtn){
    logoutBtn.addEventListener('click',logout)
}


if(userProfileForm){
    userProfileForm.addEventListener('submit',e=>{
        e.preventDefault();
        const form= new FormData();
        form.append('name',document.getElementById('name').value); // here 1st is called key 2nd is called value. //keyValue pairs
        form.append('email',document.getElementById('email').value);
        form.append('photo',document.getElementById('photo').files[0]) // since type file in html is always an array hence selecting 1st ele only.
        // const userName= document.getElementById('name').value //! not needed anymore.
        // const email= document.getElementById('email').value
        // console.log(form) //this form is not a regular js obj It gives iterables when accessing vals/keys using methods in its docmentation
        update_userInfo(form);
    })

}


if(userPassForm){
    userPassForm.addEventListener('submit',async e =>{
        e.preventDefault();
        document.querySelector('.btn-save-pass').innerHTML= "Saving..."
        const Current_pass=document.getElementById('password-current').value;
        const Change_pass=document.getElementById('password').value;
        const Change_pass_Confirm=document.getElementById('password-confirm').value;

        await updatePassword(Current_pass,Change_pass,Change_pass_Confirm);
         document.querySelector('.btn-save-pass').innerHTML= "Save password"
         document.getElementById('password-current').value='';  //Setting fields in website to empty 
         document.getElementById('password').value='';      
         document.getElementById('password-confirm').value='';

    })
}


if(bookTourBtn){
    bookTourBtn.addEventListener('click',e=>{
        e.target.textContent= 'Processing...' 
        const tourId= e.target.dataset.tourid    //where e.target is the component that fired the event(here click event). & on that we access tour-Id var
        bookTour(tourId)                        // Note: in js (-) represents camelCase ie: tour-Id would become tourId even if (i wasn't capital like tour-id would also become tourId)
    })
}