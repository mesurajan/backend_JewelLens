// src/seeders/admin.seeder.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";

dotenv.config();


//node src/seeders/admin.seeder.js
// Read admin credentials from .env
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN_ROLE = process.env.SEED_ADMIN_ROLE ;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Please set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env"
  );
  process.exit(1);
}

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(
        `Admin with email ${ADMIN_EMAIL} already exists. Updating password...`
      );
      existingAdmin.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
      existingAdmin.name = ADMIN_NAME; // optional: update name if changed
      existingAdmin.role = ADMIN_ROLE; // optional: update role if changed
      await existingAdmin.save();
      console.log("Admin password (and info) updated successfully.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: ADMIN_ROLE,
    });

    console.log("Admin created successfully:");
    console.log(admin);
    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();