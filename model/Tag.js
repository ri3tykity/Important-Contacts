const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  tagName: String,
  deleteFlag: { type: String, default: 'N' }
},{timestamps: true});

exports.tagSchema = tagSchema;