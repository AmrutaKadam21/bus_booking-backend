const express = require("express");
const router = express.Router();
const { submitContact, getContacts, getTestimonials } = require("../controllers/contactController");

router.get("/testimonials", getTestimonials);
router.post("/", submitContact);
router.get("/", getContacts);

module.exports = router;
