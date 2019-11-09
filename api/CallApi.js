const mongoose = require("mongoose");
const mUser = require("./../model/User.js");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const RESOURCES = require("./../resources.js");

const User = new mongoose.model("User", mUser.userSchema);

exports.CALL_SEARCH = async (req, res) => {
  try {
    const user = await User.find({ mobile: req.query.mobile }, { savedCount: 1, name: 1, username: 1, mobile: 1, description: 1 });

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