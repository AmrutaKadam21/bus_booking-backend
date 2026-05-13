const Booking = require("../models/bookingModel");
const Bus = require("../models/busModel");
const nodemailer = require("nodemailer").default || require("nodemailer");

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate ticket HTML
const generateTicketHTML = (booking) => {
  const seatItems = booking.selectedSeats.map(s => 
    `<div style="background: #d84e55; color: white; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block; margin: 2px;">Seat ${s.seatNumber}</div>`
  ).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bus Ticket - ${booking.bookingId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f0f0; padding: 20px; }
        .ticket { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; max-width: 600px; margin: 0 auto; }
        .ticket-header { background: #1a1a2e; color: white; padding: 24px 30px; display: flex; justify-content: space-between; align-items: center; }
        .ticket-header h1 { font-size: 24px; font-weight: 600; }
        .booking-id { text-align: right; }
        .booking-id .label { font-size: 11px; opacity: 0.7; }
        .booking-id .id { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .ticket-body { padding: 30px; }
        .route-section { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 25px; }
        .route-display { display: flex; justify-content: space-between; align-items: center; }
        .route-point { text-align: center; }
        .route-point .city { font-size: 22px; font-weight: 700; color: #1a1a2e; }
        .route-point .time { font-size: 14px; color: #6c757d; }
        .route-arrow { font-size: 24px; color: #d84e55; font-weight: 600; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px; }
        .info-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .info-card-title { font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 600; margin-bottom: 12px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .info-label { font-size: 12px; color: #6c757d; }
        .info-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .seats-section { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 25px; }
        .seats-title { font-size: 13px; font-weight: 600; color: #6c757d; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <div><h1>E-TICKET</h1><p>Bus Ticket Confirmation</p></div>
          <div class="booking-id">
            <div class="label">BOOKING ID</div>
            <div class="id">${booking.bookingId}</div>
          </div>
        </div>
        <div class="ticket-body">
          <div class="route-section">
            <div class="route-display">
              <div class="route-point"><div class="city">${booking.from}</div><div class="time">${booking.departureTime}</div></div>
              <div class="route-arrow">→</div>
              <div class="route-point"><div class="city">${booking.to}</div><div class="time">${booking.arrivalTime}</div></div>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="info-card-title">BUS INFORMATION</div>
              <div class="info-row"><span class="info-label">Bus Name</span><span class="info-value">${booking.busName}</span></div>
              <div class="info-row"><span class="info-label">Travel Date</span><span class="info-value">${new Date(booking.travelDate).toLocaleDateString()}</span></div>
            </div>
            <div class="info-card">
              <div class="info-card-title">PAYMENT DETAILS</div>
              <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value">₹${booking.totalAmount}</span></div>
              <div class="info-row"><span class="info-label">Payment Mode</span><span class="info-value">${booking.paymentMethod.toUpperCase()}</span></div>
            </div>
          </div>
          <div class="seats-section">
            <div class="seats-title">SEAT ALLOCATION</div>
            <div>${seatItems}</div>
            <div style="margin-top:12px;font-size:12px;color:#6c757d;">Total Seats: ${booking.selectedSeats.length}</div>
          </div>
          <div class="info-card">
            <div class="info-card-title">PASSENGER INFORMATION</div>
            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${booking.passengers[0]?.name}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${booking.passengers[0]?.email}</span></div>
            <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${booking.passengers[0]?.phone}</span></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send ticket email
const sendTicketEmail = async (booking) => {
  try {
    const ticketHTML = generateTicketHTML(booking);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: booking.passengers[0]?.email,
      subject: `Bus Ticket Confirmation - ${booking.bookingId}`,
      html: ticketHTML
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Ticket email sent successfully');
  } catch (error) {
    console.error('Error sending ticket email:', error);
  }
};

// Generate unique booking ID
const generateBookingId = () => {
  return 'BK' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      busId,
      selectedSeats,
      passengers,
      totalAmount,
      paymentMethod,
      travelDate,
      busName,
      from,
      to,
      departureTime,
      arrivalTime,
      boardingPoint,
      droppingPoint,
    } = req.body;

    // Try to find bus for extra info, but don't fail if not found
    let bus = null;
    try {
      if (busId && busId.match(/^[0-9a-fA-F]{24}$/)) {
        bus = await Bus.findById(busId);
      }
    } catch {}

    const bookingId = generateBookingId();
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
      selectedSeats: selectedSeats.map(seat => ({
        seatNumber: seat.seatNumber,
        seatId: seat.id,
        price: bus?.price || (totalAmount / selectedSeats.length)
      })),
      boardingPoint: boardingPoint || null,
      droppingPoint: droppingPoint || null,
      passengers: [passengers],
      totalAmount,
      paymentMethod,
      paymentStatus: "completed",
      bookingStatus: "confirmed"
    });

    await booking.save();

    // Send ticket email
    await sendTicketEmail(booking);

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully. Ticket sent to your email.",
      data: { bookingId: booking.bookingId, booking }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking by ID
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId }).populate('busId');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookings for a user (by email or phone)
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    // Update booking status
    booking.bookingStatus = 'cancelled';
    await booking.save();
    
    // Free up seats in bus
    const bus = await Bus.findById(booking.busId);
    if (bus && bus.seatLayout) {
      for (const seat of booking.selectedSeats) {
        const seatIndex = bus.seatLayout.findIndex(s => s.seatNumber === seat.seatNumber);
        if (seatIndex !== -1) {
          bus.seatLayout[seatIndex].status = 'available';
          bus.seatLayout[seatIndex].bookedBy = null;
          bus.seatLayout[seatIndex].bookedAt = null;
        }
      }
      await bus.save();
    }
    
    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seat availability for a bus
exports.getSeatAvailability = async (req, res) => {
  try {
    const { busId } = req.params;
    
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }
    
    const layout = bus.seatLayout || [];
    const type = (bus.busType || '').toLowerCase();
    const hasDecks = type.includes('sleeper') || type.includes('semi');

    res.json({
      success: true,
      data: {
        totalSeats: bus.seats || 40,
        busType: bus.busType,
        hasDecks,
        lowerDeck: hasDecks ? layout.filter(s => s.deckType === 'lower') : [],
        upperDeck: hasDecks ? layout.filter(s => s.deckType === 'upper') : [],
        seatLayout: layout,
        availableSeats: layout.filter(s => s.status === 'available').length,
        bookedSeats: layout.filter(s => s.status === 'booked').length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: generate seat layout based on bus type
const generateSeatLayout = (totalSeats, busType = '') => {
  const type = busType.toLowerCase();
  const isSleeper = type.includes('sleeper');
  const isSemiSleeper = type.includes('semi');
  const seatLayout = [];

  if (isSleeper) {
    // Full sleeper: split equally into lower and upper deck
    // Lower deck: seats 1 to half, Upper deck: rest
    const halfSeats = Math.ceil(totalSeats / 2);
    for (let i = 1; i <= totalSeats; i++) {
      const deck = i <= halfSeats ? 'lower' : 'upper';
      seatLayout.push({
        seatNumber: `${i}`,
        status: 'available',
        isHandicap: false,
        deckType: deck,
        seatType: 'sleeper'
      });
    }
  } else if (isSemiSleeper) {
    // Semi-sleeper: lower deck = seater, upper deck = sleeper
    const seaterCount = Math.ceil(totalSeats * 0.6); // 60% seater (lower)
    for (let i = 1; i <= totalSeats; i++) {
      const isLower = i <= seaterCount;
      seatLayout.push({
        seatNumber: `${i}`,
        status: 'available',
        isHandicap: (i <= 2), // first 2 seats handicap on lower
        deckType: isLower ? 'lower' : 'upper',
        seatType: isLower ? 'seater' : 'sleeper'
      });
    }
  } else {
    // Regular seater: single deck, 2+2 layout
    const seatsPerRow = 4;
    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / seatsPerRow);
      const col = i % seatsPerRow;
      seatLayout.push({
        seatNumber: `${i + 1}`,
        status: 'available',
        isHandicap: (row === 0 && (col === 2 || col === 3)),
        deckType: 'single',
        seatType: 'seater'
      });
    }
  }
  return seatLayout;
};

// Initialize seat layout for a bus
exports.initializeSeatLayout = async (req, res) => {
  try {
    const { busId } = req.params;
    const { totalSeats } = req.body;
    
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }
    
    const seatLayout = generateSeatLayout(totalSeats, bus.busType);
    bus.seatLayout = seatLayout;
    bus.seats = totalSeats;
    await bus.save();
    
    res.json({
      success: true,
      message: "Seat layout initialized successfully",
      data: { seatLayout, busType: bus.busType }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hold seats temporarily (for 10 minutes)
exports.holdSeats = async (req, res) => {
  try {
    const { busId, seats } = req.body;
    
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    
    const heldSeats = [];
    for (const seatNumber of seats) {
      const seat = bus.seatLayout?.find(s => s.seatNumber === seatNumber);
      if (seat && seat.status === 'available') {
        seat.status = 'selected';
        heldSeats.push(seatNumber);
      }
    }
    
    await bus.save();
    
    // Release seats after 10 minutes
    setTimeout(async () => {
      const updatedBus = await Bus.findById(busId);
      if (updatedBus && updatedBus.seatLayout) {
        for (const seatNumber of heldSeats) {
          const seat = updatedBus.seatLayout.find(s => s.seatNumber === seatNumber);
          if (seat && seat.status === 'selected') {
            seat.status = 'available';
          }
        }
        await updatedBus.save();
      }
    }, 10 * 60 * 1000);
    
    res.json({
      success: true,
      message: `Seats ${heldSeats.join(', ')} held for 10 minutes`,
      data: { heldSeats }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};