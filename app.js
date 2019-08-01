const express = require("express");
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      Status = require("./models/status"),
      Comment = require("./models/comment"),
      seedDB = require("./seeds");

seedDB();
mongoose.connect("mongodb://localhost/FriendBookSpace", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/feed", (req, res) => {
    Status.find({}).populate("comments").exec((err, statuses) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {statuses: statuses});
        }
    });
});

app.post("/feed", (req, res) => {
    const author = "Someone";
    const status = req.body.status;
    const newStatus = {author: author, status: status};
    Status.create(newStatus, (err, newStatus) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/feed");
        }
    });
});

app.get("/feed/:id", (req, res) => {
    Status.findById(req.params.id).populate("comments").exec((err, foundStatus) => {
        if (err) {
            console.log(err);
        } else {
            res.render("view", {status: foundStatus});
        }
    });
});

app.post("/feed/:id", (req,res) => {
    Status.findById(req.params.id, (err, status) => {
        if (err) {
            console.log(err);
            res.redirect("/feed");
        } else {
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    console.log(err);
                } else {
                    status.comments.push(comment);
                    status.save();
                    res.redirect("/feed/" + status._id);
                }
            });
        }
    });
});

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});