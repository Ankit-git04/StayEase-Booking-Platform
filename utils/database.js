require('dotenv').config();
const mongoose = require('mongoose');

const mongo_url = process.env.MONGODB_URI;

const mongoClient = async (callback) => {
  try {
    await mongoose.connect(mongo_url);

    console.log("Connected to MongoDB successfully!");

    callback();
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
};

module.exports = { mongoClient };