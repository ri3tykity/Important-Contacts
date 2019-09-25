const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  tagName: String,
  created_at: Date,
  modified_at: Date,
  deleteFlag: { type: String, default: 'N' }
});

tagSchema.pre(['save', 'updateOne'], function(next){
  now = new Date();
  this.modified_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

exports.tagSchema = tagSchema;