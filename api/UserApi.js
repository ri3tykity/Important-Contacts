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
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        jwt.sign({user: req.user}, 'secretkey', { expiresIn: '30s' }, (err, token) => {
                  res.json({ status: 0,
                    token
                  });
                });
      });
    }
  });

  // console.log('Username: ', userName);
  // console.log('Password: ', password);

  // User.find({username: userName}, function(err, arrFoundUser){
  //   if(err) res.status(403);
  //   if(arrFoundUser.length) {
  //     const u = arrFoundUser[0];
  //     console.log('FOund user: ', u);
  //     if(u.password == password) {
  //       jwt.sign({u}, 'secretkey', { expiresIn: '30s' }, (err, token) => {
  //         res.json({ status: 0,
  //           token
  //         });
  //       });
  //     } else {
  //       res.json({status: -1, message: 'Invalid password'});
  //     }
  //   } else res.json({status: -1, message: 'User not found'});
  // });
}


exports.GET_ALL_CONTACTS = (req, res) => {
  console.log('Token: ', req.token);
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if(err) {
      res.sendStatus(403);
    } else {      
      res.json({
        message: 'Post created...',
        authData
      });
    }
  });

  // if (req.isAuthenticated()) {
  //   const userID = req.user._id;
  //   User.findById(userID, function (err, foundUser) {
  //     if (foundUser) {
  //       var query =  User.find({_id: {$in: foundUser.contacts}}).sort({'savedCount':-1});

  //       query.exec(function(err, foundContacts){
  //         res.send({ name: foundUser.name, contacts: foundContacts });
  //       });
  //       // User.find({_id: {$in: foundUser.contacts}}, { sort:{ savedCount: 1 }}, function(err, foundContacts){
  //       //   res.render("dashboard", { name: foundUser.name, contacts: foundContacts });
  //       // });
  //     }
  //   });
  // } else {
  //   res.send({});
  // }
}