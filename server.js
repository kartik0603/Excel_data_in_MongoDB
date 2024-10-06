const express = require("express");
const connectDB = require("./config/db");
const dataRouter = require("./routes/data.route");
const mongoose = require('mongoose');

// Prepare for Mongoose 7 strictQuery changes
mongoose.set('strictQuery', false);




const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(express.json());

// middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/data',dataRouter);


// html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.listen(8082, () => {
  console.log("Server is running on port 8082");
  connectDB();
});
