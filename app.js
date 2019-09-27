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
// API
const userAPI = require("./api/UserApi.js");
// Session-auth
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// Mailer
const mailer = require("./utils/mailer.js");
// Routes
const HomeRoute = require("./routes/home.js");
const LoginRoute = require("./routes/LoginRoute.js");

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

app.get("/", HomeRoute.GET);

// Contact Controller
app.get("/dashboard", contactController.GET_USER_CONTACT);
app.get("/contact/:contactId?", contactController.GET_CONTACT_DATA);
app.get("/addcontact", contactController.GET_CONTACT);

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

// Login Controller
app.get("/login", userController.LOGIN_GET);
app.get("/register", userController.REGISTER_GET);
app.post("/register", userController.REGISTER_POST);
app.post("/login", userController.LOGIN_POST);
app.get("/logout", userController.LOGOUT);

app.get("/profile", userController.PROFILE_GET);
app.post("/profile", userController.PROFILE_POST);

// API
app.post("/api/login", userAPI.LOGIN_POST);
app.post("/api/login", userAPI.LOGOUT);
app.post("/api/random", verifyToken, userAPI.GET_ALL_CONTACTS);

// Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
