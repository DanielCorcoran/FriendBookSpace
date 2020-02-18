const express = require("express"),
	router = express.Router(),
	Status = require("../models/status"),
	Comment = require("../models/comment"),
	middleware = require("../middleware");

router.get("/", middleware.isLoggedIn, (req, res) => {
	if (!req.user.following.length) {
		res.redirect("findUsers");
	}

	Status.find({})
		.sort({ createdAt: -1 })
		.populate("comments")
		.exec((err, statuses) => {
			if (err) {
				flashMsg(req, res, false, "Could not load status feed", "/");
			}

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
		});
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
			flashMsg(req, res, false, "Error creating status", "/feed");
		}

		res.redirect("/feed");
	});
});

router.get("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				flashMsg(req, res, false, "Status not found", "back");
			}

			res.render("comment", { status: foundStatus, currentUser: req.user });
		});
});

router.post("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id, (err, status) => {
		if (err) {
			flashMsg(req, res, false, "Status not found", "/feed");
		}

		Comment.create(req.body.comment, (err, comment) => {
			if (err) {
				flashMsg(req, res, false, "Error creating comment", "/feed");
			}

			comment.author.id = req.user._id;
			comment.author.username = req.user.username;
			comment.save();
			status.comments.push(comment);
			status.save();
			flashMsg(
				req,
				res,
				true,
				"Successfully added comment",
				"/feed" + status._id
			);
		});
	});
});

router.get("/:id/edit", middleware.checkStatusOwnership, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				flashMsg(req, res, false, "Status not found", "back");
			}

			res.render("editStatus", {
				status: foundStatus,
				currentUser: req.user
			});
		});
});

router.put("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndUpdate(req.params.id, { text: req.body.text }, err => {
		if (err) {
			flashMsg(req, res, false, "Status could not be updated", "/feed");
		}

		flashMsg(req, res, true, "Status updated", "/feed");
	});
});

router.delete("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndRemove(req.params.id, err => {
		if (err) {
			flashMsg(req, res, false, "Status could not be deleted", "back");
		}

		flashMsg(req, res, true, "Status deleted", "/feed");
	});
});

router.get(
	"/:id/:commentId/edit",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findById(req.params.commentId, (err, foundComment) => {
			if (err) {
				flashMsg(req, res, false, "Comment not found", "back");
			}

			Status.findById(req.params.id)
				.populate("comments")
				.exec((err, foundStatus) => {
					if (err) {
						flashMsg(req, res, false, "Status not found", "back");
					}

					res.render("editComment", {
						status: foundStatus,
						commentToEdit: foundComment,
						currentUser: req.user
					});
				});
		});
	}
);

router.put("/:id/:commentId", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(
		req.params.commentId,
		{ text: req.body.text },
		err => {
			if (err) {
				flashMsg(req, res, false, "Comment could not be updated", "back");
			}

			flashMsg(req, res, true, "Comment updated", "/feed/" + req.params.id);
		}
	);
});

router.delete(
	"/:id/:commentId",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndRemove(req.params.commentId, err => {
			if (err) {
				flashMsg(req, res, false, "Comment could not be deleted", "back");
			}

			flashMsg(req, res, true, "Comment deleted", "/feed");
		});
	}
);

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
