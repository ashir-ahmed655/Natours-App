const nodemailer= require('nodemailer');
const pug= require('pug');
const html_To_Text= require('html-to-text');


module.exports= class Email{  //using class to abstract info from one complex send func into multiple parts
    constructor(user,url){ // takes in all necessary info
        this.to= user.email
        this.from=  `Ashir Ahmed <${process.env.EMAIL_FROM}>` //Need verified single senderVerification from sendGrid --see their website
        this.user_firstName= user.name.split(' ')[0]
        this.url= url 
    }

    makingTransport(){ // creates transport for different environments
        if(process.env.NODE_ENV==='production') { // Using SendGrid.
            console.log("In Send Grid")
        return nodemailer.createTransport({
            service:'SendGrid',          
            auth:{
                user:process.env.SENDGRID_USERNAME,
                pass:process.env.SENDGRID_PASSWORD
            }
        });
           
        }

         //* 1) Create Transporter
        return nodemailer.createTransport({
            host:"smtp.mailtrap.io",   // can use gmail but won't because of cap of 500 emails per day. Hence now using dev-mailtrap because in dev 
            port:process.env.MAILTRAP_PORT,                  //  Will use some other service in future for production. ie: SendGrid or MailGun
            auth:{
                user:process.env.MAILTRAP_USER,
                pass:process.env.MAILTRAP_PASS
            }
        })
    }

    async send(template,subject){ // will actually send email... 
    //1) Render html based on pug templates
        //!NOTE: we made pug temp by doing res.render(template name) which first created the html from pug template then sent that html using response obj. Here we just wanna create html
        //! sending it will be done using nodeMailer. 
        const html= pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{ name:this.user_firstName, url: this.url, subject: subject})
        
    //2) Define Email Options
    const mailOptions={
        from:     this.from,
        to:       this.to, // will be passed as an arg in this func.
        subject:  subject,
        text:     html_To_Text.fromString(html), // to send text instead of html. to let google crawl through the mail & decide to not mark as spam. & also if someone prefers plain email.html-to-texy
        html:     html // to send html
    }

    //3) Create transport & actually send email.
       await this.makingTransport().sendMail(mailOptions); // returns promise... // makingTransport method will create transport on which we call sendMail to actually send email

    }


    async sendWelcome(){  // will call these kinda methods when need to do stuff like sending welcome or resetting pass which will instead call send with template & message 
        // abstracting this kinda stuff from our main code.
      await this.send("welcome","Welcome to Natours Family.") // becuz send would end with a sendMail func returning promise hence we use await here also to make sure email is sent before
                                                              // moving forward.
    }

    async sendResetPass_mail(){
        await this.send('passwordReset', "Password Reset Token (Valid for 10mins)")
    }
}


// module.exports= send_email; // need to delete this one will delete after 2/3 vids ::coming from 9th vid in 2nd last sec.