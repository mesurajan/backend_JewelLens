// src/config/dbConfig.js
import mongoose from "mongoose";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error(chalk.red("❌ MONGO_URI not set"));
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, 
    });

    console.log(chalk.green("✅ MongoDB Connected Successfully!"));
  } catch (err) {
    console.error(chalk.red("❌ MongoDB Connection Failed:"), err.message);
    process.exit(1);
  }
};

export default connectDB;