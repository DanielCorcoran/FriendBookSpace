const express = require("express"),
      router = express.Router(),
      Status = require("../models/status"),
      Comment = require("../models/comment");

router.get("/", isLoggedIn, (req, res) => {
    Status.find({}).populate("comments").exec((err, statuses) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {statuses: statuses, currentUser: req.user});
        }
    });
});

router.post("/", isLoggedIn, (req, res) => {
    const text = req.body.text;
    const author = {
        id: req.user._id,
        username: req.user.username
    };
    const newStatus = {author: author, text: text};
    Status.create(newStatus, (err, newStatus) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/feed");
        }
    });
});

router.get("/:id", isLoggedIn, (req, res) => {
    Status.findById(req.params.id).populate("comments").exec((err, foundStatus) => {
        if (err) {
            console.log(err);
        } else {
            res.render("view", {status: foundStatus});
        }
    });
});

router.post("/:id", isLoggedIn, (req,res) => {
    Status.findById(req.params.id, (err, status) => {
        if (err) {
            console.log(err);
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
                    res.redirect("/feed/" + status._id);
                }
            });
        }
    });
});

router.get("/:id/edit", checkStatusOwnership, (req, res) => {
    Status.findById(req.params.id, (err, foundStatus) => {
        res.render("edit", {status: foundStatus});
    });
});

router.put("/:id", checkStatusOwnership, (req, res) => {
    Status.findByIdAndUpdate(req.params.id, {text: req.body.text}, (err, updatedStatus) => {
        if (err) {
            res.redirect("/feed");
        } else {
            res.redirect("/feed/" + req.params.id);
        }
    });
});

router.delete("/:id", checkStatusOwnership, (req, res) => {
    Status.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/feed");
        } else {
            res.redirect("/feed");
        }
    });
});

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

function checkStatusOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Status.findById(req.params.id, (err, foundStatus) => {
            if (err) {
                res.redirect("back");
            } else {
                if (foundStatus.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
}

module.exports = router;