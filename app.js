const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const posts = [
    {author: "Steve", status: "Doing things"},
    {author: "Jake", status: "Enjoying the great weather"},
    {author: "Jess", status: "Dig up! - Albert Einstein"}
];

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/feed", (req, res) => {
    res.render("feed", {posts: posts});
});

app.post("/feed", (req, res) => {
    const status = req.body.status;
    const newStatus = {status: status};
    posts.push(newStatus);
    res.redirect("/feed");
});

app.get("/feed/new", (req, res) => {
    res.render("new.ejs");
});

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});