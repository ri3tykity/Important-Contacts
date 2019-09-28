const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const jwt = require('jsonwebtoken');

const User = new mongoose.model("User", mUser.userSchema);

passport.use(User.createStrategy());

exports.LOGIN_POST = (req, res) => {
  const userName = req.body.username;
  const password = req.body.password;

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      res.json({ status: -1, message: err });
    } else {
      passport.authenticate("local")(req, res, function () {
        jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, (err, token) => {
          res.json({
            status: 0,
            token
          });
        });
      });
    }
  });
}

exports.HOME = (req, res) => {
  console.log('Token: ', req.token);
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.sendStatus(403);
    } else {
      const id = authData.id;
      User.findById(id, function (err, foundUser) {
        if (foundUser) {
          var query = User.find({ _id: { $in: foundUser.contacts } }).sort({ 'savedCount': -1 });

          query.exec(function (err, foundContacts) {
            res.json({ foundUser, foundContacts });
          });
        } else {
          res.json({
            message: 'contact not found',
            authData
          });
        }
      });
    }
  });
}

exports.LOGOUT = (req, res) => {
  req.logout();
  res.json({ status: 0, message: 'Successfully logged out.' });
}