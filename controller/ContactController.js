const mongoose = require("mongoose");
const Schema = mongoose.Schema;


exports.getUserContacts = function(req, res, Contact) {
  if (req.isAuthenticated()){
    const userID = req.user._id;
    Contact.find({user: userID}, function(err, contactsFound){
      if(contactsFound) {
        res.render("dashboard", {contacts: contactsFound});
      }
    });    
  } else {
    res.redirect("/login");
  }
}

exports.getContact = function(req, res, Contact) {
  if (req.isAuthenticated()){
    const contactIDFromParam = req.params.contactId;
    if(contactIDFromParam) {
      Contact.findById(contactIDFromParam, function(err, contactFound){
        if(err) res.send('Contact not found');
        if(contactFound) {
          res.render('contact', {contact: contactFound});
        }
      });
    } else {
      res.render("contact", {contact: new Contact()});  
    }
  } else {
    res.redirect("/login");
  }
}

exports.addOrUpdateContact = function(req, res, Contact, User) {
  if (req.isAuthenticated()){
    const userID = req.user._id;
    const cont = new Contact({
      _id: req.body.contactId ? req.body.contactId : new mongoose.Types.ObjectId(),
      user: userID,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ext: req.body.ext,
      number: req.body.number,
    });

    User.findById(userID, function(err, userFound){
      if(err) return res.send("Unable to add contact");
      if(userFound) {
        userFound.contacts.push(cont);
        userFound.save(function(err){
          if(err) return res.send("Unable to add contact");
          Contact.updateOne({_id: cont._id}, cont, {upsert: true, setDefaultsOnInsert: true}, function(err){});
          res.redirect("/dashboard"); 
        });
      }
    });    
  } else {
    res.redirect("/login");
  }
}

exports.deleteContact = function(req, res, Contact, User) {
  if (req.isAuthenticated()){
    const contactID = req.body.contactId;
    Contact.deleteOne({_id: contactID}, function(err){
      if(err) res.send('Unable to delete data');
      User.findById(req.user._id, function(err, userFound){
        if(err) res.send('User not found...');
        userFound.contacts.remove(contactID);
        userFound.save();
        res.redirect("/dashboard");
      });
    });      
  } else {
    res.redirect("/login");
  }
}