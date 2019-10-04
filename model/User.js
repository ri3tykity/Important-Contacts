const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
};

var mobileValidate = function(mobile) {
  return /^[2-9]{2}[0-9]{8}$/.test(mobile);
};

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: {
    type: String,
    lowercase: true,
    required: [true ,'Email address is required'],
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: String,
  name: {type: String, required: [true, 'Name required']},
  mobile: {
    type: String, 
    required: [true, 'Mobile number required'],
    validate: [mobileValidate, 'Mobile should be 10 digit number only and not start with 0 and 1'],
  },
  savedCount: { type: Number, default: 0 },
  contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  serviceType: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  location: { lat: Number, long: Number },
  visibility: Boolean,
  deleteFlag: { type: String, default: 'N' }
}, { timestamps: true });

exports.userSchema = userSchema;