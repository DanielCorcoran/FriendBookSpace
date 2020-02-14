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
  
	User.register(newUser, req.body.password, err => {
		if (err) {
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, () => {
			flashMsg(req, res, true, "Welcome to FriendBookSpace!", "/feed");
		});
	});
});

router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/feed",
		failureRedirect: "/"
	})
);

router.get("/logout", (req, res) => {
	req.logout();
	flashMsg(req, res, true, "Successfully Logged Out", "/");
});

router.get("/users/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, foundUser) => {
		if (err) {
			flashMsg(req, res, false, "User not found", "/feed");
		} else {
			Status.find({ "author.id": foundUser })
				.sort({ createdAt: -1 })
				.populate("comments")
				.exec((err, statuses) => {
					if (err) {
						flashMsg(req, res, false, "Something went wrong", "/feed");
					} else {
            let isFollowing = false;
            
						User.findOne(
							{ _id: req.user._id, following: req.params.userId },
							(err, followedUser) => {
								if (err) {
									flashMsg(req, res, false, "Something went wrong", "/feed");
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
			flashMsg(req, res, false, "User not found", "/feed");
		} else {
			User.findOne(
				{ _id: req.user._id, following: userToFollow },
				(err, followedUser) => {
					if (err) {
						flashMsg(req, res, false, "Something went wrong", "/feed");
					} else {
						if (!followedUser && !userToFollow.equals(req.user)) {
              const successMsg =
              "You are now following" + userToFollow.username;

							req.user.following.push(userToFollow);
							req.user.save();
							flashMsg(req, res, true, successMsg, "/feed");
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
      flashMsg(req, res, false, "User not found", "/feed");
		} else {
			User.findOne(
				{ _id: req.user._id, following: userToUnfollow },
				(err, foundUser) => {
					if (err) {
						flashMsg(req, res, false, "Something went wrong", "/feed");
					} else {
						if (foundUser) {
              const successMsg =
              "You unfollowed " + userToUnfollow.username;

							req.user.following.pull(req.params.userId);
              req.user.save();
							flashMsg(req, res, true, successMsg, "/feed");
						} else {
							flashMsg(req, res, false, "Could not unfollow user", "/feed");
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
          flashMsg(req, res, false, "Something went wrong", "/feed");
				} else if (!userList.length) {
          flashMsg(req, res, false, "No users found", "/feed");
				} else {
          const userListToSend = [];
          
					userList.forEach(user => {
						if (!req.user.following.includes(user._id)) {
							userListToSend.push(user);
						}
					});
					loadFindUsersPage(res, req, userListToSend);
				}
			}
		);
	} else {
		User.find({})
			.limit(20)
			.exec((err, userList) => {
				if (err) {
          flashMsg(req, res, false, "Something went wrong", "/feed");
				} else {
          const userListToSend = [];
          
					userList.forEach(user => {
						if (!req.user.following.includes(user._id)) {
							userListToSend.push(user);
						}
					});
					loadFindUsersPage(res, req, userListToSend);
				}
			});
	}
});

function loadFindUsersPage(res, req, userListToSend) {
  res.render("findUsers", {
    currentUser: req.user,
    userList: userListToSend,
    isFollowingSomeone: true
  });
}

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
