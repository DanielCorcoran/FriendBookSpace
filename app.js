const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      flash = require("connect-flash"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      methodOverride = require("method-override"),
      User = require("./models/user"),
      seedDB = require("./seeds");

const feedRoutes = require("./routes/feed"),
      indexRoutes = require("./routes/index");

// seedDB();
mongoose.connect("mongodb://localhost/FriendBookSpace", {useNewUrlParser: true});
mongoose.set("useFindAndModify", false);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

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
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/feed", feedRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});