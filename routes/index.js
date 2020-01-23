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

router.get("/users/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, foundUser) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			Status.find({ "author.id": foundUser })
				.sort({ createdAt: -1 })
				.populate("comments")
				.exec((err, statuses) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						let isFollowing = false;
						User.findOne(
							{ _id: req.user._id, following: req.params.userId },
							(err, followedUser) => {
								if (err) {
									req.flash("error", "Something went wrong");
									res.redirect("/feed");
								} else {
									// You shouldn't be able to follow yourself
									if (followedUser || foundUser.equals(req.user)) {
										isFollowing = true;
									}
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

router.put("/follow/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, userToFollow) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			User.findOne(
				{ _id: req.user._id, following: userToFollow },
				(err, followedUser) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						if (!followedUser && !userToFollow.equals(req.user)) {
							req.user.following.push(userToFollow);
							req.user.save();
							req.flash(
								"success",
								"You are now following " + userToFollow.username
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

router.delete("/follow/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, userToUnfollow) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			User.findOne(
				{ _id: req.user._id, following: userToUnfollow },
				(err, foundUser) => {
					if (err) {
						req.flash("error", "Something went wrong");
						res.redirect("/feed");
					} else {
						if (foundUser) {
							req.user.following.pull(req.params.userId);
							req.user.save();
							req.flash("success", "You unfollowed " + userToUnfollow.username);
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

router.get("/findusers", middleware.isLoggedIn, (req, res) => {
	if (req.query.username) {
		User.find(
			{ username: { $regex: ".*" + req.query.username } },
			(err, userList) => {
				if (err) {
					console.log(err);
				} else if (!userList.length) {
					req.flash("error", "No users found");
					res.redirect("/feed");
				} else {
					const userListToSend = [];
					userList.forEach(user => {
						if (!req.user.following.includes(user._id)) {
							userListToSend.push(user);
						}
					});
					res.render("findUsers", {
						currentUser: req.user,
						userList: userListToSend,
						isFollowingSomeone: true
					});
				}
			}
		);
	} else {
		User.find({})
			.limit(20)
			.exec((err, userList) => {
				if (err) {
					req.flash("error", "Something went wrong");
					res.redirect("/");
				} else {
					const userListToSend = [];
					userList.forEach(user => {
						if (!req.user.following.includes(user._id)) {
							userListToSend.push(user);
						}
					});
					res.render("findUsers", {
						currentUser: req.user,
						userList: userListToSend,
						isFollowingSomeone: true
					});
				}
			});
	}
});

module.exports = router;
