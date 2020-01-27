const Status = require("../models/status"),
	Comment = require("../models/comment");

const middlewareObj = {};

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
		res.redirect("back");
	}
};

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
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You must be logged in to do that");
	res.redirect("/login");
};

module.exports = middlewareObj;
