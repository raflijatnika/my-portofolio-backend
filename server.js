require("dotenv").config();
const express = require("express");
const app = express();
const mongoDBConnection = require("./config/database");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

app.use(express.json({ extended: false }));

mongoDBConnection();

// Routes
app.use("/api/auth", require("./routes/api/auth"));
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.listen(process.env.EXPRESS_PORT || 3000, () =>
  console.log(`Server running in 3000`)
);
