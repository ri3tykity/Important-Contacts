const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: String,
  password: String,
  mobile: String,
  rank: Number,
  contacts:[{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  created_at: Date,
  modified_at: Date,
  deleteFlag: { type: String, default: 'N' }
});

userSchema.pre(['save', 'updateOne'], function(next){
  now = new Date();
  this.modified_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

exports.userSchema = userSchema;