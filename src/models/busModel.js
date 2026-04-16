// models/busModel.js - Add seatLayout field
const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'booked', 'selected', 'handicap'],
    default: 'available'
  },
  isHandicap: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookedAt: Date,
});

const busSchema = new mongoose.Schema({
  busName: String,
  busNumber: { type: String, unique: true },
  from: String,
  to: String,
  departureTime: String,
  arrivalTime: String,
  price: Number,
  seats: Number,
  seatLayout: [seatSchema], 
  rating: Number,
  ratingsCount: Number,
  amenities: [String],
  boardingPoints: [String],
  droppingPoints: [String],
  travelDurationMins: Number,
  busType: String,
availableSeats: Number, 
  bookedSeats: [Number],
  reservedSeats: [Number],
  handicappedSeats: [Number],
  location: {
  lat: Number,
  lng: Number,
},
}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);