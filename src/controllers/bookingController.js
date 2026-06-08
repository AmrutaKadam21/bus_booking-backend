const Booking = require("../models/bookingModel");
const Bus = require("../models/busModel");
const nodemailer = require("nodemailer");

// ── Gmail transporter ──
const createTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Build full HTML ticket email ──
const buildTicketHTML = (booking) => {
  const p = booking.passengers[0] || {};
  const seats = booking.selectedSeats
    .map((s) => `<span style="background:#d84e55;color:#fff;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;margin:3px;">Seat ${s.seatNumber}</span>`)
    .join(" ");

  const frontendUrl = process.env.FRONTEND_URL || "https://bus-booking-frontend.vercel.app";
  const ticketUrl = `${frontendUrl}/tickets`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td>
          <div style="font-size:24px;font-weight:800;letter-spacing:1px;">&#127915; E-TICKET</div>
          <div style="font-size:12px;opacity:0.7;margin-top:4px;">Raj Mudra Travels — Booking Confirmation</div>
        </td>
        <td style="text-align:right;">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Booking ID</div>
          <div style="font-size:20px;font-weight:800;margin-top:4px;color:#f97316;">${booking.bookingId}</div>
        </td>
      </tr></table>
    </div>

    <!-- GREETING -->
    <div style="padding:24px 32px 0;">
      <p style="font-size:16px;color:#1a1a2e;font-weight:600;margin:0 0 4px;">Hey ${p.name || 'Traveler'}, your trip is confirmed! &#127881;</p>
      <p style="font-size:13px;color:#6c757d;margin:0;">Here are your booking details. Have a safe journey!</p>
    </div>

    <!-- ROUTE -->
    <div style="margin:20px 32px;background:#fff7ed;border-radius:12px;padding:20px;border:1px solid #fed7aa;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td style="text-align:center;width:40%;">
          <div style="font-size:24px;font-weight:800;color:#1a1a2e;">${booking.from}</div>
          <div style="font-size:12px;color:#f97316;font-weight:600;margin-top:4px;">${booking.departureTime}</div>
        </td>
        <td style="text-align:center;width:20%;">
          <div style="font-size:28px;color:#d84e55;font-weight:700;">&#8594;</div>
        </td>
        <td style="text-align:center;width:40%;">
          <div style="font-size:24px;font-weight:800;color:#1a1a2e;">${booking.to}</div>
          <div style="font-size:12px;color:#f97316;font-weight:600;margin-top:4px;">${booking.arrivalTime}</div>
        </td>
      </tr></table>
      <div style="margin-top:14px;padding-top:14px;border-top:1px dashed #fed7aa;text-align:center;font-size:13px;color:#6c757d;">
        &#128197; <strong>Travel Date:</strong> ${new Date(booking.travelDate).toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
      </div>
    </div>

    <!-- INFO GRID -->
    <div style="padding:0 32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr>
        <td style="width:50%;padding-right:8px;vertical-align:top;">
          <div style="background:#f8f9fa;border-radius:10px;padding:16px;">
            <div style="font-size:10px;text-transform:uppercase;color:#6c757d;font-weight:700;letter-spacing:1px;margin-bottom:10px;">BUS INFORMATION</div>
            <div style="font-size:13px;margin-bottom:6px;"><span style="color:#6c757d;">Bus Name</span><br/><strong style="color:#1a1a2e;">${booking.busName}</strong></div>
            <div style="font-size:13px;"><span style="color:#6c757d;">Bus Type</span><br/><strong style="color:#1a1a2e;">${booking.busType || 'N/A'}</strong></div>
          </div>
        </td>
        <td style="width:50%;padding-left:8px;vertical-align:top;">
          <div style="background:#f8f9fa;border-radius:10px;padding:16px;">
            <div style="font-size:10px;text-transform:uppercase;color:#6c757d;font-weight:700;letter-spacing:1px;margin-bottom:10px;">PAYMENT</div>
            <div style="font-size:13px;margin-bottom:6px;"><span style="color:#6c757d;">Total Paid</span><br/><strong style="color:#d84e55;font-size:20px;">&#8377;${booking.totalAmount}</strong></div>
            <div style="font-size:13px;"><span style="color:#6c757d;">Payment Mode</span><br/><strong style="color:#1a1a2e;">${booking.paymentMethod.toUpperCase()}</strong></div>
          </div>
        </td>
      </tr></table>
    </div>

    <!-- SEATS -->
    <div style="margin:0 32px 16px;background:#f8f9fa;border-radius:10px;padding:16px;">
      <div style="font-size:10px;text-transform:uppercase;color:#6c757d;font-weight:700;letter-spacing:1px;margin-bottom:10px;">SEAT ALLOCATION</div>
      <div>${seats}</div>
      <div style="margin-top:10px;font-size:12px;color:#6c757d;">Total Seats: ${booking.selectedSeats.length}</div>
    </div>

    <!-- PASSENGER -->
    <div style="margin:0 32px 20px;background:#f8f9fa;border-radius:10px;padding:16px;">
      <div style="font-size:10px;text-transform:uppercase;color:#6c757d;font-weight:700;letter-spacing:1px;margin-bottom:10px;">PASSENGER INFORMATION</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Name</td><td style="font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">${p.name||'N/A'}</td></tr>
        <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Email</td><td style="font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">${p.email||'N/A'}</td></tr>
        <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Phone</td><td style="font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">${p.phone||'N/A'}</td></tr>
        <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Gender</td><td style="font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">${p.gender||'N/A'}</td></tr>
      </table>
    </div>

    <!-- DOWNLOAD BUTTON -->
    <div style="text-align:center;padding:0 32px 28px;">
      <a href="${ticketUrl}" style="display:inline-block;background:linear-gradient(135deg,#d84e55,#b03a40);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(216,78,85,0.4);">
        &#11015; View &amp; Download Ticket
      </a>
      <p style="font-size:11px;color:#9ca3af;margin-top:10px;">Click to view your full ticket and print / download as PDF</p>
    </div>

    <!-- WARNING -->
    <div style="margin:0 32px 24px;background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:14px;font-size:12px;color:#856404;">
      <strong>&#9888; Important Instructions:</strong><br/>
      &bull; Carry a valid government-issued photo ID &nbsp;|&nbsp;
      &bull; Report at boarding point 30 mins before departure &nbsp;|&nbsp;
      &bull; Show this ticket at boarding
    </div>

    <!-- FOOTER -->
    <div style="background:#1a1a2e;padding:18px 32px;text-align:center;">
      <p style="font-size:13px;color:#fff;font-weight:600;margin:0 0 4px;">Raj Mudra Travels &#128652;</p>
      <p style="font-size:11px;color:#9ca3af;margin:0;">Thank you for choosing us. Safe travels!</p>
    </div>
  </div>
</body>
</html>`;
};

// ── Send ticket email via Gmail ──
const sendTicketEmail = async (booking) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("Gmail credentials not set — skipping email.");
    return;
  }
  const passenger = booking.passengers[0];
  if (!passenger?.email) {
    console.log("No passenger email found — skipping email.");
    return;
  }
  try {
    const transporter = createTransporter();
    // Verify connection first
    await transporter.verify();
    console.log("Gmail connection verified ✔");
    const info = await transporter.sendMail({
      from: `"Raj Mudra Travels" <${process.env.GMAIL_USER}>`,
      to: passenger.email,
      subject: `✅ Booking Confirmed! ${booking.bookingId} | ${booking.from} → ${booking.to}`,
      html: buildTicketHTML(booking),
    });
    console.log(`✔ Ticket email sent to ${passenger.email} | MessageId: ${info.messageId}`);
  } catch (err) {
    console.error("✖ Email send failed:", err.message);
    console.error("Full error:", err);
  }
};

// ── Generate unique booking ID ──
const generateBookingId = () =>
  "BK" + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();

// ── Create new booking ──
exports.createBooking = async (req, res) => {
  try {
    const {
      busId, selectedSeats, passengers, totalAmount, paymentMethod,
      travelDate, busName, from, to, departureTime, arrivalTime,
      boardingPoint, droppingPoint,
    } = req.body;

    let bus = null;
    try {
      if (busId && busId.match(/^[0-9a-fA-F]{24}$/)) bus = await Bus.findById(busId);
    } catch {}

    const bookingId = req.body.bookingId || generateBookingId();
    const booking = new Booking({
      userId: req.body.userId || req.user?.id || null,
      bookingId,
      busId: bus ? bus._id : undefined,
      busName: bus?.busName || busName || "N/A",
      from: bus?.from || from || "N/A",
      to: bus?.to || to || "N/A",
      travelDate: travelDate ? new Date(travelDate) : new Date(),
      departureTime: bus?.departureTime || departureTime || "",
      arrivalTime: bus?.arrivalTime || arrivalTime || "",
      selectedSeats: selectedSeats.map((seat) => ({
        seatNumber: seat.seatNumber,
        seatId: seat.id,
        price: bus?.price || totalAmount / selectedSeats.length,
      })),
      boardingPoint: boardingPoint || null,
      droppingPoint: droppingPoint || null,
      passengers: [passengers],
      totalAmount,
      paymentMethod,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
    });

    await booking.save();
    await sendTicketEmail(booking);

    res.status(201).json({
      success: true,
      message: "Booking confirmed. Ticket sent to your email.",
      data: { bookingId: booking.bookingId, booking },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get booking by ID ──
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).populate("busId");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get user bookings ──
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Cancel booking ──
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    booking.bookingStatus = "cancelled";
    await booking.save();

    // Release seats from BusSeatStatus (date-specific, with gender cleanup)
    const BusSeatStatus = require("../models/BusSeatStatus");
    const travelDate = booking.travelDate
      ? new Date(booking.travelDate).toISOString().split("T")[0]
      : null;
    if (travelDate && booking.busId) {
      const seatNumbers = booking.selectedSeats.map(s => String(s.seatNumber));
      const status = await BusSeatStatus.findOne({ busId: booking.busId, travelDate });
      if (status) {
        status.bookedSeats = status.bookedSeats.filter(s => !seatNumbers.includes(s));
        for (const sn of seatNumbers) status.seatDetails.delete(sn);
        await status.save();
      }
    }

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get seat availability ──
exports.getSeatAvailability = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    const layout = bus.seatLayout || [];
    const type = (bus.busType || "").toLowerCase();
    const hasDecks = type.includes("sleeper") || type.includes("semi");
    res.json({
      success: true,
      data: {
        totalSeats: bus.seats || 40, busType: bus.busType, hasDecks,
        lowerDeck: hasDecks ? layout.filter((s) => s.deckType === "lower") : [],
        upperDeck: hasDecks ? layout.filter((s) => s.deckType === "upper") : [],
        seatLayout: layout,
        availableSeats: layout.filter((s) => s.status === "available").length,
        bookedSeats: layout.filter((s) => s.status === "booked").length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Initialize seat layout ──
exports.initializeSeatLayout = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    const { totalSeats } = req.body;
    const type = (bus.busType || "").toLowerCase();
    const isSleeper = type.includes("sleeper");
    const isSemi = type.includes("semi");
    const layout = [];
    if (isSleeper) {
      const half = Math.ceil(totalSeats / 2);
      for (let i = 1; i <= totalSeats; i++)
        layout.push({ seatNumber: `${i}`, status: "available", isHandicap: false, deckType: i <= half ? "lower" : "upper", seatType: "sleeper" });
    } else if (isSemi) {
      const sc = Math.ceil(totalSeats * 0.6);
      for (let i = 1; i <= totalSeats; i++)
        layout.push({ seatNumber: `${i}`, status: "available", isHandicap: i <= 2, deckType: i <= sc ? "lower" : "upper", seatType: i <= sc ? "seater" : "sleeper" });
    } else {
      for (let i = 0; i < totalSeats; i++)
        layout.push({ seatNumber: `${i + 1}`, status: "available", isHandicap: false, deckType: "single", seatType: "seater" });
    }
    bus.seatLayout = layout; bus.seats = totalSeats;
    await bus.save();
    res.json({ success: true, message: "Seat layout initialized", data: { seatLayout: layout } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Hold seats temporarily ──
exports.holdSeats = async (req, res) => {
  try {
    const { busId, seats } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    const held = [];
    for (const sn of seats) {
      const seat = bus.seatLayout?.find((s) => s.seatNumber === sn);
      if (seat?.status === "available") { seat.status = "selected"; held.push(sn); }
    }
    await bus.save();
    setTimeout(async () => {
      const b = await Bus.findById(busId);
      if (b?.seatLayout) {
        for (const sn of held) { const s = b.seatLayout.find((x) => x.seatNumber === sn); if (s?.status === "selected") s.status = "available"; }
        await b.save();
      }
    }, 10 * 60 * 1000);
    res.json({ success: true, message: `Seats held for 10 minutes`, data: { heldSeats: held } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
