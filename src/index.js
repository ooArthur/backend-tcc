require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cors = require("cors");
const connectDB = require("./config/database");
const router = require("./routes/router");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(cors("*"));


// Logger de IP
app.use((req, res, next) => {
    console.log(`IP: ${req.ip}`);
    next();
});

connectDB();
app.use("/api", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});