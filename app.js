const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      User = require("./models/user"),
      seedDB = require("./seeds");

const feedRoutes = require("./routes/feed"),
      indexRoutes = require("./routes/index");

seedDB();
mongoose.connect("mongodb://localhost/FriendBookSpace", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(require("express-session")({
    secret: "FriendBookSpace will revolutionize social media!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use("/feed", feedRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});