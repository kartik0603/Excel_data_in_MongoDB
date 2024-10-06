const mongoose = require("mongoose");
// require('dotenv').config();

const connectDB = async () => {
  const connection = await mongoose.connect("mongodb://localhost:27017/Uploadexcel", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
};

module.exports = connectDB;
