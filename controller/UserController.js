const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

mUser.userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", mUser.userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  console.log('Passport serializer: ', user);
  done(null, user);
});

passport.deserializeUser(function (id, done) {
  console.log('Passport deserializer: ', id);
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

exports.LOGIN_GET = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  }
  else {
    res.render("login");
  }
}

exports.REGISTER_GET = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  }
  else {
    res.render("register");
  }
}

exports.LOGIN_POST = (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    }
  });
}

exports.LOGOUT = function (req, res) {
  req.logout();
  res.redirect("/");
}

exports.REGISTER_POST = (req, res) => {
  const pass = req.body.password;
  const cnfPass = req.body.confirmPassword;

  if (pass !== cnfPass) {
    res.render("Password and confirm password should match");
  } else {

    var newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: req.body.username
    });

    User.register(newUser, req.body.password, function (err, user) {
      if (err) {
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/dashboard");
        });
      }
    });
  }
}

exports.PROFILE_GET = (req, res) => {
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
}

exports.PROFILE_POST = (req, res) => {
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
}