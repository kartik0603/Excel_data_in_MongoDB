const express = require("express");
const connectDB = require("./config/db");
const dataRouter = require("./routes/data.route");
const mongoose = require('mongoose');
const { getFileData } = require("./controllers/dataController"); 

// Prepare for Mongoose 7 strictQuery changes
mongoose.set('strictQuery', false);
 const PORT =process.env.PORT || 8082;



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
app.get('/api/file-data/:fileKey', getFileData); 


app.listen(PORT, () => {
  console.log("Server is running on port "+PORT);
  connectDB();
});
