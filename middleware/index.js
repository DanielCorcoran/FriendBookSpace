const Status = require("../models/status"),
      Comment = require("../models/comment");

const middlewareObj = {};

middlewareObj.checkStatusOwnership = (req, res, next) => {
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

middlewareObj.checkCommentOwnership = (req, res, next) => {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err) {
                res.redirect("back");
            } else {
                if (foundComment.author.id.equals(req.user._id)) {
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

middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = middlewareObj;