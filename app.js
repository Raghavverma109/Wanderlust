if (process.env.NODE_ENV != "production") { 
    require('dotenv').config();
}

const port = 8080;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const multer = require('multer');
const cookieparser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const cors = require('cors');

// --- Models ---
const listing = require("./models/listing.js");
const User = require("./models/user.js");
const Blog = require("./models/blog.js");

// --- Utils & Config ---
const asyncwrap = require("./utils/error.js");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

// --- Middlewares ---
const { isLoggedIn, isAdmin, saveRedirectUrl, isOwner, isAuthor } = require("./middlewares/middleware.js");

// --- Controllers ---
const listingController = require('./controllers/listing.js');
const extraController = require('./controllers/listingExtras.js');
const adminListingController = require('./controllers/adminListing.js');
const adminController = require("./controllers/admin.js");
const userController = require("./controllers/user.js");
const profileController = require("./controllers/profile.js");
const otherController = require("./controllers/others.js");
const reviewController = require("./controllers/reviews.js");
const feedbackController = require('./controllers/feedback');
const bookingController = require("./controllers/booking.js");
const blogController = require("./controllers/blog");
const { contactUsController } = require("./controllers/contactUs.js");

// --- Database Connection ---
const dbUrl = process.env.ATLAS_DB_TOKEN;
async function main() {
    await mongoose.connect(dbUrl);
    console.log("database connected");
}
main().catch(err => console.log(err));

// --- View Engine & Middlewares ---
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieparser());
app.use(cors({
    origin: 'http://your-frontend-domain.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// --- Session & Flash ---
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600,
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// --- Passport Auth ---
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Global Locals ---
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user || null;
    res.locals.isLoggedIn = req.isAuthenticated() || false;

    if (req.user && req.user.profilePicture && req.user.profilePicture.purl) {
        res.locals.profilePic = req.user.profilePicture.purl.replace("/upload", "/upload/q_auto,e_blur:50,w_250,h_250");
    }

    const publicRoutes = ["/login", "/signup", "/forgot-password", "/", "/about", "/contact", "/terms", "/privacy", "/listing", "/feedback"];
    if (!req.isAuthenticated() && !publicRoutes.includes(req.path) && !req.path.startsWith('/listing/')) {
        req.flash("error", "Please sign in to continue.");
        return res.redirect("/listing");
    }
    next();
});

// ==========================================
//                ROUTES
// ==========================================

// --- Home & General ---
app.get("/", asyncwrap(async (req, res) => {
    const listings = await listing.find();
    res.render("index.ejs", { listings });
}));

// --- Main Listings ---
app.route("/listing")
    .get(asyncwrap(listingController.index))
    .post(isLoggedIn, upload.array('listing[image]', 4), asyncwrap(listingController.createpost));

app.get("/listing/new", isLoggedIn, asyncwrap(listingController.newpost));
app.post("/listing/search", asyncwrap(extraController.search));
app.get("/listing/top-listings", extraController.topListings);
// In app.js
app.get("/listing/nearby", asyncwrap(extraController.findNearby));

app.route("/listing/:id")
    .get(asyncwrap(listingController.showPost))
    .put(isLoggedIn, isOwner, upload.array('listing[image]', 4), asyncwrap(listingController.saveEditpost))
    .delete(isLoggedIn, isOwner, asyncwrap(listingController.deletepost));

app.get("/listing/:id/edit", isLoggedIn, isOwner, asyncwrap(listingController.editpost));
app.post('/listing/:id/like', isLoggedIn, asyncwrap(extraController.likeListing));

// --- Booking & Reviews ---
app.get('/listing/:id/booking', asyncwrap(extraController.bookinfFt));
app.post('/bookings/my-bookings/:id', asyncwrap(bookingController.confirmBooking));
app.post('/listing/:id/review', isLoggedIn, asyncwrap(reviewController.reviewPost));
app.delete("/listing/:id/review/:reviewId", isLoggedIn, isAuthor, asyncwrap(reviewController.deleteReview));

// --- Admin Section ---
app.get('/admin/dashboard', isLoggedIn, isAdmin, asyncwrap(adminController.dashboard));
app.get('/admin/users', isLoggedIn, isAdmin, asyncwrap(adminController.showuser));
app.delete('/admin/user/:id', isLoggedIn, isAdmin, asyncwrap(adminController.deleteUser));

// Admin Hotel Management
app.get('/admin/hotel/new', isLoggedIn, isAdmin, asyncwrap(adminListingController.adminNewHotelRender));
app.post('/admin/hotel/new', isLoggedIn, isAdmin, upload.array('listing[image]', 4), asyncwrap(adminListingController.adminCreateHotel));

// Admin Listing Actions
app.delete('/admin/listing/:id', isLoggedIn, isAdmin, asyncwrap(adminController.deleteListing));
app.get('/admin/listing/:id', isLoggedIn, isAdmin, asyncwrap(adminController.viewIndividualListing));
app.get('/admin/reviews/:id', isLoggedIn, isAdmin, asyncwrap(adminController.viewListingReview));
app.delete('/admin/listing/:id/reviews/:reviewId', isLoggedIn, isAdmin, asyncwrap(adminController.deleteListingReview));
app.get('/admin/listing/edit/:id', isLoggedIn, isAdmin, asyncwrap(adminController.adminListEditRender));
app.put('/admin/listing/edit/:id', isLoggedIn, isAdmin, upload.array('listing[image]', 10), asyncwrap(adminController.adminSaveEditList));

// Admin Feedback
app.get('/admin/feedbacks', isLoggedIn, isAdmin, asyncwrap(adminController.showFeedbacks));
app.delete('/admin/feedbacks/:id', isLoggedIn, isAdmin, asyncwrap(adminController.deleteFeedback));
app.post('/admin/feedbacks/:id/toggleDisplay', isLoggedIn, isAdmin, asyncwrap(adminController.displayFeedback));

// --- Auth Routes ---
app.route("/login")
    .get((req, res) => res.render("login.ejs"))
    .post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), (req, res) => {
        if (req.user.isAdmin) return res.redirect("/admin/dashboard");
        res.redirect(res.locals.redirectUrl || "/listing");
    });

app.get("/logout", userController.logout);
app.get("/signup", userController.signupRender);
app.post('/signup', asyncwrap(userController.siggnedUp));


// --- FEEDBACK ROUTES ---

// 1. GET: Display all approved feedbacks
app.get("/feedback", asyncwrap(feedbackController.renderFeedback));
// 2. POST: Handle feedback submission from the footer popup
app.post("/feedback", asyncwrap(feedbackController.feedbackPost));
    

// --- BLOG ROUTES ---

// 1. GET: Show all blogs (Sorted by newest first)
app.get('/blogs', isLoggedIn, asyncwrap(async (req, res) => {
    const blogs = await Blog.find({}).populate('blogOwner').sort({ createdAt: -1 });
    res.render('blog.ejs', { blogs });
}));

// 2. POST: Create a new blog story
app.post('/blogs', isLoggedIn, upload.single('blog[image]'), asyncwrap(async (req, res) => {
    if (!req.body.blog) {
        req.flash("error", "Invalid blog data provided.");
        return res.redirect("/blogs");
    }

    const { title, content, location } = req.body.blog;
    const newBlog = new Blog({
        title,
        content,
        location,
        blogOwner: req.user._id,
        images: req.file ? [{ imgUrl: req.file.path, imgFilename: req.file.filename }] : []
    });

    await newBlog.save();
    req.flash("success", "Blog post successfully created!");
    res.redirect('/blogs');
}));

// 3. POST: AJAX Like Toggle (No Refresh)
app.post('/blogs/:id/like', isLoggedIn, asyncwrap(async (req, res) => {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    const userId = req.user._id;

    // Safety: Ensure likes is an array before processing
    if (!Array.isArray(blog.likes)) {
        blog.likes = [];
    }

    const index = blog.likes.indexOf(userId);
    if (index === -1) {
        blog.likes.push(userId); // Add user ID
    } else {
        blog.likes.splice(index, 1); // Remove user ID
    }

    await blog.save();
    res.json({ success: true, likes: blog.likes.length });
}));

// 4. DELETE: Remove a blog story
app.delete('/blogs/:id', isLoggedIn, asyncwrap(async (req, res) => {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    // Authorization check: Only owner can delete
    if (!blog.blogOwner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to delete this.");
        return res.redirect(`/blogs`);
    }

    await Blog.findByIdAndDelete(id);
    req.flash("success", "Story deleted!");
    res.redirect('/blogs');
}));

// --- Others & Profile ---
app.get("/contact", otherController.contactPage);
app.post("/contact", asyncwrap(contactUsController));
app.get('/about', asyncwrap(otherController.aboutPage));
app.get('/profile', isLoggedIn, asyncwrap(profileController.viewProfile));
app.route('/profile/edit')
    .get(isLoggedIn, asyncwrap(profileController.profileGet))
    .post(isLoggedIn, upload.single('profilePicture'), asyncwrap(profileController.profilePost));

// --- Error Handling ---
app.use("*", (req, res) => res.render("not_found.ejs"));
app.use((err, req, res, next) => {
    const { status = 500, msg = "Something went wrong" } = err;
    console.log("The error is --> ", err);
    if (res.headersSent) return next(err);
    res.status(status).render("error.ejs", { msg, status });
});

app.listen(port, () => console.log("server is listening on port", port));
