require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// Mongodb
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Models
const mContact = require(__dirname + "/model/Contact.js");
const mUser = require(__dirname + "/model/User.js");
// Controllers
const userController = require(__dirname + "/controller/UserController.js");
const contactController = require(__dirname + "/controller/ContactController.js");
// Session-auth
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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

mongoose.connect("mongodb://localhost:27017/importantContactDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

mUser.userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", mUser.userSchema);
const Contact = new mongoose.model("Contact", mContact.contactSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res){
  res.render("home");
});

app.get("/dashboard", function(req, res){
  contactController.getUserContacts(req, res, Contact);
});

app.get("/contact/:contactId?", function(req, res){
  contactController.getContact(req, res, Contact);
});

app.post("/delete", function(req, res){
  contactController.deleteContact(req, res, Contact, User);
});

app.post("/contact", function(req, res){
  contactController.addOrUpdateContact(req, res, Contact, User);
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  userController.register(req, res, passport, User);
});

app.post("/login", function(req, res){
  userController.login(req, res, passport, User);
});

app.get("/logout", function(req, res){
  userController.logout(req, res);
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
