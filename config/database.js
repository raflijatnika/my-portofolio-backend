const mongoose = require("mongoose");

const mongoDBConnection = () => {
  try {
    mongoose.connect(process.env.EXPRESS_DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected To Database");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = mongoDBConnection;
