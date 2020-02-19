// This file contains misc routes relevant to the app, such as logging in
// and registering for an account

const express = require("express"),
	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user"),
	Status = require("../models/status"),
	middleware = require("../middleware");



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



// Route to a specific user's profile page.  This shows all status updates
// from a certain user, regardless if the logged in user is following her.
router.get("/users/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, foundUser) => {
		if (err) {
			flashMsg(req, res, false, "User not found", "/feed");
		}

		Status.find({ "author.id": foundUser })
			.sort({ createdAt: -1 })
			.populate("comments")
			.exec((err, statuses) => {
				if (err) {
					flashMsg(req, res, false, "Something went wrong", "/feed");
				}

        // Determine if the logged in user is following the profile owner,
        // and allow the user to follow or unfollow accordingly
				let isFollowing = false;

				User.findOne(
					{ _id: req.user._id, following: req.params.userId },
					(err, followedUser) => {
						if (err) {
							flashMsg(req, res, false, "Something went wrong", "/feed");
						}

						// A user shouldn't be able to follow himself
						if (followedUser || foundUser.equals(req.user)) {
							isFollowing = true;
						}

						res.render("user", {
							statuses: statuses,
							pageOwner: foundUser,
							isFollowing: isFollowing
						});
					}
				);
			});
	});
});



// This route handles the logic to follow a user
router.put("/follow/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, userToFollow) => {
		if (err) {
			flashMsg(req, res, false, "User not found", "/feed");
		}

    // Check that the user to be followed isn't the logged in user and
    // isn't already being followed
		User.findOne(
			{ _id: req.user._id, following: userToFollow },
			(err, followedUser) => {
				if (err) {
					flashMsg(req, res, false, "Something went wrong", "/feed");
				}

				if (!followedUser && !userToFollow.equals(req.user)) {
					const successMsg = "You are now following" + userToFollow.username;

					req.user.following.push(userToFollow);
					req.user.save();
					flashMsg(req, res, true, successMsg, "/feed");
				} else {
					flashMsg(req, res, false, "Could not follow user", "/feed");
				}
			}
		);
	});
});



// This route handles the logic to unfollow a user
router.delete("/follow/:userId", middleware.isLoggedIn, (req, res) => {
	User.findById(req.params.userId, (err, userToUnfollow) => {
		if (err) {
			flashMsg(req, res, false, "User not found", "/feed");
		}

    // Check to make sure the user to be unfollowed is being followed by
    // the logged in user
		User.findOne(
			{ _id: req.user._id, following: userToUnfollow },
			(err, foundUser) => {
				if (err) {
					flashMsg(req, res, false, "Something went wrong", "/feed");
				}

				if (foundUser) {
					const successMsg = "You unfollowed " + userToUnfollow.username;

					req.user.following.pull(req.params.userId);
					req.user.save();
					flashMsg(req, res, true, successMsg, "/feed");
				} else {
					flashMsg(req, res, false, "Could not unfollow user", "/feed");
				}
			}
		);
	});
});



// Route to the page to find users to follow.  If a specific user was searched
// for, return any results, otherwise show 20 users for the logged in user
// to browse.
router.get("/findusers", middleware.isLoggedIn, (req, res) => {
  // If a name was searched for, query the database for relevant users
	if (req.query.username) {
		User.find(
			{ username: { $regex: ".*" + req.query.username } },
			(err, userList) => {
				if (err) {
					flashMsg(req, res, false, "Something went wrong", "/feed");
				}
				if (!userList.length) {
					flashMsg(req, res, false, "No users found", "/findusers");
				}

				const userListToSend = generateUserListToSend(userList, req);

				loadFindUsersPage(res, req, userListToSend);
			}
		);
	} else {
		User.find({})
			.limit(20)
			.exec((err, userList) => {
				if (err) {
					flashMsg(req, res, false, "Could not load user list", "/feed");
				}

				const userListToSend = generateUserListToSend(userList, req);

				loadFindUsersPage(res, req, userListToSend);
			});
	}
});



// Creates a list of users to send to the page.  Only includes the users
// that the logged in user is not already following.
function generateUserListToSend(userList, req) {
	const userListToSend = [];

	userList.forEach(user => {
		if (!req.user.following.includes(user._id)) {
			userListToSend.push(user);
		}
	});

	return userListToSend;
}



// Renders the page to find users to follow
function loadFindUsersPage(res, req, userListToSend) {
	res.render("findUsers", {
		currentUser: req.user,
		userList: userListToSend
	});
}



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
