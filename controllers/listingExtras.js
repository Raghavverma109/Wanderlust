const listing = require("../models/listing.js");

// --- SEARCH ---
module.exports.search = async (req, res) => {
    const { query } = req.body;
    if (!query?.trim()) {
        req.flash("error", "Please enter a search term.");
        return res.redirect("/listing");
    }
    const regex = new RegExp(query.trim(), 'i');
    const results = await listing.find({ $or: [{ country: regex }, { title: regex }] });
    if (results.length === 0) {
        req.flash("error", "No listing found");
        return res.redirect("/listing");
    }
    res.render("search.ejs", { results });
};

// --- LIKE ---
module.exports.likeListing = async (req, res) => {
    const foundListing = await listing.findById(req.params.id);
    const userId = req.user._id;
    const hasLiked = foundListing.likedBy.includes(userId);

    if (hasLiked) {
        foundListing.likes -= 1;
        foundListing.likedBy.pull(userId);
    } else {
        foundListing.likes += 1;
        foundListing.likedBy.push(userId);
    }
    await foundListing.save();
    req.flash('success', hasLiked ? 'Like removed!' : 'Listing liked!');
    res.redirect(`/listing/${req.params.id}`);
};

// --- TOP LISTINGS (The missing function causing the crash) ---
module.exports.topListings = async (req, res) => {
    try {
        const listings = await listing.find().populate('reviews');
        const topRatedListings = listings.filter(listing => {
            if (listing.reviews.length === 0) return false;
            const avgRating = listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length;
            return avgRating >= 4;
        });
        res.render("top_listing_page.ejs", { listings: topRatedListings });
    } catch (err) {
        console.error("Error fetching top listings:", err);
        req.flash("error", "Could not load top listings.");
        res.redirect("/");
    }
};

// --- BOOKING RENDER ---
module.exports.bookinfFt = async (req, res) => {
    const list = await listing.findById(req.params.id);
    if (!list) {
        req.flash("error", "Listing not found");
        return res.redirect("/listing");
    }
    res.render('booking', { list: list });
};

// controllers/listingExtras.js

module.exports.findNearby = async (req, res) => {
    try {
        const { lng, lat } = req.query;
        
        // Find listings within 50km
        const nearbyListings = await listing.find({
            geometry: {
                $near: {
                    $geometry: { 
                        type: "Point", 
                        coordinates: [parseFloat(lng), parseFloat(lat)] 
                    },
                    $maxDistance: 50000 // meters
                }
            }
        });

        res.render("index.ejs", { listings: nearbyListings, tag: "Nearby You" });
    } catch (err) {
        req.flash("error", "Could not find nearby listings.");
        res.redirect("/listing");
    }
};