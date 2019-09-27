const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const mContact = require("./../model/Contact.js");
const mTag = require("./../model/Tag.js");

const User = new mongoose.model("User", mUser.userSchema);
const Contact = new mongoose.model("Contact", mContact.contactSchema);
const Tag = new mongoose.model("Tag", mTag.tagSchema);

exports.GET_USER_CONTACT = (req, res) => {
  if (req.isAuthenticated()) {
    const userID = req.user._id;
    User.findById(userID, function (err, foundUser) {
      if (foundUser) {
        var query =  User.find({_id: {$in: foundUser.contacts}}).sort({'savedCount':-1});

        query.exec(function(err, foundContacts){
          res.render("dashboard", { name: foundUser.name, contacts: foundContacts });
        });
        // User.find({_id: {$in: foundUser.contacts}}, { sort:{ savedCount: 1 }}, function(err, foundContacts){
        //   res.render("dashboard", { name: foundUser.name, contacts: foundContacts });
        // });
      }
    });
  } else {
    res.redirect("/login");
  }
}

exports.GET_CONTACT_DATA = (req, res) => {
  if (req.isAuthenticated()) {
    const contactIDFromParam = req.params.contactId;
    Tag.find({ deleteFlag: 'N' }, function (err, foundTags) {
      if (err) res.send('No tags found');
      if (contactIDFromParam) {
        Contact.find({ _id: contactIDFromParam, deleteFlag: 'N' }, function (err, contactFound) {
          if (err) res.send('Contact not found');
          if (contactFound) {
            console.log('Found contact: ', contactFound[0]);
            res.render('contact', { contact: contactFound[0], tags: foundTags });
          }
        });
      } else {
        res.render("contact", { contact: new Contact(), tags: foundTags });
      }
    });
  } else {
    res.redirect("/login");
  }
}

exports.GET_CONTACT = (req, res) => {
  if(req.isAuthenticated()) {
    res.render("add_contact");
  } else {
    res.redirect("/login");
  }
}

exports.ADD_OR_UPDATE_CONTACT = (req, res) => {
  if (req.isAuthenticated()) {
    const userID = req.user._id;
    const contactID = req.body.contactId;
    const tag = req.body.tag;
    console.log('Tag: ', tag);
    if (contactID) {
      Contact.findById(contactID, function (err, foundContact) {
        if (err) console.log('Err: ', err);
        else {
          if (foundContact) {
            foundContact.firstName = req.body.firstName;
            foundContact.lastName = req.body.lastName;
            foundContact.ext = req.body.ext;
            foundContact.number = req.body.number;
            if (tag) {
              // Validate tag
              let isTagExist = false;
              if (foundContact.tags) {
                foundContact.tags.forEach(function (item) {
                  if (item._id == tag) isTagExist = true;
                });
              }
              if (!isTagExist)
                foundContact.tags.push(tag);
            } else {
              foundContact.tags = [];
            }
            foundContact.save();
            res.redirect("/dashboard");
          }
        }
      });
    } else {
      const cont = new Contact({
        _id: new mongoose.Types.ObjectId(),
        user: userID,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        ext: req.body.ext,
        number: req.body.number,
        tags: [tag],
        deleteFlag: 'N'
      });

      User.findById(userID, function (err, userFound) {
        if (err) return res.send("Unable to add contact");
        if (userFound) {
          userFound.contacts.push(cont);
          userFound.save(function (err) {
            if (err) return res.send("Unable to add contact");
            cont.save();
            //Contact.updateOne({ _id: cont._id }, cont, { upsert: true, setDefaultsOnInsert: true }, function (err) { });
            res.redirect("/dashboard");
          });
        }
      });
    }



  } else {
    res.redirect("/login");
  }
}

exports.deleteContact = function (req, res, Contact, User) {
  if (req.isAuthenticated()) {
    const contactID = req.body.contactId;
    const userID = req.user._id;
    User.findById(userID, function(err, foundUser){
      if(foundUser) {
        foundUser.contacts.remove(contactID);
        foundUser.save();

        User.findById(contactID, function(err, fUser){
          if(fUser) {
            if(fUser.savedCount) {
              fUser.savedCount--;
              fUser.save();
            }
          }
        });

        res.redirect("/dashboard");
      }
    });
    Contact.findById({ _id: contactID }, function (err, foundContact) {
      if (err) res.send('Contact not found');
      if (foundContact) {
        foundContact.deleteFlag = 'Y';
        foundContact.save();
        User.findById(req.user._id, function (err, userFound) {
          if (err) res.send('User not found...');
          userFound.contacts.remove(contactID);
          userFound.save();
          res.redirect("/dashboard");
        });
      }
    });
  } else {
    res.redirect("/login");
  }
}