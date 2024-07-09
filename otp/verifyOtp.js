const nodemailer = require("nodemailer");

const otpgenerator = require("otp-generator");

const generateOTP = () => {
    const otp = otpgenerator.generate(6,{
        upperCaseAlphabets:false,
        specialChars:false,
        lowerCaseAlphabets:false,
        digits:true
    });
    
    return {otp,timeStamp:Date.now()};
};

const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
        user:process.env.Email_auth,
        pass:process.env.Email_pass
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
    },
});

//sent otp to mail for forget password

const sendOtp = async (email, otp) => {
    const mailOptions = {
        from: `Athlete <${process.env.Email_auth}>`,
        to: email,
        subject: 'Your otp for  Athlete verification',
        text: `Hi, Your OTP is ${otp}`
    };

    try {
       // console.log('xxx');
        const info = await transporter.sendMail(mailOptions);
       // console.log("Email send Successfull: ", info.response);
      //console.log(otp);
        return otp;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send otp');
    }
};


module.exports = { sendOtp,generateOTP };