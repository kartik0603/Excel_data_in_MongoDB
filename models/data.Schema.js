const mongoose = require("mongoose");
const dataSchema = new mongoose.Schema({
  Name: String,
  Email: String,
  Mobile: String,
  City: String,
  Country: String
});

const Data = mongoose.model("data", dataSchema);
module.exports = Data;