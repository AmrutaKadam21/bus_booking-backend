const express = require("express");
const router = express.Router();
const { searchBuses } = require("../controllers/busController");

const Bus = require("../models/busModel");
const BusSeatStatus = require("../models/BusSeatStatus");

const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");


const upload = multer({ dest: "uploads/" });

const { deleteBusById, updatePrice, bulkUpdatePrice, updatePriceByRoute } = require("../controllers/busController");
router.delete("/delete/:id", deleteBusById);

// ================= PRICE MANAGEMENT =================
router.put("/price/bulk", bulkUpdatePrice);
router.put("/price/by-route", updatePriceByRoute);
router.put("/price/:id", updatePrice);

// ================= SEARCH BUSES BY ROUTE =================
router.get("/search-buses", async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const query = {};
    if (origin) query.from = { $regex: origin, $options: "i" };
    if (destination) query.to = { $regex: destination, $options: "i" };
    const buses = await Bus.find(query);
    res.json({ success: true, data: buses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SEAT STATUS =================

// GET booked seats for a bus on a specific date
// Query: /seat-status/:busId?date=2024-03-20
router.get("/seat-status/:busId", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date query param required (YYYY-MM-DD)" });

    const bus = await Bus.findById(req.params.busId);
    if (!bus) return res.status(404).json({ error: "Bus not found" });

    let status = await BusSeatStatus.findOne({ busId: req.params.busId, travelDate: date });
    if (!status) {
      status = await BusSeatStatus.create({ busId: req.params.busId, travelDate: date, bookedSeats: [] });
    }

    res.json({ totalSeats: bus.seats || 40, bookedSeats: status.bookedSeats, travelDate: date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BOOK seats for a bus on a specific date
router.post("/book-seats/:busId", async (req, res) => {
  try {
    const { seatNumbers, travelDate } = req.body;
    if (!travelDate) return res.status(400).json({ error: "travelDate required (YYYY-MM-DD)" });

    let status = await BusSeatStatus.findOne({ busId: req.params.busId, travelDate });
    if (!status) {
      status = await BusSeatStatus.create({ busId: req.params.busId, travelDate, bookedSeats: [] });
    }

    const alreadyBooked = seatNumbers.filter(s => status.bookedSeats.includes(s));
    if (alreadyBooked.length > 0) {
      return res.status(400).json({ error: `Seats ${alreadyBooked.join(", ")} already booked for this date` });
    }

    status.bookedSeats.push(...seatNumbers);
    await status.save();

    res.json({ success: true, bookedSeats: status.bookedSeats, travelDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RELEASE seats for a bus on a specific date (cancellation)
router.post("/release-seats/:busId", async (req, res) => {
  try {
    const { seatNumbers, travelDate } = req.body;
    if (!travelDate) return res.status(400).json({ error: "travelDate required" });

    const status = await BusSeatStatus.findOne({ busId: req.params.busId, travelDate });
    if (!status) return res.status(404).json({ error: "Seat status not found" });

    status.bookedSeats = status.bookedSeats.filter(s => !seatNumbers.includes(s));
    await status.save();

    res.json({ success: true, bookedSeats: status.bookedSeats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADD BUS =================
router.post("/add", async (req, res) => {
  try {
    const newBus = new Bus(req.body);
    await newBus.save();
    res.json({ message: "Bus added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const buses = await Bus.find();
    console.log("Fetched buses:", buses);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CSV UPLOAD =================
router.post("/upload-csv", upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on("data", (data) => {
      console.log("Row:", data);

      const price = Number(String(data.price || "").trim());
      const seats = Number(String(data.seats || "").trim());

      if (isNaN(price) || isNaN(seats)) {
        console.warn("Skipping row with invalid price/seats:", data);
        return;
      }

      results.push({
        busName:           data.busName?.trim(),
        busNumber:         data.busNumber?.trim(),
        from:              data.from?.trim(),
        to:                data.to?.trim(),
        departureTime:     data.departureTime?.trim(),
        arrivalTime:       data.arrivalTime?.trim(),
        price,
        seats,
        busType:           data.busType?.trim(),
        travelDurationMins: data.travelDurationMins ? Number(String(data.travelDurationMins).trim()) : undefined,
        rating:            data.rating ? Number(String(data.rating).trim()) : undefined,
        amenities:         data.amenities ? data.amenities.split("|").map(s => s.trim()).filter(Boolean) : [],
        boardingPoints:    data.boardingPoints ? data.boardingPoints.split("|").map(s => s.trim()).filter(Boolean) : [],
        droppingPoints:    data.droppingPoints ? data.droppingPoints.split("|").map(s => s.trim()).filter(Boolean) : [],
      });
    })
    .on("end", async () => {
      try {
        if (results.length === 0) {
          return res.status(400).json({ error: "CSV is empty or has invalid data" });
        }

        console.log("Final Data:", results);

        await Bus.bulkWrite(
          results.map(bus => ({
            updateOne: {
              filter: { busNumber: bus.busNumber },
              update: { $set: bus },
              upsert: true,
            },
          }))
        );

        fs.unlinkSync(req.file.path);

        res.json({ message: `CSV uploaded successfully. ${results.length} buses processed.` });

      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    })
    .on("error", (err) => {
      res.status(500).json({ error: "Error reading CSV: " + err.message });
    });
});

// SEARCH BUS BY NAME OR ROUTE
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    const bus = await Bus.findOne({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { from: { $regex: query, $options: "i" } },
        { to: { $regex: query, $options: "i" } },
      ],
    });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 GET BUS BY BUS NUMBER
router.get("/by-number/:busNumber", async (req, res) => {
  try {
    const bus = await Bus.findOne({ busNumber: req.params.busNumber });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/update-route/:id", async (req, res) => {
  try {
    const { from, to, departureTime, arrivalTime } = req.body;

    if (!from || !to || !departureTime || !arrivalTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      { $set: { from, to, departureTime, arrivalTime } },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json({ message: "Route updated successfully", data: updatedBus });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//location tracing of bus

const {
  updateBusLocation,
  getBusLocation,
} = require("../controllers/busController");

// Driver updates location
router.post("/location/:busId", updateBusLocation);

// User gets location
router.get("/location/:busId", getBusLocation);


module.exports = router;
