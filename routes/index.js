// This file contains misc routes relevant to the app, such as logging in
// and registering for an account

const express = require("express"),
	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user");



// Loads the landing page if the user isn't logged in, otherwise loads the feed
router.get("/", (req, res) => {
	if (!req.isAuthenticated()) {
		res.render("landing");
	}

	res.redirect("/feed");
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
			flashMsg(req, res, false, err.message, "/register");
		}

		passport.authenticate("local")(req, res, () => {
			flashMsg(req, res, true, "Welcome to FriendBookSpace!", "/feed");
		});
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
	flashMsg(req, res, true, "Successfully Logged Out", "/");
});



// Creates a flash message informing the user of any relevant info and
// redirects to the appropriate route
function flashMsg(req, res, isSuccess, message, route) {
	let outcome;

	if (isSuccess) {
		outcome = "success";
	} else {
		outcome = "error";
	}

	req.flash(outcome, message);
	res.redirect(route);
}

module.exports = router;
