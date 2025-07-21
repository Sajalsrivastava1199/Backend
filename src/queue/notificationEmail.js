import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME, // Your email address
        pass: process.env.EMAIL_PASSWORD  // Your email password or app password
    },
})

async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME, // Sender address
        to: to,
        subject: subject,
        text: text
    };

    await transporter.sendMail(mailOptions)
}   

export {sendEmail};