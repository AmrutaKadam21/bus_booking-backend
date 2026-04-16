const mongoose = require("mongoose");

const busSeatStatusSchema = new mongoose.Schema({
  busId:       { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  travelDate:  { type: String, required: true }, // "YYYY-MM-DD"
  bookedSeats: [{ type: String }],               // e.g. ["3","7","12"]
}, { timestamps: true });

// Unique per bus + date combination
busSeatStatusSchema.index({ busId: 1, travelDate: 1 }, { unique: true });

module.exports = mongoose.model("BusSeatStatus", busSeatStatusSchema);
