const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

transporter.sendMail({
  from: `"Prastav" <${process.env.EMAIL_FROM}>`,
  to: process.env.EMAIL_USER,
  subject: 'Prastav Gmail SMTP Test',
  html: '<h2 style="color:#2d6a4f">Gmail SMTP is working!</h2><p>Prastav email service configured correctly.</p><p>OTP emails will now be sent to real users!</p>'
}).then(() => {
  console.log('SUCCESS! Email sent to', process.env.EMAIL_USER);
}).catch(err => {
  console.error('FAILED:', err.message);
});
