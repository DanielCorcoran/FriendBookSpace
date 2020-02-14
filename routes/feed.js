const express = require("express"),
	router = express.Router(),
	User = require("../models/user"),
	Status = require("../models/status"),
	Comment = require("../models/comment"),
	middleware = require("../middleware");

router.get("/", middleware.isLoggedIn, (req, res) => {
	if (!req.user.following.length) {
		User.find({})
			.limit(20)
			.exec((err, userList) => {
				if (err) {
					req.flash("error", "Could not load user list");
					res.redirect("/");
				} else {
					res.render("findUsers", {
						currentUser: req.user,
						userList: userList,
						isFollowingSomeone: false
					});
				}
			});
	} else {
		Status.find({})
			.sort({ createdAt: -1 })
			.populate("comments")
			.exec((err, statuses) => {
				if (err) {
					req.flash("error", "Could not load status feed");
					res.redirect("/");
				} else {
					const statusesToPass = [];

					statuses.forEach(status => {
						if (
							req.user.following.includes(status.author.id) ||
							status.author.id.equals(req.user._id)
						) {
							statusesToPass.push(status);
						}
					});

					res.render("index", {
						statuses: statusesToPass,
						currentUser: req.user
					});
				}
			});
	}
});

router.post("/", middleware.isLoggedIn, (req, res) => {
	const text = req.body.text;
	const author = {
		id: req.user._id,
		username: req.user.username
	};
	const newStatus = { author: author, text: text, createdAt: new Date() };

	Status.create(newStatus, err => {
		if (err) {
			req.flash("error", "Error creating status");
		}
		res.redirect("/feed");
	});
});

router.get("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				req.flash("error", "Status not found");
				res.redirect("back");
			} else {
				res.render("comment", { status: foundStatus, currentUser: req.user });
			}
		});
});

router.post("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id, (err, status) => {
		if (err) {
			req.flash("error", "Status not found");
			res.redirect("/feed");
		} else {
			Comment.create(req.body.comment, (err, comment) => {
				if (err) {
					req.flash("error", "Error creating comment");
					res.redirect("/feed");
				} else {
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					status.comments.push(comment);
					status.save();
					req.flash("success", "Successfully added comment");
					res.redirect("/feed/" + status._id);
				}
			});
		}
	});
});

router.get("/:id/edit", middleware.checkStatusOwnership, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				req.flash("error", "Status not found");
				res.redirect("back");
			} else {
				res.render("editStatus", {
					status: foundStatus,
					currentUser: req.user
				});
			}
		});
});

router.put("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndUpdate(req.params.id, { text: req.body.text }, err => {
		if (err) {
			req.flash("error", "Status could not be updated");
		} else {
			req.flash("success", "Status updated");
		}
		res.redirect("/feed/");
	});
});

router.delete("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndRemove(req.params.id, err => {
		if (err) {
			req.flash("error", "Status could not be deleted");
			res.redirect("back");
		} else {
			req.flash("success", "Status deleted");
			res.redirect("/feed");
		}
	});
});

router.get(
	"/:id/:commentId/edit",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findById(req.params.commentId, (err, foundComment) => {
			if (err) {
				req.flash("error", "Comment not found");
				res.redirect("back");
			} else {
				Status.findById(req.params.id)
					.populate("comments")
					.exec((err, foundStatus) => {
						if (err) {
							req.flash("error", "Status not found");
							res.redirect("back");
						} else {
							res.render("editComment", {
								status: foundStatus,
								commentToEdit: foundComment,
								currentUser: req.user
							});
						}
					});
			}
		});
	}
);

router.put("/:id/:commentId", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(
		req.params.commentId,
		{ text: req.body.text },
		err => {
			if (err) {
				req.flash("error", "Comment could not be updated");
				res.redirect("back");
			} else {
				req.flash("success", "Comment updated");
				res.redirect("/feed/" + req.params.id);
			}
		}
	);
});

router.delete(
	"/:id/:commentId",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndRemove(req.params.commentId, err => {
			if (err) {
				req.flash("error", "Comment could not be deleted");
				res.redirect("back");
			} else {
				req.flash("success", "Comment deleted");
				res.redirect("/feed");
			}
		});
	}
);

module.exports = router;
