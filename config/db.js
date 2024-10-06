const mongoose = require("mongoose");

const connectDB = async () => {
  const connection = await mongoose.connect(
    "mongodb://localhost:27017/ExcelToMongoDB"
  );
  console.log(`MongoDB Connected`);
};

module.exports = connectDB;
