const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const updatesSchema = new Schema({
  versionName: String,
  versionNumber: String,
  currentVersion: String,
  forceUpdateRequired: Boolean,
  message: String,
  description: String
}, { timestamps: true });

exports.updatesSchema = updatesSchema;