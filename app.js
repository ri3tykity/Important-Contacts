require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/importantContactDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const secret = "This is secret";

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  mobile: String,
  location: {lat: Number, long: Number},
  rank: Number,
  tags: [String]
});

userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/dashboard", function(req, res){
  res.render("dashboard");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  user.save(function(err){
    if(err) {
      console.log('User save error: ', user);
    } else {
      res.redirect("/dashboard");
    }
  });
});

app.post("/login", function(req, res){
  var uName = req.body.username;
  var pass = req.body.password; 

  // const user = new User({
  //   username: req.body.username,
  //   password: req.body.password
  // });

  User.findOne({username: uName}, function(err, foundUser){
    if(err) {
      console.log('User not found');
    } else {
      if(foundUser) {
        if(foundUser.password == pass) {
          res.redirect("/dashboard");
        } else {
          console.log('Incorrect user id / password');
        }
      }
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
