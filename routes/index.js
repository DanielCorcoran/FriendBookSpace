// This file contains misc routes relevant to the app, such as logging in
// and registering for an account

const express = require("express"),
	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user"),
	util = require("../util.js");



// Loads the landing page if the user isn't logged in, otherwise loads the feed
router.get("/", (req, res) => {
	if (!req.isAuthenticated()) {
		res.render("landing");
	} else {
    res.redirect("/feed");
  }
});



// Loads the page to register for an account
router.get("/register", (req, res) => {
	res.render("register");
});



// This route creates an account
router.post("/register", (req, res) => {
	const newUser = new User({ username: req.body.username });

	User.register(newUser, req.body.password, err => {
		if (err) {
			util.flashMsg(req, res, false, err.message, "/register");
		} else {
      passport.authenticate("local")(req, res, () => {
        util.flashMsg(req, res, true, "Welcome to FriendBookSpace!", "/feed");
      });
		}
	});
});



// Verifies a user's credentials and logs him in
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/feed",
		failureRedirect: "/"
	})
);



// Logs a user out
router.get("/logout", (req, res) => {
	req.logout();
	util.flashMsg(req, res, true, "Successfully Logged Out", "/");
});

module.exports = router;
