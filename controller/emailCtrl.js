const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data, req, res) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // gmail hosted/sender
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_ID, //
      pass: process.env.MP, // # follow the step from this link to generate: https://support.google.com/accounts/answer/185833?hl=en
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Hey 👻" <abc@gmail.com>', // sender address
    to: data.to, // list of receivers
    subject: data.subject, // Subject line
    text: data.text, // plain text body
    html: data.htm, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
});

module.exports = sendEmail;

/*
To generate an app password for your Google account, you can follow these steps:
# follow the step from this link to generate: https://support.google.com/accounts/answer/185833?hl=en
You may be prompted to verify your account using two-factor authentication (2FA) if it's enabled. Follow the instructions to complete the verification process.
On the "App Passwords" page, select the app or device you want to generate the password for. If the app or device is not listed, you can choose the "Other (Custom name)" option.
Click on the "Generate" or "Create" button.
Google will generate a unique app password for you. Note down this password as it will be displayed only once. Make sure to use this password in your code instead of your actual Google account password.
Use the generated app password as the value for process.env.MP in your code.
Remember that app passwords are specific to the app or device you generate them for and can be revoked or regenerated if needed.
*/
