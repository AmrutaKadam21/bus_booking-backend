// models/bookingModel.js
const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'] },
});

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  busName: String,
  from: String,
  to: String,
  travelDate: { type: Date, required: true },
  departureTime: String,
  arrivalTime: String,
  selectedSeats: [{
    seatNumber: String,
    seatId: Number,
    price: Number
  }],
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},

  passengers: [passengerSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  bookingStatus: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
  bookingDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);