const mongoose = require("mongoose");

const busSeatStatusSchema = new mongoose.Schema({
  busId:      { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  travelDate: { type: String, required: true }, // "YYYY-MM-DD"
  bookedSeats: [{ type: String }],              // e.g. ["3","7","12"]
  seatDetails: {                                // gender info per seat
    type: Map,
    of: new mongoose.Schema({
      gender:   { type: String, enum: ["male", "female", "other"] },
      bookedAt: { type: Date, default: Date.now },
    }, { _id: false }),
    default: {},
  },
}, { timestamps: true });

busSeatStatusSchema.index({ busId: 1, travelDate: 1 }, { unique: true });

module.exports = mongoose.model("BusSeatStatus", busSeatStatusSchema);
