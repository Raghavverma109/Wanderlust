// utils/mailSender.js
const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            // FIX: The host must be the SMTP server URL, NOT your email address
            host: "smtp.gmail.com", 
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER, // Your email: raghu.verma.1544@gmail.com
                pass: process.env.MAIL_PASS, // Your 16-digit App Password
            },
        });

        let info = await transporter.sendMail({
            from: `"Aerovia" <${process.env.MAIL_USER}>`,
            to: `${email}`, 
            subject: `${title}`,
            html: `${body}`,
        });

        return info;
    } catch (error) {
        // This will now catch the DNS or Auth errors properly
        console.error("MAILER ERROR:", error.message);
        throw error; 
    }
};

module.exports = mailSender;