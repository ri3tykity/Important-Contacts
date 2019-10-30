const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const RESOURCES = require("./../resources.js");

//mongoose.set('useFindAndModify', false);

const User = new mongoose.model("User", mUser.userSchema);

//passport.use(User.createStrategy());

exports.LOGIN_POST = async (req, res, next) => {
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
      passport.authenticate("local", { session: false },
        function(err, user, info){
          if(err) res.json({status: -1, message: err});
          if(!user) {
            if(info)
              res.json({status: -1, message: info.message});
            else res.json({status: -1, message: 'User account is not valid'});
          }
          if(user) {
            jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, (err, token) => {
              if (err) {
                res.json({ status: -1, message: err });
              } else {
                res.json({
                  status: 0,
                  token,
                  user
                });
              }
            });
          }
        })
        (req, res, function () {
        });
    }
  });
}

exports.REGISTER = (req, res) => {

  const username = req.body.username;
  const name = req.body.name;
  const mobile = req.body.mobile;
  const pass = req.body.password;
  const cnfPass = req.body.confirmPassword;

  if (pass !== cnfPass) {
    res.json({ status: RESOURCES.STATUS_CODE.KO, message: RESOURCES.ERROR_MSG.password_missmatch });
  } else {

    var newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: username,
      name: name,
      mobile: mobile
    });

    User.register(newUser, pass, function (err, user) {
      if (err) {
        var erros = [];
        var errM = err.errors;
        if (errM) {
          for (var key in errM) {
            var obj = errM[key];
            erros.push(obj.message);
          }
        } else {
          erros.push(err.message);
        }
        //console.log('{}: ', obj);
        res.json({ status: RESOURCES.STATUS_CODE.KO, message: erros });
      } else {
        jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, async (err, token) => {
          res.json({
            status: RESOURCES.STATUS_CODE.OK,
            message: RESOURCES.INFO_MSG.registration_success,
            token,
            user: newUser
          });

          // update the all saved contact that user is registered.
          try {
            await User.updateMany({ 'contacts.mobile': newUser.mobile },
                  { $set: { 'contacts.$.isAppUser': true } },
                  { safe: true, upsert: true });
          } catch(err) {
            console.log('REGISTER: ', err);
          }
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
        if (err) res.json({ status: -1, message: 'Unable to fetch data.' });
        if (foundUser) {
          var query = User.find({ _id: { $in: foundUser.contacts } }).sort({ 'savedCount': -1 });

          query.exec(function (err, foundContacts) {
            res.json({
              status: 0,
              foundUser,
              foundContacts
            });
          });
        } else {
          res.json({
            status: -1,
            message: 'contact not found'
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

exports.PROFILE_GET = async (req, res) => {
  const authData = await jwt.verify(req.token, process.env.JWT_SECRET);

  if (authData) {
    const userId = authData.id;
    const user = await User.findById(userID);

    if (user) {
      res.json({ status: 0, user: foundUser });
    } else {
      res.json({ status: -1, message: 'User not found' });
    }
  } else {
    res.sendStatus(403);
  }
}

exports.PROFILE_POST = (req, res) => {
  const name = req.body.name;
  const description = req.body.description;

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
          foundUser.description = description;
          foundUser.save();
          res.json({ status: 0, user: foundUser });
        }
      });
    }
  });
}

exports.ADD_CONTACT = (req, res) => {
  const mobile = req.query.mobile;
  if (mobile) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
      } else {
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
  } else {
    res.json({ status: -1, message: 'Please enter mobile number' })
  }
}

exports.ADD_CONTACT_V1 = async (req, res) => {
  const name = req.body.name;
  const mobile = req.body.mobile;
  if (mobile && name) {
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
      } else {
        const userID = authData.id;
        const contact = {
          _id: new mongoose.Types.ObjectId(),
          name: name,
          mobile: mobile,
          savedCount: 1
        };

        User.updateOne({ _id: userID, 'contacts.mobile': { $ne: mobile } },
          { '$push': { "contacts": contact } },
          { safe: true, upsert: true },
          async function (err, model) {
            if (err) {
              res.json({ status: -1, message: err });
            } else {
              const count = await User.countDocuments({ 'contacts.mobile': mobile });

              if (count) {
                await User.updateMany({ 'contacts.mobile': mobile },
                  { $set: { 'contacts.$.savedCount': count } },
                  { safe: true, upsert: true });

                await User.updateOne({ 'mobile': mobile },
                  { $set: { 'savedCount': count } },
                  { safe: true });
              }

              res.json({ status: 0, message: 'Contact successfully saved.' });
            }
          });
      }
    });
  } else {
    res.json({ status: -1, message: 'Please enter mobile number and name.' })
  }
}

exports.UPDATE_CONTACT = (req, res) => {
  const cID = req.body.contactId;
  const name = req.body.name;
  if (mobile && name) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
      } else {
        const userID = authData.id;

        User.updateOne({ 'contacts._id': cID },
          { '$set': { 'contacts.$.name': name } },
          function (err, model) {
            if (err) {
              res.json({ status: -1, message: err });
            } else {
              res.json({ status: 0, message: 'Contact successfully updated.' });
            }
          });
      }
    });
  } else {
    res.json({ status: -1, message: 'Please enter mobile number and name.' })
  }
}

exports.DELETE_CONTACT = async (req, res) => {
  const cID = req.query.contactId;
  //const mobile = req.query.mobile;
  console.log('Delete contact: ', cID);
  if (cID) {
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
      } else {
        const userID = authData.id;
        const fUser = await User.findById(userID);

        if (fUser) {
          var mobile = null;
          fUser.contacts.forEach(function (item) {
            if (item._id == cID) {
              mobile = item.mobile;
            }
          });

          if (mobile) {
            await User.updateOne({ _id: userID },
              { $pull: { 'contacts': { _id: cID } } },
              { safe: true, upsert: true });

            const count = await User.countDocuments({ 'contacts.mobile': mobile });

            if (count) {
              // update individual contact count
              await User.updateMany({ 'contacts.mobile': mobile },
                { $set: { 'contacts.$.savedCount': count } },
                { safe: true, upsert: true });
              // update user saved count
              await User.updateOne({ 'mobile': mobile },
                { $set: { 'savedCount': count } },
                { safe: true });
            }
            
            res.json({ status: 0, message: 'Contact successfully deleted.' });
          } else {
            res.json({ status: -1, message: 'No mobile number found' });
          }
        } else {
          res.json({ status: -1, message: 'User details not found.' });

        }
      }
    });
  } else {
    res.json({ status: -1, message: 'Please specify contact ID.' });
  }
}

exports.SAVE_CONTACT = (req, res) => {
  const contactID = req.query.contactID;
  if (contactID) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
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

            res.json({ status: 0, message: 'Contact saved' });
          }
        });
      }
    });
  } else {
    res.json({ status: -1, message: 'Contact ID is missing...' });
  }
}

exports.REMOVE_CONTACT = (req, res) => {
  const contactID = req.query.contactID;
  if (contactID) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        // TODO: Handle error here... Navigate to login in APP
        res.status(403).json({ status: -1, message: 'Forbidden' });
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

            res.json({ status: 0, message: 'Contact removed' });
          }
        });
      }
    });
  } else {
    res.json({ status: -1, message: 'Contact ID is missing...' });
  }
}