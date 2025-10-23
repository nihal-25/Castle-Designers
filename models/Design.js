import mongoose from "mongoose";

const designSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: String, required: true },       
  category: { type: String, required: true },   
  selections: { type: [String], default: [] },  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Design", designSchema);
