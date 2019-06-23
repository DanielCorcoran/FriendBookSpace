const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/feed", (req, res) => {
    const posts = [
        {author: "Steve", status: "Doing things"},
        {author: "Jake", status: "Enjoying the great weather"},
        {author: "Jess", status: "Dig up! - Albert Einstein"}
    ]

    res.render("feed", {posts: posts});
});


app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});