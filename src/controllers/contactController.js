const Contact = require("../models/contactModel");

// POST /api/contact — save a new message
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "name, email, subject and message are required." });
    }
    const contact = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, message: "Message received. We'll get back to you soon!", data: contact });
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

module.exports = { submitContact, getContacts };
