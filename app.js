const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      Status = require("./models/status"),
      Comment = require("./models/comment"),
      User = require("./models/user"),
      seedDB = require("./seeds");

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

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/feed", isLoggedIn, (req, res) => {
    Status.find({}).populate("comments").exec((err, statuses) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {statuses: statuses, currentUser: req.user});
        }
    });
});

app.post("/feed", isLoggedIn, (req, res) => {
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

app.get("/feed/:id", isLoggedIn, (req, res) => {
    Status.findById(req.params.id).populate("comments").exec((err, foundStatus) => {
        if (err) {
            console.log(err);
        } else {
            res.render("view", {status: foundStatus});
        }
    });
});

app.post("/feed/:id", isLoggedIn, (req,res) => {
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

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect("/feed");
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/feed",
        failureRedirect: "/login"
    })
);

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/feed");
});

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT || 8080, () => { 
    console.log("Server has started");
});