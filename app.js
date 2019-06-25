const express = require("express");
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/FriendBookSpace", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const statusSchema = new mongoose.Schema({
    author: String,
    status: String
});

const Status = mongoose.model("Status", statusSchema);

/*
Status.create(
    {
        author: "Steve",
        status: "Doing things"
    }, (err, status) => {
        if (err)
        {
            console.log(err);
        } else {
            console.log("New status: ");
            console.log(status);
        }
    }
);

const posts = [
    {author: "Steve", status: "Doing things"},
    {author: "Jake", status: "Enjoying the great weather"},
    {author: "Jess", status: "Dig up! - Albert Einstein"}
];
*/

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/feed", (req, res) => {
    Status.find({}, (err, status) => {
        if (err) {
            console.log(err);
        } else {
            res.render("feed", {posts: status});
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
    // posts.push(newStatus);
});

app.get("/feed/new", (req, res) => {
    res.render("new.ejs");
});

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});