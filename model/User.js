const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
};

var mobileValidate = function (mobile) {
  return /^[2-9]{1}[0-9]{9}$/.test(mobile);
};

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: {
    type: String,
    lowercase: true,
    required: [true, 'Email address is required'],
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: String,
  name: { type: String, required: [true, 'Name required'] },
  mobile: {
    type: String,
    required: [true, 'Mobile number required'],
    validate: [mobileValidate, 'Mobile should be 10 digit number only and not start with 0 and 1'],
  },
  savedCount: { type: Number, default: 0 },
  contacts: [{
    _id: Schema.Types.ObjectId,
    name: String,
    mobile: {type: String}
  }],
  serviceType: [],
  location: { lat: Number, long: Number },
  visibility: Boolean,
  description: { type: String, default: 'Hey there! I am using important contacts' },
  deleteFlag: { type: String, default: 'N' }
}, { timestamps: true });

exports.userSchema = userSchema;