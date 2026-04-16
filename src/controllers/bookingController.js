const Booking = require("../models/bookingModel");
const Bus = require("../models/busModel");

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
      passengers: [passengers],
      totalAmount,
      paymentMethod,
      paymentStatus: "completed",
      bookingStatus: "confirmed"
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
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
    
    const availableSeats = bus.seatLayout?.filter(seat => seat.status === 'available') || [];
    const bookedSeats = bus.seatLayout?.filter(seat => seat.status === 'booked') || [];
    const handicapSeats = bus.seatLayout?.filter(seat => seat.isHandicap) || [];
    
    res.json({
      success: true,
      data: {
        totalSeats: bus.seats || 40,
        availableSeats: availableSeats.length,
        bookedSeats: bookedSeats.length,
        seatLayout: bus.seatLayout || [],
        availableSeatsList: availableSeats,
        bookedSeatsList: bookedSeats,
        handicapSeatsList: handicapSeats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    
    const seatLayout = [];
    let seatCounter = 1;

    const seatsPerRow = 4; // 2 left + 2 right

    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / seatsPerRow); // which row
      const col = i % seatsPerRow; // which column (0,1,2,3)

      // 👉 Handicap seats = first row (row 0) + right side (col 2,3)
      const isHandicap = (row === 0 && (col === 2 || col === 3));

      seatLayout.push({
        seatNumber: `${seatCounter}`,
        status: 'available',
        isHandicap: isHandicap
      });

      seatCounter++;
    }
    
    bus.seatLayout = seatLayout;
    bus.seats = totalSeats;
    await bus.save();
    
    res.json({
      success: true,
      message: "Seat layout initialized successfully",
      data: { seatLayout }
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