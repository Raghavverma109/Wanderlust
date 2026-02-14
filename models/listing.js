const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const imageSchema = new Schema({
  filename: {
    type: String, 
  },
  url: {
    type: String,
    required: true,
  },
});

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: [imageSchema],
  price: Number,
  location: String,
  country: String,
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  likes: {
    type: Number,
    default: 0, 
  },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [String]
});

// --- GEOSPATIAL INDEX ---
// This enables $near and $geoWithin queries
listingSchema.index({ geometry: "2dsphere" });

// Middleware to clean up reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const listing = mongoose.model("listing", listingSchema);
module.exports = listing;