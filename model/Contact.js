const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.contactSchema = new Schema({
  _id: Schema.Types.ObjectId,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  firstName: String,
  lastName: String,
  ext: String,
  number: String,
  location: {lat: Number, long: Number},
  tags: [String],
  rating: Number
});