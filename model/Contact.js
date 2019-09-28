const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  _id: Schema.Types.ObjectId,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  number: String,
  location: {lat: Number, long: Number},
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  rating: Number,
  deleteFlag: { type: String, default: 'N' }
},{timestamps: true});

exports.contactSchema = contactSchema;