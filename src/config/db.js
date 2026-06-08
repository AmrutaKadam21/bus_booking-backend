const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Mongo URL =", process.env.MONGO_URL);

    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("DB ERROR:", error);
    process.exit(1);
  }
};

module.exports = connectDB;