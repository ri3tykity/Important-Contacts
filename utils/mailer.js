require('dotenv').config();
const nodemailer = require('nodemailer');

exports.sendMail = function () {

  let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.EMAIL_USER_ID,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const message = {
    from: 'elonmusk@tesla.com',
    to: 'to@email.com',
    subject: 'Design Your Model S Super | Tesla',
    html: '<h1>Have the most fun you can in a car!</h1><p>Get your <b>Tesla</b> today!</p><br>Thanks!!!'
  };

  transport.sendMail(message, function (err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
  });
}