const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: String,
  password: String,
  name: String,
  mobile: String,
  savedCount: { type: Number, default: 0 },
  contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  serviceType: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  location: { lat: Number, long: Number },
  visibility: Boolean,
  deleteFlag: { type: String, default: 'N' }
}, { timestamps: true });

exports.userSchema = userSchema;