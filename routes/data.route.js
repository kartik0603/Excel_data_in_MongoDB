const express = require("express");

const dataRouter = express.Router();

const { importFile, exportData ,deleteData } = require("../controllers/dataController");

dataRouter.post("/import", importFile);

dataRouter.get("/export", exportData);
dataRouter.post('/delete',deleteData);
module.exports = dataRouter;
