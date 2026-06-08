const Contact = require("../models/contactModel");

// POST /api/contact — save a new message/feedback
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, rating } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "name, email, subject and message are required." });
    }
    const contact = await Contact.create({ name, email, phone, subject, message, rating: rating || 5 });
    res.status(201).json({ success: true, message: "Feedback received. Thank you!", data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/contact — admin: list all messages
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/contact/testimonials — public: latest 10 feedbacks for homepage
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Contact.find({ showAsTestimonial: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name message rating createdAt");
    res.json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

module.exports = { submitContact, getContacts, getTestimonials };
