const User= require("../models/user.js");
const Blog = require("../models/blog.js");


// 1. INDEX - Show all blogs
module.exports.index = async (req, res) => {
    // Populate owner to show usernames
    const blogs = await Blog.find({}).populate("blogOwner").sort({ createdAt: -1 });
    res.render("blog.ejs", { blogs });
};

// 2. CREATE - Save new travel story
module.exports.createBlog = async (req, res) => {
    const { title, location, content } = req.body.blog;
    const newBlog = new Blog({ title, location, content });
    
    // Assign logged-in user as owner
    newBlog.blogOwner = req.user._id;

    // Handle Image Upload
    if (req.file) {
        newBlog.images.push({
            imgUrl: req.file.path,
            imgFilename: req.file.filename
        });
    }

    await newBlog.save();
    req.flash("success", "New story posted!");
    res.redirect("/blogs");
};

// 3. DELETE - Remove blog (Owner only)
module.exports.deleteBlog = async (req, res) => {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    req.flash("success", "Story deleted successfully!");
    res.redirect("/blogs");
};