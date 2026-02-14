const listing = require("../models/listing.js");
const axios = require('axios');
const mongoose = require('mongoose');
const { 
    ERROR_LISTING_NOT_FOUND, 
    ERROR_LOAD_EDIT_PAGE, 
    SUCCESS_LISTING_UPDATED, 
    SUCCESS_LISTING_DELETED 
} = require('../constants.js');

// --- 1. INDEX: DISPLAY ALL LISTINGS ---
module.exports.index = async (req, res) => {
    try {
        const { tag } = req.query;
        let listings = tag ? await listing.find({ tags: { $in: [tag] } }) : await listing.find({});
        
        if (tag && listings.length === 0) {
            req.flash('error', `No listings found for the tag "${tag}".`);
            return res.redirect("/listing");
        }
        res.render("index.ejs", { listings, tag });
    } catch (err) {
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
};

// --- 2. NEW: RENDER CREATE FORM ---
module.exports.newpost = async (req, res) => {
    const tags = ["Trending", "Surfing", "Amazing cities", "Beach", "Farms", "Lake", "Castles", "Rooms", "Forest", "Pool"];
    res.render("new.ejs", { tags });
};

// --- 3. CREATE: SAVE NEW LISTING ---
module.exports.createpost = async (req, res) => {
    const { title, description, price, country, location, tags } = req.body.listing;
    let tagArray = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [];
    
    // SANITIZE: Remove parentheses and brackets
    let sanitizedLocation = location.replace(/[()\[\]]/g, '').trim();
    let geometry = { type: "Point", coordinates: [77.2090, 28.6139] }; // Default: New Delhi

    try {
        // ATTEMPT 1: Search with the cleaned, full address
        let response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: sanitizedLocation, format: 'json', limit: 1, addressdetails: 1 },
            headers: { 'User-Agent': 'Wanderlust_Travel_App' }
        });

        // ATTEMPT 2: FALLBACK - If specific fails, try city only
        if (!response.data || response.data.length === 0) {
            console.warn(`⚠️ Specific location failed: ${sanitizedLocation}. Trying city fallback...`);
            const parts = sanitizedLocation.split(',');
            const cityOnly = parts[parts.length - 1].trim();

            response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: cityOnly, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'Wanderlust_Travel_App' }
            });
        }

        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            geometry = {
                type: "Point",
                coordinates: [parseFloat(lon), parseFloat(lat)]
            };
            console.log(`✅ Success: ${location} mapped to [${lon}, ${lat}]`);
        }
    } catch (err) {
        console.error("❌ Geocoding API Error:", err.message);
    }

    const newListing = new listing({ ...req.body.listing, geometry, owner: req.user._id, tags: tagArray });
    if (req.files) req.files.forEach(f => newListing.image.push({ url: f.path, filename: f.filename }));
    
    await newListing.save();
    req.flash("success", "Listing created!");
    res.redirect("/listing");
};

// --- 4. SHOW: VIEW SINGLE LISTING ---
module.exports.showPost = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid listing ID');
        return res.redirect('/listing');
    }
    const list = await listing.findById(id).populate({ path: 'reviews', populate: { path: 'author' } }).populate('owner');
    
    if (!list) {
        req.flash('error', 'Listing not found');
        return res.redirect('/listing');
    }
    let userHasReviewed = req.user && list.reviews.some(rev => rev.author?.equals(req.user._id));
    res.render('show.ejs', { list, userHasReviewed });
};

// --- 5. EDIT: RENDER EDIT FORM ---
module.exports.editpost = async (req, res) => {
    const tags = ["Trending", "Surfing", "Amazing cities", "Beach", "Farms", "Lake", "Castles", "Rooms", "Forest", "Pool"];
    const { id } = req.params;
    const list = await listing.findById(id);
    if (!list) {
        req.flash('error', ERROR_LISTING_NOT_FOUND);
        return res.redirect('/listing');
    }
    res.render("edit.ejs", { list, tags });
};

// --- 6. UPDATE: SAVE EDITED LISTING ---
module.exports.saveEditpost = async (req, res) => {
    const { id } = req.params;
    const { location, tags } = req.body.listing;

    // ROBUST GEOCODING LOGIC (With Sanitization & Fallback)
    let sanitizedLocation = location.replace(/[()\[\]]/g, '').trim();
    let updatedGeometry = { type: "Point", coordinates: [77.2090, 28.6139] }; 

    try {
        let response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: sanitizedLocation, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'Wanderlust_App' }
        });

        if (!response.data || response.data.length === 0) {
            console.warn(`⚠️ Edit: Specific location failed. Trying city fallback for: ${sanitizedLocation}`);
            const parts = sanitizedLocation.split(',');
            const cityOnly = parts[parts.length - 1].trim();
            
            response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: cityOnly, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'Wanderlust_App' }
            });
        }

        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            updatedGeometry.coordinates = [parseFloat(lon), parseFloat(lat)];
            console.log(`✅ Edit Geocoded: ${sanitizedLocation} → [${lon}, ${lat}]`);
        }
    } catch (e) { 
        console.error("❌ Edit geocoding failed:", e.message); 
    }

    let editList = await listing.findById(id);
    if (!editList) {
        req.flash('error', ERROR_LISTING_NOT_FOUND);
        return res.redirect('/listing');
    }

    // HANDLE IMAGES: Append new uploads to existing array
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        editList.image.push(...newImages);
    }

    // HANDLE TAGS
    let tagArray = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [];

    // UPDATE FIELDS & SAVE (Using Object.assign for efficiency)
    Object.assign(editList, req.body.listing);
    editList.geometry = updatedGeometry;
    editList.tags = tagArray;

    await editList.save();
    req.flash('success', SUCCESS_LISTING_UPDATED);
    res.redirect(`/listing/${id}`);
};

// --- 7. DELETE: REMOVE LISTING ---
module.exports.deletepost = async (req, res) => {
    await listing.findByIdAndDelete(req.params.id);
    req.flash("success", SUCCESS_LISTING_DELETED);
    res.redirect("/listing");
};

