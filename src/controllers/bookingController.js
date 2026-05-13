const Booking = require("../models/bookingModel");
const Bus = require("../models/busModel");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Build full HTML ticket email ──
const buildTicketHTML = (booking) => {
  const p = booking.passengers[0] || {};
  const seats = booking.selectedSeats
    .map((s) => `<span style="background:#d84e55;color:#fff;padding:5px 14px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;margin:3px;">Seat ${s.seatNumber}</span>`)
    .join(" ");

  // Inline ticket HTML encoded as data URI for the download button
  const ticketPageHTML = `<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>Ticket ${booking.bookingId}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Segoe UI,Arial,sans-serif;background:#f0f0f0;padding:30px 20px;}.ticket{max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);}.hdr{background:#1a1a2e;color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;}.hdr h1{font-size:20px;font-weight:700;}.bid{text-align:right;font-size:11px;opacity:.7;}.bid b{display:block;font-size:17px;font-weight:700;margin-top:3px;}.body{padding:24px 28px;}.route{background:#f8f9fa;border-radius:8px;padding:18px;margin-bottom:18px;text-align:center;}.cities{display:flex;justify-content:space-between;align-items:center;}.city{font-size:20px;font-weight:800;color:#1a1a2e;}.time{font-size:12px;color:#6c757d;margin-top:3px;}.arrow{font-size:24px;color:#d84e55;font-weight:700;}.date{margin-top:10px;padding-top:10px;border-top:1px dashed #dee2e6;font-size:12px;color:#6c757d;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}.card{background:#f8f9fa;border-radius:8px;padding:14px;}.card-title{font-size:10px;text-transform:uppercase;color:#6c757d;font-weight:600;margin-bottom:8px;}.row{display:flex;justify-content:space-between;margin-bottom:5px;font-size:12px;}.lbl{color:#6c757d;}.val{font-weight:600;color:#1a1a2e;}.seats-box{background:#f8f9fa;border-radius:8px;padding:14px;margin-bottom:18px;}.warn{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;font-size:11px;color:#856404;}.ftr{background:#f8f9fa;padding:12px 28px;text-align:center;font-size:11px;color:#6c757d;border-top:1px solid #e9ecef;}.print-btn{display:block;margin:20px auto;padding:12px 40px;background:#d84e55;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;}@media print{.print-btn{display:none;}body{background:#fff;padding:0;}}</style></head><body><div class='ticket'><div class='hdr'><div><h1>&#127915; E-TICKET</h1><p style='font-size:11px;opacity:.7;margin-top:3px;'>Bus Ticket Confirmation</p></div><div class='bid'>BOOKING ID<b>${booking.bookingId}</b></div></div><div class='body'><div class='route'><div class='cities'><div><div class='city'>${booking.from}</div><div class='time'>${booking.departureTime}</div></div><div class='arrow'>&#8594;</div><div><div class='city'>${booking.to}</div><div class='time'>${booking.arrivalTime}</div></div></div><div class='date'>&#128197; Travel Date: <b>${new Date(booking.travelDate).toLocaleDateString('en-IN')}</b></div></div><div class='grid'><div class='card'><div class='card-title'>Bus Info</div><div class='row'><span class='lbl'>Bus Name</span><span class='val'>${booking.busName}</span></div><div class='row'><span class='lbl'>Payment</span><span class='val'>${booking.paymentMethod.toUpperCase()}</span></div></div><div class='card'><div class='card-title'>Payment</div><div class='row'><span class='lbl'>Total</span><span class='val' style='color:#d84e55;font-size:16px;'>&#8377;${booking.totalAmount}</span></div><div class='row'><span class='lbl'>Seats</span><span class='val'>${booking.selectedSeats.length}</span></div></div></div><div class='seats-box'><div class='card-title' style='margin-bottom:10px;'>Seat Allocation</div>${booking.selectedSeats.map(s=>`<span style='background:#d84e55;color:#fff;padding:4px 12px;border-radius:5px;font-size:12px;font-weight:600;display:inline-block;margin:2px;'>Seat ${s.seatNumber}</span>`).join(' ')}</div><div class='card' style='margin-bottom:18px;'><div class='card-title'>Passenger Info</div><div class='row'><span class='lbl'>Name</span><span class='val'>${p.name||'N/A'}</span></div><div class='row'><span class='lbl'>Email</span><span class='val'>${p.email||'N/A'}</span></div><div class='row'><span class='lbl'>Phone</span><span class='val'>${p.phone||'N/A'}</span></div><div class='row'><span class='lbl'>Gender</span><span class='val'>${p.gender||'N/A'}</span></div></div><div class='warn'><b>Important:</b> Carry valid govt ID &nbsp;|&nbsp; Report 30 mins early &nbsp;|&nbsp; Show ticket at boarding</div></div><div class='ftr'>Thank you for choosing <b>Raj Mudra Travels</b> &#128652;</div></div><button class='print-btn' onclick='window.print()'>&#128424; Print / Save as PDF</button></body></html>`;

  const encodedTicket = Buffer.from(ticketPageHTML).toString('base64');
  const downloadLink = `data:text/html;base64,${encodedTicket}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:20px;background:#f0f0f0;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">
    <div style="background:#1a1a2e;color:#fff;padding:24px 30px;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td><div style="font-size:22px;font-weight:700;">&#127915; E-TICKET</div><div style="font-size:12px;opacity:0.7;margin-top:4px;">Bus Ticket Confirmation</div></td>
        <td style="text-align:right;"><div style="font-size:11px;opacity:0.7;">BOOKING ID</div><div style="font-size:18px;font-weight:700;margin-top:4px;">${booking.bookingId}</div></td>
      </tr></table>
    </div>
    <div style="padding:24px 30px;">
      <div style="background:#f8f9fa;border-radius:10px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="text-align:center;"><div style="font-size:22px;font-weight:800;color:#1a1a2e;">${booking.from}</div><div style="font-size:13px;color:#6c757d;">${booking.departureTime}</div></td>
          <td style="text-align:center;font-size:26px;color:#d84e55;font-weight:700;">&#8594;</td>
          <td style="text-align:center;"><div style="font-size:22px;font-weight:800;color:#1a1a2e;">${booking.to}</div><div style="font-size:13px;color:#6c757d;">${booking.arrivalTime}</div></td>
        </tr></table>
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #dee2e6;font-size:13px;color:#6c757d;text-align:center;">&#128197; Travel Date: <strong>${new Date(booking.travelDate).toLocaleDateString('en-IN')}</strong></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr>
        <td style="width:50%;padding-right:8px;vertical-align:top;">
          <div style="background:#f8f9fa;border-radius:8px;padding:16px;">
            <div style="font-size:11px;text-transform:uppercase;color:#6c757d;font-weight:600;margin-bottom:10px;">BUS INFORMATION</div>
            <div style="font-size:13px;margin-bottom:6px;"><span style="color:#6c757d;">Bus Name</span><br/><strong>${booking.busName}</strong></div>
            <div style="font-size:13px;"><span style="color:#6c757d;">Travel Date</span><br/><strong>${new Date(booking.travelDate).toLocaleDateString('en-IN')}</strong></div>
          </div>
        </td>
        <td style="width:50%;padding-left:8px;vertical-align:top;">
          <div style="background:#f8f9fa;border-radius:8px;padding:16px;">
            <div style="font-size:11px;text-transform:uppercase;color:#6c757d;font-weight:600;margin-bottom:10px;">PAYMENT</div>
            <div style="font-size:13px;margin-bottom:6px;"><span style="color:#6c757d;">Total Amount</span><br/><strong style="color:#d84e55;font-size:18px;">&#8377;${booking.totalAmount}</strong></div>
            <div style="font-size:13px;"><span style="color:#6c757d;">Payment Mode</span><br/><strong>${booking.paymentMethod.toUpperCase()}</strong></div>
          </div>
        </td>
      </tr></table>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6c757d;font-weight:600;margin-bottom:10px;">SEAT ALLOCATION</div>
        <div>${seats}</div>
        <div style="margin-top:10px;font-size:12px;color:#6c757d;">Total Seats: ${booking.selectedSeats.length}</div>
      </div>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6c757d;font-weight:600;margin-bottom:10px;">PASSENGER INFORMATION</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Name</td><td style="font-size:13px;font-weight:600;text-align:right;">${p.name||'N/A'}</td></tr>
          <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Email</td><td style="font-size:13px;font-weight:600;text-align:right;">${p.email||'N/A'}</td></tr>
          <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Phone</td><td style="font-size:13px;font-weight:600;text-align:right;">${p.phone||'N/A'}</td></tr>
          <tr><td style="font-size:13px;color:#6c757d;padding:4px 0;">Gender</td><td style="font-size:13px;font-weight:600;text-align:right;">${p.gender||'N/A'}</td></tr>
        </table>
      </div>

      <!-- Download Ticket Button -->
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${downloadLink}" download="ticket-${booking.bookingId}.html"
          style="display:inline-block;background:linear-gradient(135deg,#d84e55,#b03a40);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(216,78,85,0.4);">
          &#11015; Download Your Ticket
        </a>
        <p style="font-size:11px;color:#9ca3af;margin-top:8px;">Click to download &amp; print your ticket</p>
      </div>

      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px;font-size:12px;color:#856404;">
        <strong>Important:</strong> Carry a valid government ID &nbsp;|&nbsp; Report 30 mins before departure &nbsp;|&nbsp; Show this ticket at boarding
      </div>
    </div>
    <div style="background:#f8f9fa;padding:14px 30px;text-align:center;font-size:11px;color:#6c757d;border-top:1px solid #e9ecef;">
      Thank you for choosing <strong>Raj Mudra Travels</strong> &#128652;
    </div>
  </div>
</body>
</html>`;
};

// ── Send ticket email via Resend (works on Render) ──
const sendTicketEmail = async (booking) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping email.");
    return;
  }
  const passenger = booking.passengers[0];
  if (!passenger?.email) return;
  try {
    const { error } = await resend.emails.send({
      from: "Raj Mudra Travels <onboarding@resend.dev>",
      to: passenger.email,
      subject: `Booking Confirmed! ${booking.bookingId} | ${booking.from} to ${booking.to}`,
      html: buildTicketHTML(booking),
    });
    if (error) console.error("Resend error:", error);
    else console.log(`Ticket email sent to ${passenger.email}`);
  } catch (err) {
    console.error("Email send failed:", err.message);
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
    const bus = await Bus.findById(booking.busId);
    if (bus?.seatLayout) {
      for (const seat of booking.selectedSeats) {
        const idx = bus.seatLayout.findIndex((s) => s.seatNumber === seat.seatNumber);
        if (idx !== -1) { bus.seatLayout[idx].status = "available"; bus.seatLayout[idx].bookedBy = null; }
      }
      await bus.save();
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
