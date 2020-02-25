// This file contains the middleware used when accessing routes.
// The middleware checks if a user is logged in,
// or if he owns a status or comment he is attempting to update.

const Status = require("../models/status"),
	Comment = require("../models/comment"),
	util = require("../util.js");

const middlewareObj = {};



// Checks if a status is owned by the user trying to update that status
middlewareObj.checkStatusOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Status.findById(req.params.id, (err, foundStatus) => {
			if (err) {
				util.flashMsg(req, res, false, "Status not found", "back");
			} else {
				if (foundStatus.author.id.equals(req.user._id)) {
					next();
				} else {
					util.flashMsg(
						req,
						res,
						false,
						"You don't have permission to do that",
						"back"
					);
				}
			}
		});
	} else {
		util.flashMsg(req, res, false, "You must be logged in to do that", "/");
	}
};



// Checks if a comment is owned by the user trying to update that comment
middlewareObj.checkCommentOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.commentId, (err, foundComment) => {
			if (err) {
				util.flashMsg(req, res, false, "Comment not found", "back");
			} else {
				if (foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					util.flashMsg(
						req,
						res,
						false,
						"You don't have permission to do that",
						"back"
					);
				}
			}
		});
	} else {
		util.flashMsg(req, res, false, "You must be logged in to do that", "/");
	}
};



// Checks if a user is logged in
middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
  }
  
	util.flashMsg(req, res, false, "You must be logged in to do that", "/");
};

module.exports = middlewareObj;
