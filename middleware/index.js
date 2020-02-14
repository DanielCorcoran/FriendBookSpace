// This file contains the middleware used when accessing routes.
// The middleware checks if a user is logged in,
// or if he owns a status or comment he is attempting to update.

const Status = require("../models/status"),
	Comment = require("../models/comment");

const middlewareObj = {};

// Checks if a status is owned by the user trying to update that status
middlewareObj.checkStatusOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Status.findById(req.params.id, (err, foundStatus) => {
			if (err) {
				req.flash("error", "Status not found");
				res.redirect("back");
			} else {
				if (foundStatus.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You must be logged in to do that");
		res.redirect("/");
	}
};

// Checks if a comment is owned by the user trying to update that comment
middlewareObj.checkCommentOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.commentId, (err, foundComment) => {
			if (err) {
				req.flash("error", "Comment not found");
				res.redirect("back");
			} else {
				if (foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You must be logged in to do that");
		res.redirect("/");
	}
};

// Checks if a user is logged in
middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You must be logged in to do that");
	res.redirect("/");
};

module.exports = middlewareObj;
