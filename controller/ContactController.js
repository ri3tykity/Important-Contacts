const mongoose = require("mongoose");

exports.getUserContacts = function (req, res, Contact) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;
    Contact.find({ user: userID, deleteFlag: 'N' }, function (err, contactsFound) {
      if (contactsFound) {
        res.render("dashboard", { contacts: contactsFound });
      }
    });
  } else {
    res.redirect("/login");
  }
}

exports.getContact = function (req, res, Contact) {
  if (req.isAuthenticated()) {
    const contactIDFromParam = req.params.contactId;
    if (contactIDFromParam) {
      Contact.find({_id:contactIDFromParam, deleteFlag: 'N'}, function (err, contactFound) {
        if (err) res.send('Contact not found');
        if (contactFound) {
          console.log('Found contact: ', contactFound[0]);
          res.render('contact', { contact: contactFound[0] });
        }
      });
    } else {
      res.render("contact", { contact: new Contact() });
    }
  } else {
    res.redirect("/login");
  }
}

exports.addOrUpdateContact = function (req, res, Contact, User) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;
    const contactID = req.body.contactId;
    if(contactID) {
      Contact.findById(contactID, function(err, foundContact){
        if(err) console.log('Err: ', err);
        else {
          if(foundContact) {
            foundContact.firstName = req.body.firstName;
            foundContact.lastName = req.body.lastName;
            foundContact.ext = req.body.ext;
            foundContact.number = req.body.number;

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
    Contact.findById({ _id: contactID }, function(err, foundContact){
      if(err) res.send('Contact not found');
      if(foundContact) {
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