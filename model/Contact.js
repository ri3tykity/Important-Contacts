const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  _id: Schema.Types.ObjectId,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  firstName: String,
  lastName: String,
  ext: String,
  number: String,
  location: {lat: Number, long: Number},
  tags: [String],
  rating: Number,
  created_at: Date,
  modified_at: Date,
  deleteFlag: { type: String, default: 'N' }
});

contactSchema.pre(['save', 'updateOne'], function(next){
  now = new Date();
  this.modified_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

exports.contactSchema = contactSchema;