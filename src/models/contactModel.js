const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true },
    phone:   { type: String, trim: true, default: "" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating:  { type: Number, min: 1, max: 5, default: 5 },
    showAsTestimonial: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
