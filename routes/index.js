const express = require("express"),
	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user"),
	Status = require("../models/status"),
	middleware = require("../middleware");

router.get("/", (req, res) => {
	if (!req.isAuthenticated()) {
		res.render("landing");
	} else {
		res.redirect("/feed");
	}
});

router.get("/register", (req, res) => {
	res.render("register");
});

router.post("/register", (req, res) => {
	const newUser = new User({ username: req.body.username });
	User.register(newUser, req.body.password, (err, user) => {
		if (err) {
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, () => {
			req.flash("success", "Welcome to FriendBookSpace!");
			res.redirect("/feed");
		});
	});
});

router.get("/login", (req, res) => {
	res.render("login");
});

router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/feed",
		failureRedirect: "/login"
	})
);

router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Successfully Logged Out");
	res.redirect("/");
});

router.get("/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, foundUser) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			const user = foundUser;
			Status.find({ "author.id": user })
				.populate("comments")
				.exec((err, statuses) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						res.render("user", {
							statuses: statuses,
							pageOwner: user
						});
					}
				});
		}
	});
});

module.exports = router;
