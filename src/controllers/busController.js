const Bus = require("../models/busModel");


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
      originCity: origin,
      destinationCity: destination,
    });

    res.json({
      success: true,
      data: buses,
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

    const seatLayout = [];
    let seatCounter = 1;
    const seatsPerRow = 4;

    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / seatsPerRow);
      const col = i % seatsPerRow;

      const isHandicap = (row === 0 && (col === 2 || col === 3));

      seatLayout.push({
        seatNumber: `${seatCounter}`,
        status: 'available',
        isHandicap: isHandicap
      });

      seatCounter++;
    }

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { seatLayout, seats: totalSeats },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.json({
      success: true,
      message: "Seat layout updated successfully",
      data: bus
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// ✅ GET LOCATION (User fetches)
exports.getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId);

    res.json({ success: true, location: bus.location });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
