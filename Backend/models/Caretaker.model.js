import mongoose from "mongoose";

const caretakerSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  role: { type: String },
  status: { type: String, default: "Available" },
  phone: { type: String, required: true },
  specialties: [{ type: String }],
  initials: { type: String },
  rating: { type: Number, default: 0 },
  experience: { type: String },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // references to User model
  email: { type: String, unique: true, required: true },
  photo: { type: String },
});

const Caretaker = mongoose.model("Caretaker", caretakerSchema);
export default Caretaker;
