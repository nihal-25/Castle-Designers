// db.js
import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    isConnected = true;
    console.log("✅ MongoDB Connected (cached)");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};
