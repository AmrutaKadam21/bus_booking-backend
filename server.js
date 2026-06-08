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
  origin: ["http://localhost:5173", "http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
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

// Email test route — visit /test-email?to=youremail@gmail.com
app.get("/test-email", async (req, res) => {
  const nodemailer = require("nodemailer");
  const to = req.query.to;
  if (!to) return res.json({ error: "Add ?to=youremail@gmail.com" });
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.verify();
    await transporter.sendMail({
      from: `"Raj Mudra Travels" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Test Email from Raj Mudra Travels",
      html: "<h2>Email is working! ✅</h2><p>Your booking emails will be sent to this address.</p>",
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
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