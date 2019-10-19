const t1 = new Tag({
  tagName: 'Broker'
});

const t2 = new Tag({
  tagName: 'Cook'
});

Tag.insertMany([t1, t2], function(err){ console.log("Tag added...")});


res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");


    const name = req.body.name;
  const mobile = req.body.mobile;
  jwt.verify(req.token, process.env.JWT_SECRET, async(err, authData) => {
    if (err) {
      // TODO: Handle error here... Navigate to login in APP
      res.status(403).json({ status: -1, message: 'Not authenticated' });
    } else {
      const userID = authData.id;
      const contact = {
        _id: new mongoose.Types.ObjectId(),
        name: name,
        mobile: mobile,
        savedCount: 1
      };

      try {
        const uContact = await User.updateOne({ _id: userID, 'contacts.mobile': { $ne: mobile } },
          { '$push': { "contacts": contact } },
          { safe: true, upsert: true });
        console.log('Updated contact: ', uContact);

        console.log('Mobile: ', mobile);
        const count = await User.countDocuments({ 'contacts.mobile': mobile });
        console.log('Count: ', count);
      } catch (err) {

      }
    }
  });


  passport.authenticate("local", (req, res, function (err, user) {
    console.log('Error: ', err);
    console.log('User: ', user);
    jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURATION }, (err, token) => {
      if(err) {
        res.json({ status: -1, message: err });
      } else {
        res.json({
          status: 0,
          token
        });
      }
    });
  });