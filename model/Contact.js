const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  name: String,
  mobile: String
}, { timestamps: true });

exports.contactSchema = contactSchema;