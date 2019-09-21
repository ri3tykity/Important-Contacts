const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: String,
  password: String,
  mobile: String,
  rank: Number,
  contacts:[{ type: Schema.Types.ObjectId, ref: 'Contact' }]
});