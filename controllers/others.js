
module.exports.contactPage =  (req, res) => {
	try {
		res.render("contact");
	} catch (err) {
		console.error(err);
		res.status(500).send("Internal Server Error");
	}
}; 

//About us page
module.exports.aboutPage = async (req, res) => {
  try {
    res.render('about');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// Terms and conditions page
module.exports.termsPage = async (req, res) => {
  try {
    res.render('terms');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// Privacy policy page
module.exports.privacyPage = async (req, res) => {
  try {
    res.render('privacy');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

