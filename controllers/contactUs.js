// controllers/contactUs.js
const { contactUsEmail } = require("../mail/template/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
    const { firstname, lastname, email, message, subject } = req.body;

    try {
        // 1. Send confirmation to the USER
        await mailSender(
            email,
            "We received your message - Aerovia",
            contactUsEmail(email, firstname, lastname, message)
        );

        // 2. Send the actual query to the ADMIN
        await mailSender(
            process.env.ADMIN_EMAIL,
            `NEW CONTACT FORM: ${subject}`,
            `<p>New message from ${firstname} ${lastname} (${email}):</p><p>${message}</p>`
        );

        req.flash("success", "Your response saved successfully!");
        return res.redirect("/contact");

    } catch (error) {
        console.error("CONTROLLER MAIL ERROR:", error.message);
        req.flash("error", "Failed to send message. Please check your internet or SMTP settings.");
        return res.redirect("/contact");
    }
};