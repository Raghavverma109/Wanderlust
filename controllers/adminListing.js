const listing = require("../models/listing.js");
const axios = require('axios');

module.exports.adminCreateHotel = async (req, res) => {
    try {
        
        if (!req.body.listing) {
            req.flash("error", "Please provide valid listing data.");
            return res.redirect("/admin/hotel/new");
        }

        const { title, description, price, country, location, tags } = req.body.listing;

        if (description && description.length > 1000) {
            req.flash("error", "Maximum 1000 characters allowed!");
            return res.redirect("/admin/hotel/new");
        }

        let tagArray = [];
        if (tags) {
            tagArray = Array.isArray(tags) ? tags.map(tag => tag.trim()) : tags.split(',').map(tag => tag.trim());
        }

        if (tagArray.length > 3) {
            req.flash("error", "Maximum 3 tags are allowed!");
            return res.redirect("/admin/hotel/new");
        }

        // Get geocoding coordinates
        let geometry = { type: "Point", coordinates: [77.2090, 28.6139] }; // Default: New Delhi
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: location,
                    format: 'json',
                    limit: 1
                },
                headers: { 'User-Agent': 'Wanderlust_Admin' }
            });

            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                geometry = {
                    type: "Point",
                    coordinates: [parseFloat(lon), parseFloat(lat)]
                };
                console.log(`✅ Admin Geocoded: ${location} → [${lon}, ${lat}]`);
            } else {
                console.warn(`⚠️ Admin Location not found: ${location} (using default)`);
            }
        } catch (geoErr) {
            console.error("❌ Admin Geocoding failed:", geoErr.message);
        }

        const newListing = new listing({
            title,
            description,
            price,
            country,
            location,
            geometry: geometry,
            owner: req.user._id,
            image: [],
            tags: tagArray
        });

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                newListing.image.push({
                    url: file.path,
                    filename: file.filename
                });
            });
        }

        await newListing.save();
        req.flash("success", "Hotel listing created successfully!");
        res.redirect("/admin/dashboard");

    } catch (err) {
        console.error("Error creating hotel:", err);
        req.flash("error", "Error creating hotel: " + err.message);
        res.redirect("/admin/hotel/new");
    }
};

