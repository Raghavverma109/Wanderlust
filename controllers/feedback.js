const Feedback = require("../models/feedback");

module.exports.feedbackPost = async(req, res) => {
    try {
        if (!req.body.feedback) {
            req.flash("error", "No feedback data found!");
            return res.redirect("/listing");
        }
        
        const { name, rating, comment } = req.body.feedback;

        // Safety check for guest users
        const feedbackName = name || (req.user ? req.user.username : "Anonymous User");
        const feedbackRating = rating || 3;

        const newFeedback = new Feedback({
            name: feedbackName,
            rating: feedbackRating,
            comment,
        });

        await newFeedback.save();

        req.flash("success", "Thank you! Your feedback is under processing and will be displayed soon.");
        return res.redirect("/listing"); // Redirect to home/listing after submission
    }
    catch (err) {
        console.error("Feedback Error: ", err);
        req.flash("error", "Failed to submit feedback.");
        return res.redirect("/listing");
    }
}

module.exports.renderFeedback = async(req, res) => {
    try{
        const feedbacks = await Feedback.find({ display: true });
        res.render("displayFeedback.ejs", {feedbacks});
    }
    catch {
        req.flash("error", "Error in fetching feedbacks!")
        return res.redirect("/listing");
    }
    
}