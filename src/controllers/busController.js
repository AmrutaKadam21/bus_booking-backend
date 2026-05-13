const Bus = require("../models/busModel");
const BusSeatStatus = require("../models/BusSeatStatus");


exports.deleteBusById = async (req, res) => {
  try {
    const busId = req.params.id;

    const deletedBus = await Bus.findByIdAndDelete(busId);

    if (!deletedBus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.updatePrice = async (req, res) => {
  try {
    const { price } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { price },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Price updated", data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkUpdatePrice = async (req, res) => {
  try {
    const { busIds, price } = req.body;
    await Bus.updateMany({ _id: { $in: busIds } }, { price });
    res.json({ message: "Prices updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePriceByRoute = async (req, res) => {
  try {
    const { from, to, price } = req.body;
    const result = await Bus.updateMany({ from, to }, { price });
    res.json({ message: `${result.modifiedCount} buses updated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.searchBuses = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    const buses = await Bus.find({
      $or: [
        { from: origin, to: destination },
        { originCity: origin, destinationCity: destination }
      ]
    });

    // Get seat availability for each bus
    const busesWithAvailability = await Promise.all(
      buses.map(async (bus) => {
        try {
          const seatStatus = await BusSeatStatus.findOne({
            busId: bus._id,
            date: date || new Date().toISOString().split('T')[0]
          });
          
          const totalSeats = bus.seats || 40;
          const bookedSeats = seatStatus?.bookedSeats || [];
          const availableSeats = totalSeats - bookedSeats.length;
          
          return {
            ...bus.toObject(),
            availableSeats,
            bookedSeats: bookedSeats.length,
            totalSeats,
            searchDate: date // Include search date for frontend time filtering
          };
        } catch {
          return {
            ...bus.toObject(),
            availableSeats: bus.seats || 40,
            bookedSeats: 0,
            totalSeats: bus.seats || 40,
            searchDate: date
          };
        }
      })
    );

    res.json({
      success: true,
      data: busesWithAvailability,
      searchInfo: {
        origin,
        destination,
        date,
        totalBuses: busesWithAvailability.length,
        message: "Time filtering applied on frontend for same-day searches"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateBusSeats = async (req, res) => {
  try {
    const { busId } = req.params;
    const { totalSeats } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    const type = (bus.busType || '').toLowerCase();
    const isSleeper = type.includes('sleeper') && !type.includes('semi');
    const isSemiSleeper = type.includes('semi');
    const seatLayout = [];

    if (isSleeper) {
      const halfSeats = Math.ceil(totalSeats / 2);
      for (let i = 1; i <= totalSeats; i++) {
        seatLayout.push({
          seatNumber: `${i}`,
          status: 'available',
          isHandicap: false,
          deckType: i <= halfSeats ? 'lower' : 'upper',
          seatType: 'sleeper'
        });
      }
    } else if (isSemiSleeper) {
      const seaterCount = Math.ceil(totalSeats * 0.6);
      for (let i = 1; i <= totalSeats; i++) {
        const isLower = i <= seaterCount;
        seatLayout.push({
          seatNumber: `${i}`,
          status: 'available',
          isHandicap: (i <= 2),
          deckType: isLower ? 'lower' : 'upper',
          seatType: isLower ? 'seater' : 'sleeper'
        });
      }
    } else {
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

    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      { seatLayout, seats: totalSeats },
      { new: true }
    );

    res.json({
      success: true,
      message: "Seat layout updated successfully",
      data: updatedBus
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ GET LOCATION (User fetches)
exports.getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId);
    if (!bus) return res.status(404).json({ error: "Bus not found" });
    res.json({ success: true, location: bus.location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ UPDATE LOCATION (Driver sends GPS)
exports.updateBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;
    const { lat, lng } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { location: { lat, lng } },
      { new: true }
    );

    res.json({ success: true, location: bus.location });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seat status for a specific bus and date
exports.getSeatStatus = async (req, res) => {
  try {
    const { busId } = req.params;
    const { date } = req.query;
    
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }
    
    const seatStatus = await BusSeatStatus.findOne({
      busId,
      date: date || new Date().toISOString().split('T')[0]
    });
    
    const totalSeats = bus.seats || 40;
    const bookedSeats = seatStatus?.bookedSeats || [];
    
    // Build seat details with gender info from seatLayout
    const seatDetails = {};
    if (bus.seatLayout && bus.seatLayout.length > 0) {
      bus.seatLayout.forEach(seat => {
        if (seat.status === 'booked' && seat.bookedByGender) {
          seatDetails[seat.seatNumber] = {
            gender: seat.bookedByGender,
            bookedAt: seat.bookedAt
          };
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        totalSeats,
        bookedSeats,
        seatDetails,
        availableSeats: totalSeats - bookedSeats.length
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Book seats for a bus
exports.bookSeats = async (req, res) => {
  try {
    const { busId } = req.params;
    const { seatNumbers, travelDate, passengerGender } = req.body;
    
    const date = travelDate || new Date().toISOString().split('T')[0];
    
    // Find the bus to get seat layout
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }
    
    // Update seat layout with gender information for sleeper buses
    if (bus.busType && bus.busType.toLowerCase().includes('sleeper') && bus.seatLayout) {
      for (const seatNumber of seatNumbers) {
        const seatIndex = bus.seatLayout.findIndex(s => s.seatNumber === seatNumber);
        if (seatIndex !== -1) {
          bus.seatLayout[seatIndex].status = 'booked';
          bus.seatLayout[seatIndex].bookedByGender = passengerGender;
          bus.seatLayout[seatIndex].bookedAt = new Date();
        }
      }
      await bus.save();
    }
    
    // Also update BusSeatStatus for compatibility
    let seatStatus = await BusSeatStatus.findOne({ busId, date });
    
    if (!seatStatus) {
      seatStatus = new BusSeatStatus({
        busId,
        date,
        bookedSeats: seatNumbers
      });
    } else {
      const newSeats = seatNumbers.filter(seat => !seatStatus.bookedSeats.includes(seat));
      seatStatus.bookedSeats.push(...newSeats);
    }
    
    await seatStatus.save();
    
    res.json({
      success: true,
      message: "Seats booked successfully",
      data: { bookedSeats: seatStatus.bookedSeats }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
