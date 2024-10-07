const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
};

module.exports = connectDB;


// mongodb://localhost:27017/Uploadexcel

// kartikhirapara800
// 1bngON3FMlQlC0cn

// 1bngON3FMlQlC0cn

// mongodb+srv://kartikhirapara800:1bngON3FMlQlC0cn@excelploader.juskv.mongodb.net/?retryWrites=true&w=majority&appName=excelploader