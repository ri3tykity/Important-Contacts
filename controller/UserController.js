const mongoose = require("mongoose");

exports.login = function (req, res, passport, User) {
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

exports.logout = function (req, res) {
  req.logout();
  res.redirect("/");
}

exports.register = function (req, res, passport, User) {
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