const mongoose = require("mongoose");
const { DB_URI } = require("./config.js");

const connectDB = async () => {
  const conn = await mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  });
  return conn;
};

module.exports = { connectDB };
