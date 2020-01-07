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
			Status.find({ "author.id": foundUser })
				.populate("comments")
				.exec((err, statuses) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						let isFollowing = false;
						User.findOne(
							{ _id: req.user._id, following: foundUser },
							(err, followedUser) => {
								if (err) {
									req.flash("error", "Something went wrong");
									res.redirect("/feed");
								} else {
									if (followedUser || foundUser.equals(req.user)) {
										isFollowing = true;
									}
									console.log(followedUser);
									console.log(isFollowing);
									res.render("user", {
										statuses: statuses,
										pageOwner: foundUser,
										isFollowing: isFollowing
									});
								}
							}
						);
					}
				});
		}
	});
});

router.post("/follow/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, foundUser) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			User.findOne(
				{ _id: req.user._id, following: foundUser },
				(err, followedUser) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						if (!followedUser && !foundUser.equals(req.user)) {
							req.user.following.push(foundUser);
							req.user.save();
							req.flash(
								"success",
								"You are now following " + foundUser.username
							);
							res.redirect("/feed");
						} else {
							res.redirect("/feed");
						}
					}
				}
			);
		}
	});
});

module.exports = router;
