// This file handles the tools and libraries necessary for the app to function.
// This includes creating routes, setting up passport, and selecting an
// environment for the database.

const express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	User = require("./models/user");

// Include route files
const feedRoutes = require("./routes/feed"),
	indexRoutes = require("./routes/index");

// Determine the correct location of the database and connect
require("dotenv").config();
const url = process.env.MONGODB_URI || "mongodb://localhost/FriendBookSpace";
mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true
	})
	.then(() => {
		console.log("connected to DB");
	})
	.catch(err => {
		console.log("ERROR", err.message);
	});

// Methods to set/enable app functionality
mongoose.set("useFindAndModify", false);
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.use(
	require("express-session")({
		secret: "FriendBookSpace will revolutionize social media!",
		resave: false,
		saveUninitialized: false
	})
);
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

// Start the server to which the app will connect
app.listen(process.env.PORT || 8080, () => {
	console.log("Server has started");
});
