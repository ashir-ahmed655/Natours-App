// Rendering a alert page for login 


export const hideAlert= ()=>{
    const alert_present= document.querySelector('.alert');
    if(alert_present) alert_present.parentElement.removeChild(alert_present); //remove alert.
}

//type can be success/error depending on login status.
export const showAlert= (type,message)=>{
    hideAlert(); // to hide if some alert was present.
    const generateHTML= `<div class="alert alert--${type}">${message}</div>`; //since already made css files have alert,alert--success/error 
    document.querySelector('body').insertAdjacentHTML('afterbegin',generateHTML);
    window.setTimeout(hideAlert,4000) // hide alert after 4secs
}
