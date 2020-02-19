// This file contains all of the routes for the main feed page of the app,
// including accessing and editing statuses and comments

const express = require("express"),
	router = express.Router(),
	Status = require("../models/status"),
	Comment = require("../models/comment"),
	middleware = require("../middleware");



// Route for the main feed page.  If the user isn't following anyone, she will
// be redirected to the page to find other users to follow since the feed only
// displays people that the user is following.
router.get("/", middleware.isLoggedIn, (req, res) => {
	if (!req.user.following.length) {
		res.redirect("findUsers");
	} else {
    // Load statuses and sort them in reverse chronological order
    Status.find({})
      .sort({ createdAt: -1 })
      .populate("comments")
      .exec((err, statuses) => {
        if (err) {
          flashMsg(req, res, false, "Could not load status feed", "/");
        } else {
          const statusesToPass = [];

          // Filter statuses to only show the user's and those from people the
          // user is following
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



// Route to post a new status
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
		} else {
      res.redirect("/feed");
    }
	});
});



// Route to load a single status.  From here, the user can comment on it.
router.get("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				flashMsg(req, res, false, "Status not found", "back");
			} else {
        res.render("comment", { status: foundStatus, currentUser: req.user });
      }
		});
});



// Route to post a comment on the selected status
router.post("/:id", middleware.isLoggedIn, (req, res) => {
	Status.findById(req.params.id, (err, status) => {
		if (err) {
			flashMsg(req, res, false, "Status not found", "/feed");
		} else {
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          flashMsg(req, res, false, "Error creating comment", "/feed");
        } else {
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
            "/feed/" + status._id
          );
        }
      });
    }
	});
});



// Route to edit a status that belongs to the logged in user
router.get("/:id/edit", middleware.checkStatusOwnership, (req, res) => {
	Status.findById(req.params.id)
		.populate("comments")
		.exec((err, foundStatus) => {
			if (err) {
				flashMsg(req, res, false, "Status not found", "back");
			} else {
        res.render("editStatus", {
          status: foundStatus,
          currentUser: req.user
        });
      }
		});
});



// Updates the user's status
router.put("/:id", middleware.checkStatusOwnership, (req, res) => {
	Status.findByIdAndUpdate(req.params.id, { text: req.body.text }, err => {
		if (err) {
			flashMsg(req, res, false, "Status could not be updated", "/feed");
		} else {
      flashMsg(req, res, true, "Status updated", "/feed");
    }
	});
});



// Deletes the user's status
router.delete("/:id", middleware.checkStatusOwnership, (req, res) => {
  // First, delete any comments on the status
  Status.findById(req.params.id, (err, foundStatus) => {
    if (err) {
			flashMsg(req, res, false, "Status could not be deleted", "back");
    } else {
      Comment.deleteMany({_id: { $in: foundStatus.comments}}, err => {
        if (err) {
          flashMsg(req, res, false, "Something went wrong", "back");
        }
      });
    }
  });
  
	Status.findByIdAndRemove(req.params.id, err => {
		if (err) {
			flashMsg(req, res, false, "Status could not be deleted", "back");
		} else {
      flashMsg(req, res, true, "Status deleted", "/feed");
    }
	});
});



// Route to edit a comment that belongs to the logged in user.  Similar to
// editing a status.
router.get(
	"/:id/:commentId/edit",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findById(req.params.commentId, (err, foundComment) => {
			if (err) {
				flashMsg(req, res, false, "Comment not found", "back");
			} else {
        Status.findById(req.params.id)
          .populate("comments")
          .exec((err, foundStatus) => {
            if (err) {
              flashMsg(req, res, false, "Status not found", "back");
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



// Updates the user's comment
router.put("/:id/:commentId", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(
		req.params.commentId,
		{ text: req.body.text },
		err => {
			if (err) {
				flashMsg(req, res, false, "Comment could not be updated", "back");
			} else {
        flashMsg(req, res, true, "Comment updated", "/feed/" + req.params.id);
      }
		}
	);
});



// Deletes the user's comment
router.delete(
	"/:id/:commentId",
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndRemove(req.params.commentId, err => {
			if (err) {
				flashMsg(req, res, false, "Comment could not be deleted", "back");
			} else {
        flashMsg(req, res, true, "Comment deleted", "/feed");
      }
		});
	}
);



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
