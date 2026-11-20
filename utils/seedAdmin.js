import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const seedAdmin = async () => {
  await connectDB();

  const usersToCreate = [
    {
      name: "Admin",
      email: "admin@logi.com",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Raj",
      email: "raj@logi.com",
      password: "raj123",
      role: "employee",
    },
    {
      name: "Aman",
      email: "aman@logi.com",
      password: "aman123",
      role: "employee",
    },
  ];

  for (const u of usersToCreate) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`${u.name} already exists`);
    } else {
      await User.create(u);
      console.log(`${u.name} created`);
    }
  }

  await mongoose.disconnect();
};

seedAdmin();
