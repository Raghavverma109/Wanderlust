const cloudinary = require('cloudinary').v2;
const multerCloudinary = require('multer-storage-cloudinary');

// This handles both old and new versions of the library
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary, 
    params: {
        folder: 'Wanderlust_dev',
        allowedFormats: ["png", "jpg", "jpeg"],
    },
});

module.exports = {
    cloudinary,
    storage
};