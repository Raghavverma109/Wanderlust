const listing = require("../models/listing.js");
const review = require("../models/reviews.js");
const User=require("../models/user.js");
const Feedback=require("../models/feedback.js");
// const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); 
// const maptoken = process.env.MAP_TOKEN;
// const geocodingClient = mbxgeocoding({ accessToken: maptoken });
const axios = require('axios');



module.exports.dashboard = async (req, res) => {
    try {
      const listings = await listing.find().populate('owner');;
      // console.log(listings.owner);
      res.render('adminDashboard', { listings });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).send('Internal Server Error');
    }
  };

  
  //manage users
module.exports.showuser = async (req, res) => {
    try {
      const users = await User.find();
      // console.log(users);
      res.render('manageUser', { users });
    } catch (error) {
        console.error('Error fetching Users:', error);
        res.status(500).send('Internal Server Error');
    }
  };
  
  //route to delete users
module.exports.deleteUser = async (req, res) => {
    try {
      // console.log("Deleting user with ID:", req.params.id);
        await User.findByIdAndDelete(req.params.id);
        req.flash('success', 'User deleted!');
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send('Error deleting user: ' + error.message);
    }
  };
  
  // Route to DELETE listings
module.exports.deleteListing = async (req, res) => {
    try {
      // console.log("Deleting listing with ID:", req.params.id);
        await listing.findByIdAndDelete(req.params.id);
        req.flash('success', 'Listing deleted!');
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send('Error deleting listing: ' + error.message);
    }
  };
  
  
  // View manage listing from admin dashboard
module.exports.viewIndividualListing = async (req, res) => {
    try {
      const {id}=req.params;
      // console.log(id);
      const list = await listing.findById(id);
      // console.log(list);
      if (!list) {
          return res.status(404).send('Listing not found');
      }
      res.render('view_manage_listing.ejs', { list }); // Create a new view file called show.ejs or similar
  } catch (err) {
      res.status(500).send(err.message);
  }
  };
  
  // View listing's reviews from admin dashboard
module.exports.viewListingReview = async (req, res) => {
    try {
      const {id}=req.params;
      // console.log(id);
      const list = await listing.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    })
    .populate('owner');
  
      // console.log(list.reviews[0].author.username);
  
      if (!list) {
          return res.status(404).send('Listing not found');
      }
      res.render('view_reviews.ejs', { list }); // Create a new view file called show.ejs or similar
  } catch (err) {
      res.status(500).send(err.message);
  }
  };
  
  module.exports.deleteListingReview = (async (req,res) =>{
    let {id,reviewId} =req.params;
    await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}}); //update the listing-reviews array where review id matched rid
    await review.findByIdAndDelete(reviewId); //deconstructing parameters
    req.flash("success", "Review Deleted!");
    res.redirect(`/admin/reviews/${id}`);
})

  
  // Render show edit form
module.exports.adminListEditRender = async (req, res) => {
    const tags = ["Trending", "Surfing", "Amazing cities", "Beach", "Farms", "Lake", "Castles", "Rooms", "Forest", "Pool"];
    try {
      // console.log(req.params.id);
      const list = await listing.findById(req.params.id);
      // console.log(list);
      if (!list){
        return res.status(404).send("Listing not found");
      }
      res.render('edit_list_admin', { list , tags});
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  };
  
  
// update listing admin
module.exports.adminSaveEditList = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, location, country, tags } = req.body.listing;
    
    try {
        if (!req.body.listing) {
            req.flash('error', "Valid data required");
            return res.redirect(`/admin/listing/edit/${id}`);
        }

        // 1. Find existing listing
        const up_listing = await listing.findById(id);
        if (!up_listing) {
            req.flash('error', "Listing not found");
            return res.redirect("/admin/dashboard");
        }

        // 2. Handle Geocoding (Nominatim Free Alternative)
        let updatedGeometry = up_listing.geometry; // Keep old geometry as default
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: location, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'Wanderlust_Admin' }
            });

            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                updatedGeometry = {
                    type: "Point",
                    coordinates: [parseFloat(lon), parseFloat(lat)]
                };
            }
        } catch (geoErr) {
            console.error("Geocoding failed, keeping old coordinates");
        }

        // 3. Update Text Fields
        up_listing.title = title;
        up_listing.description = description;
        up_listing.price = price;
        up_listing.location = location;
        up_listing.country = country;
        up_listing.geometry = updatedGeometry;

        // 4. Update Tags
        if (tags) {
            up_listing.tags = Array.isArray(tags) ? tags.map(t => t.trim()) : tags.split(',').map(t => t.trim());
        }

        // 5. CRITICAL FIX: Update images ONLY if new ones are uploaded
        // Inside adminSaveEditList
// ONLY update images if new files are uploaded
if (req.files && req.files.length > 0) {
            up_listing.image = req.files.map(file => ({
                url: file.path,
                filename: file.filename
            }));
        }
// If req.files is empty, up_listing.image keeps its old value.
        // If no files are uploaded, up_listing.image remains exactly as it was.

        // 6. CRITICAL FIX: Ensure owner is not lost
        // Mongoose sometimes loses the reference if not careful; this ensures it stays.
        if (!up_listing.owner) {
             // Fallback if owner was somehow missing
             up_listing.owner = req.user._id; 
        }

        await up_listing.save();
        req.flash('success', "Listing updated successfully!");
        res.redirect(`/admin/dashboard`);

    } catch (error) {
        console.error("Validation Error Details:", error.errors);
        req.flash('error', "Update failed: " + error.message);
        res.redirect(`/admin/listing/edit/${id}`);
    }
};

  
  // Route for show all the feedback
  module.exports.showFeedbacks = async (req, res) => {
    try {
      const feedbacks = await Feedback.find();
      // console.log(users);
      res.render('manageFeedback', { feedbacks });
    } catch (error) {
        console.error('Error fetching Users:', error);
        res.status(500).send('Internal Server Error');
    }
  };


//route to delete feedback
module.exports.deleteFeedback = async (req, res) => {
  try {
    // console.log("Deleting user with ID:", req.params.id);
      await Feedback.findByIdAndDelete(req.params.id);
      req.flash('success', 'Feedback deleted successfully!');
      res.redirect('/admin/feedbacks');
  } catch (error) {
      req.flash('error', 'ERROR in delete feedback operation! Try again latter.');
      res.redirect('/admin/feedbacks');
      res.status(500).send('Error deleting user: ' + error.message);
  }
};

module.exports.displayFeedback = async(req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
        req.flash('error', 'Feedback not found.');
        return res.redirect('/admin/feedbacks');
    }
    
    // Toggle the display field
    feedback.display = !feedback.display;
    await feedback.save();
    
    // req.flash('success', `Feedback display set to ${feedback.display ? 'true' : 'false'}.`);

    if(feedback.display){
      req.flash('success', "This feedback displayed now in user end!");
    }
    else{
      req.flash('success', "This feedback is hide now in user end!");
    }

    res.redirect('/admin/feedbacks');
} catch (err) {
    console.error(err);
    req.flash('error', 'Could not toggle for display the feedback, try again latter!');
    res.redirect('/admin/feedbacks');
}
}