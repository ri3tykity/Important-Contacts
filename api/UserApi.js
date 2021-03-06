const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const RESOURCES = require("./../resources.js");

//mongoose.set('useFindAndModify', false);

const User = new mongoose.model("User", mUser.userSchema);

//passport.use(User.createStrategy());

exports.LOGIN_POST = async (req, res, next) => {

  const userName = req.body.username ? req.body.username.toLowerCase().trim() : '';
  const password = req.body.password;

  const user = new User({
    username: userName,
    password: password
  });

  req.login(user, function (err) {
    if (err) {
      res.json({ status: -1, message: err });
    } else {
      passport.authenticate("local", { session: false },
        function (err, user, info) {
          if (err) res.json({ status: -1, message: err });
          if (!user) {
            if (info)
              res.json({ status: -1, message: info.message, data: null });
            else res.json({ status: -1, message: 'User account is not valid' });
          }
          if (user) {
            jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, (err, token) => {
              if (err) {
                res.json({ status: -1, message: err, data: null });
              } else {
                res.json({
                  status: 0,
                  token: token,
                  data: user,
                  message: 'User login success'
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

exports.REGISTER = async (req, res) => {

  const username = req.body.username ? req.body.username.toLowerCase() : '';
  const name = req.body.name;
  const mobile = req.body.mobile;
  const pass = req.body.password;
  const cnfPass = req.body.confirmPassword;

  try {
    const usr = await User.find({ mobile: mobile });
    if (usr.length) {
      return res.json({ status: -1, message: 'Mobile number already registered' });
    }
  } catch (err) {
    console.log('REGISTER: ' + err);
    return res.json({ status: -1, message: err });
  }
  if (pass !== cnfPass) {
    return res.json({ status: RESOURCES.STATUS_CODE.KO, message: RESOURCES.ERROR_MSG.password_missmatch });
  } else {
    var newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: username,
      name: name,
      mobile: mobile
    });

    User.register(newUser, pass, function (err, user) {
      if (err) {
        var erros = '';
        var errM = err.errors;
        if (errM) {
          for (var key in errM) {
            var obj = errM[key];
            erros += obj.message + ' | ';
          }
        } else {
          erros = err.message;
        }
        //console.log('{}: ', obj);
        res.json({ status: RESOURCES.STATUS_CODE.KO, message: erros, data: null });
      } else {
        jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, async (err, token) => {
          res.json({
            status: RESOURCES.STATUS_CODE.OK,
            message: RESOURCES.INFO_MSG.registration_success,
            token: token,
            data: newUser
          });

          // update the all saved contact that user is registered.
          try {
            await User.updateMany({ 'contacts.mobile': newUser.mobile },
              { $set: { 'contacts.$.isAppUser': true } },
              { safe: true, upsert: true });
          } catch (err) {
            console.log('REGISTER: ', err);
            return res.json({ status: -1, message: err });
          }
        });
      }
    });
  }

}

exports.HOME = (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
    if (err) {
      res.status(403).json({ status: -1, message: "Invalid token", data: null });
    } else {
      const id = authData.id;
      try {
        const user = await User.find({ _id: id }, { salt: 0, hash: 0 });

        if (user.length) {
          res.json({ status: 0, data: user[0], message: 'User data' });
        } else {
          res.json({ status: -1, message: 'User not found', data: null });
        }
      } catch (err) {
        console.log('HOME: ', err);
        res.json({ status: -1, message: 'Error at fetching user data', data: null });
      }
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
        res.status(403).json({ status: -1, message: 'Token expired' });
      } else {
        const userID = authData.id;

        try {
          const usr = await User.find({ mobile: mobile });

          var isAppUser = usr.length ? true : false;

          const contact = {
            _id: new mongoose.Types.ObjectId(),
            name: name,
            mobile: mobile,
            savedCount: 1,
            isAppUser: isAppUser
          };

          User.updateOne({ _id: userID, 'contacts.mobile': { $ne: mobile } },
            { '$push': { "contacts": contact } },
            { safe: true, upsert: true },
            async function (err, model) {
              if (err) {
                res.json({ status: -1, message: err });
              } else {
                try {
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
                } catch (err) {
                  console.log('ADD_CONTACT_V1: ' + err);
                  res.json({ status: -1, message: err });
                }
              }
            });
        } catch (err) {

        }
      }
    });
  } else {
    res.json({ status: -1, message: 'Please enter mobile number and name.' })
  }
}

exports.UPDATE_CONTACT = (req, res) => {
  const cID = req.body.contactId;
  const name = req.body.name;
  if (name) {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
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
    res.json({ status: -1, message: 'Please enter name.' })
  }
}

exports.DELETE_CONTACT = async (req, res) => {
  const cID = req.query.contactId;
  if (cID) {
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
      if (err) {
        res.status(403).json({ status: -1, message: 'Invalid token' });
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

exports.UPDATE_DESCRIPTION = (req, res) => {
  //const name = req.body.name;
  const description = req.body.description;

  jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
    if (err) {
      res.status(403).json({ status: -1, message: 'Invalid token' });
    } else {
      const userID = authData.id;
      try {
        const query = await User.findByIdAndUpdate(userID, { $set: { 'description': description }});
        res.json({status: 0, message: 'Status updated', data: null});
      } catch(err) {
        res.json({status: -1, message: 'Please try again later'});
      }
    }
  });
}