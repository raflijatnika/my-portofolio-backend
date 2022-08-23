require("dotenv").config();
const express = require("express");
const app = express();
const mongoDBConnection = require("./config/database");

app.use(express.json({ extended: false }));

mongoDBConnection();

// Routes
app.use("/api/auth", require("./routes/api/auth"));

app.listen(3000, () => console.log(`Server running in 3000`));
