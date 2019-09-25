require('dotenv').config();
// Express and EJS
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// Mongodb
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Models
const mContact = require("./model/Contact.js");
const mUser = require("./model/User.js");
const mTag = require("./model/Tag.js");
// Controllers
const userController = require("./controller/UserController.js");
const contactController = require("./controller/ContactController.js");
// Session-auth
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// Mailer
const mailer = require("./utils/mailer.js");

//mailer.sendMail();

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Session 
app.use(session({
  secret: "A little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/importantContactDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

mUser.userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", mUser.userSchema);
const Contact = new mongoose.model("Contact", mContact.contactSchema);
const Tag = new mongoose.model("Tag", mTag.tagSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/dashboard", function (req, res) {
  contactController.getUserContacts(req, res, Contact, User);
});

app.get("/contact/:contactId?", function (req, res) {
  contactController.getContact(req, res, Contact, Tag);
});

app.get("/addcontact", function (req, res) {
  if(req.isAuthenticated()) {
    res.render("add_contact");
  } else {
    res.redirect("/login");
  }
});

app.post("/add_contact_step_1", function (req, res) {
  if(req.isAuthenticated()) {
    const userID = req.user._id;
    const mobile = req.body.mobile;

    User.find({mobile: mobile}, function(err, arrFoundUser){
      if(err) console.log('User with mobile not found');
      if(arrFoundUser.length) {
        const u = arrFoundUser[0];
        res.render("save_contact", {contact: u});
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/save_contact", function (req, res) {
  if(req.isAuthenticated()) {
    const userID = req.user._id;
    const contactID = req.body.id;

    User.findById(userID, function(err, foundUser){
      if(err) console.log('User not found');
      if(foundUser) {
        foundUser.contacts.push(contactID);
        foundUser.save();

        User.findById(contactID, function(err, foundContact){
          if(err) console.log('Contact found err');
          if(foundContact) {
            var savedCount = foundContact.savedCount;
            if(savedCount === undefined) savedCount = 1;
            else savedCount++;

            foundContact.savedCount = savedCount;
            foundContact.save();
          }
        });


        res.redirect("/dashboard");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/delete", function (req, res) {
  contactController.deleteContact(req, res, Contact, User);
});

app.post("/contact", function (req, res) {
  contactController.addOrUpdateContact(req, res, Contact, User);
});

app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  }
  else {
    res.render("login");
  }
});

app.get("/register", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  }
  else {
    res.render("register");
  }
});

app.post("/register", function (req, res) {
  userController.register(req, res, passport, User);
});

app.post("/login", function (req, res) {
  userController.login(req, res, passport, User);
});

app.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;
    User.findById(userID, function(err, foundUser){
      if(err) res.render("User not found");
      if(foundUser) {
        res.render('profile', { user: foundUser});
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/profile", function(req, res){
  if (req.isAuthenticated()) {
    const name = req.body.name;
    const mobile = req.body.mobile;
    const userID = req.user._id;

    User.findById(userID, function(err, foundUser){
      if(err) console.log('User not found: ', err);
      if(foundUser) {
        foundUser.name = name;
        foundUser.mobile = mobile;
        foundUser.save();
        res.redirect("/dashboard");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  userController.logout(req, res);
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
