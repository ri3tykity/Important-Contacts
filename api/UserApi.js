const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const RESOURCES = require("./../resources.js");

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

exports.REGISTER = (req, res) => {

  const username = req.body.username;
  const pass = req.body.password;
  const cnfPass = req.body.confirmPassword;

  if (pass !== cnfPass) {
    res.json({status: RESOURCES.STATUS_CODE.KO, message: RESOURCES.ERROR_MSG.password_missmatch});
  } else {

    var newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: username
    });

    User.register(newUser, pass, function (err, user) {
      if (err) {
        console.log(err);
        console.log('ID: ', newUser._id);
        res.json({status: RESOURCES.STATUS_CODE.KO, message: RESOURCES.ERROR_MSG.registration_error});
      } else {
        jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, (err, token) => {
          res.json({
            status: RESOURCES.STATUS_CODE.OK,
            message: RESOURCES.INFO_MSG.registration_success,
            token
          });
        });
      }
    });
  }

}


exports.HOME = (req, res) => {
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

exports.PROFILE_GET = (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.sendStatus(403);
    } else {
      const userID = authData.id;
      console.log('Profile Get UserID: ', userID);
      User.findById(userID, function (err, foundUser) {
        if (err) res.json({ status: -1, message: "User not found" });
        if (foundUser) {
          res.json({ status: 0, user: foundUser });
        }
      });
    }
  });
}

exports.PROFILE_POST = (req, res) => {
  const name = req.body.name;
  const mobile = req.body.mobile;

  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.sendStatus(403);
    } else {
      const userID = authData.id;
      User.findById(userID, function (err, foundUser) {
        if (err) res.json({ status: -1, message: "User not found" });
        if (foundUser) {
          foundUser.name = name;
          foundUser.mobile = mobile;
          foundUser.save();
          res.json({ status: 0, user: foundUser });
        }
      });
    }
  });
}


exports.ADD_CONTACT = (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.sendStatus(403);
    } else {
      console.log('Token: ', req.token);
      const mobile = req.query.mobile;
      console.log('Mobile: ', mobile);
      const userID = authData.id;
      User.find({ mobile: mobile }, function (err, foundUser) {
        if (err) res.json({ status: -1, message: "User not found" });
        if (foundUser.length) {
          res.json({ status: 0, user: foundUser[0] });
        } else {
          res.json({ status: 0, user: foundUser });
        }
      });
    }
  });
}

exports.SAVE_CONTACT = (req, res) => {
  const contactID = req.query.contactID;
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.sendStatus(403);
    } else {
      const userID = authData.id;
      User.findById(userID, function (err, foundUser) {
        if (err) res.json({ status: -1, message: "User not found" });
        if (foundUser) {
          foundUser.contacts.push(contactID);
          foundUser.save();

          User.findById(contactID, function (err, foundContact) {
            if (err) console.log('Contact found err');
            if (foundContact) {

              var savedCount = foundContact.savedCount;
              if (savedCount === undefined) savedCount = 1;
              else savedCount++;

              foundContact.savedCount = savedCount;
              foundContact.save();
            }
          });

          res.json({ status: 0, user: foundUser });
        }
      });
    }
  });
}

exports.REMOVE_CONTACT = (req, res) => {
  const contactID = req.query.contactID;
  if (contactID) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.sendStatus(403);
      } else {
        const userID = authData.id;
        User.findById(userID, function (err, foundUser) {
          if (foundUser) {
            foundUser.contacts.remove(contactID);
            foundUser.save();

            User.findById(contactID, function (err, fUser) {
              if (fUser) {
                if (fUser.savedCount) {
                  fUser.savedCount--;
                  fUser.save();
                }
              }
            });

            res.json({ status: 0, user: foundUser });
          }
        });
      }
    });
  } else {
    res.json({ status: -1, message: 'Contact ID is missing...' });
  }
}