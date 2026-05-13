require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const busRoutes = require("./src/routes/busRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const contactRoutes = require("./src/routes/contactRoutes");

const app = express(); // ✅ FIRST create app

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is running successfully!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});