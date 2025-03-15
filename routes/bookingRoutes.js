const express = require("express");
const Vehicle = require("../models/Vehicle");

const router = express.Router();

// ✅ Create a booking inside a vehicle
router.post("/", async (req, res) => {
  console.log("📥 Incoming Booking Request:", req.body); 
  try {
    const { userId, vehicleId, startDate, endDate, totalPrice } = req.body;

    if (!userId || !vehicleId || !startDate || !endDate || !totalPrice) {
      console.log("❌ Missing required fields");  // ✅ Log missing data
      return res.status(400).json({ message: "All fields are required!" });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
      console.log("❌ Vehicle not found");
      return res.status(404).json({ message: "Vehicle not found!" });
  }


    // Check for date conflicts
    const isBooked = vehicle.bookings.some(booking => 
      (new Date(startDate) <= booking.endDate && new Date(endDate) >= booking.startDate)
    );
    if (isBooked) return res.status(400).json({ message: "Vehicle is already booked for these dates" });

    // Add booking to vehicle
    vehicle.bookings.push({ user: userId, startDate, endDate, totalPrice, status: "confirmed" });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ message: "Server error, please try again later" });
}
});

// ✅ Get bookings for a specific vehicle
router.get("/:vehicleId", async (req, res) => {
  try {
    console.log("📥 Fetching bookings for vehicle:", req.params.vehicleId);

    // Ensure the vehicle ID is valid
    if (!req.params.vehicleId) {
      return res.status(400).json({ message: "Vehicle ID is required" });
    }

    // Find vehicle and populate bookings
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("✅ Bookings found:", vehicle.bookings);
    res.json(vehicle.bookings);
  } catch (error) {
    console.error("❌ Server error while fetching bookings:", error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});


// ✅ Cancel a booking
router.delete("/:vehicleId/:bookingId", async (req, res) => {
  try {
    const { vehicleId, bookingId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    vehicle.bookings = vehicle.bookings.filter(booking => booking._id.toString() !== bookingId);
    await vehicle.save();

    res.json({ message: "Booking canceled" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get bookings for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching bookings for user: ${userId}`);

    // Find all vehicles where the user has a booking
    const vehicles = await Vehicle.find({ "bookings.user": userId });

    // Extract only the bookings for that user
    const userBookings = vehicles.flatMap(vehicle =>
      vehicle.bookings
        .filter(booking => booking.user.toString() === userId)
        .map(booking => ({
          _id: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          status: booking.status,
          vehicle: {
            _id: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            image: vehicle.images?.[0], // Return vehicle image if available
          },
        }))
    );

    res.json(userBookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
