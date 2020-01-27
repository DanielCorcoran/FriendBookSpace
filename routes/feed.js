const express = require("express"),
	router = express.Router(),
	User = require("../models/user"),
	Status = require("../models/status"),
	Comment = require("../models/comment"),
	middleware = require("../middleware");

router.get("/", middleware.isLoggedIn, (req, res) => {
	Status.find({})
		.sort({ createdAt: -1 })
		.populate("comments")
		.exec((err, statuses) => {
			if (err) {
				console.log(err);
			} else if (!req.user.following.length) {
				User.find({})
					.limit(20)
					.exec((err, userList) => {
						if (err) {
							req.flash("error", "Something went wrong");
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
				const statusesToPass = [];
				statuses.forEach(e => {
					if (
						req.user.following.includes(e.author.id) ||
						e.author.id.equals(req.user._id)
					) {
						statusesToPass.push(e);
					}
				});
				res.render("index", {
					statuses: statusesToPass,
					currentUser: req.user
				});
			}
		});
});

router.post("/", middleware.isLoggedIn, (req, res) => {
	const text = req.body.text;
	const author = {
		id: req.user._id,
		username: req.user.username
	};
	const newStatus = { author: author, text: text, createdAt: new Date() };
	Status.create(newStatus, (err, newStatus) => {
		if (err) {
			console.log(err);
		} else {
			res.redirect("/feed");
		}
	});
});

router.get("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				console.log(err);
			} else {
				res.render("view", { status: foundStatus });
			}
		});
});

router.post("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id, (err, status) => {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/feed");
		} else {
			Comment.create(req.body.comment, (err, comment) => {
				if (err) {
					console.log(err);
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
	Status.findById(req.params.id, (err, foundStatus) => {
		res.render("editStatus", { status: foundStatus });
	});
});

router.put("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndUpdate(
		req.params.id,
		{ text: req.body.text },
		(err, updatedStatus) => {
			if (err) {
				res.redirect("/feed");
			} else {
				res.redirect("/feed/" + req.params.id);
			}
		}
	);
});

router.delete("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndRemove(req.params.id, err => {
		if (err) {
			res.redirect("/feed");
		} else {
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
				res.redirect("back");
			} else {
				Status.findById(req.params.id)
					.populate("comments")
					.exec((err, foundStatus) => {
						if (err) {
							res.redirect("back");
						} else {
							res.render("editComment", {
								// status_id: req.params.id,
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
		(err, updatedComment) => {
			if (err) {
				res.redirect("back");
			} else {
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
				res.redirect("back");
			} else {
				req.flash("success", "Comment deleted");
				res.redirect("/feed/" + req.params.id);
			}
		});
	}
);

module.exports = router;
