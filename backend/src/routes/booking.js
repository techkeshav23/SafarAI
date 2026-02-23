/**
 * Booking router - handles TBO hotel booking flow.
 * PreBook → Book → BookingDetail → Cancel → GenerateVoucher
 */
import { Router } from "express";
import {
  preBook,
  book,
  getBookingDetail,
  cancelBooking,
  generateVoucher,
  getHotelDetails,
  getBookingsByDate,
} from "../services/tboApi.js";

const router = Router();

/**
 * POST /api/booking/prebook
 * Block a room before confirming booking.
 */
router.post("/prebook", async (req, res) => {
  try {
    const { bookingCode } = req.body;
    if (!bookingCode) {
      return res.status(400).json({ error: "bookingCode is required" });
    }
    const result = await preBook(bookingCode);
    res.json(result);
  } catch (err) {
    console.error("PreBook error:", err);
    res.status(500).json({ error: "PreBook failed" });
  }
});

/**
 * POST /api/booking/confirm
 * Confirm a hotel booking.
 */
router.post("/confirm", async (req, res) => {
  try {
    const {
      bookingCode, customerDetails,
      clientReferenceId, bookingReferenceId, totalFare,
      emailId, phoneNumber, bookingType
    } = req.body;
    if (!bookingCode) {
      return res.status(400).json({ error: "bookingCode is required" });
    }
    const result = await book(bookingCode, {
      customerDetails: customerDetails || [],
      clientReferenceId,
      bookingReferenceId,
      totalFare,
      emailId,
      phoneNumber,
      bookingType,
    });
    res.json(result);
  } catch (err) {
    console.error("Book error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

/**
 * POST /api/booking/detail
 * Get booking details.
 */
router.post("/detail", async (req, res) => {
  try {
    const { confirmationNumber, bookingReferenceId } = req.body;
    if (!confirmationNumber && !bookingReferenceId) {
      return res.status(400).json({ error: "confirmationNumber or bookingReferenceId is required" });
    }
    const result = await getBookingDetail({ confirmationNumber, bookingReferenceId });
    res.json(result);
  } catch (err) {
    console.error("BookingDetail error:", err);
    res.status(500).json({ error: "Failed to get booking details" });
  }
});

/**
 * POST /api/booking/cancel
 * Cancel a booking.
 */
router.post("/cancel", async (req, res) => {
  try {
    const { confirmationNumber } = req.body;
    if (!confirmationNumber) {
      return res.status(400).json({ error: "confirmationNumber is required" });
    }
    const result = await cancelBooking(confirmationNumber);
    res.json(result);
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Cancellation failed" });
  }
});

/**
 * POST /api/booking/voucher
 * Generate a booking voucher.
 */
router.post("/voucher", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "bookingId is required" });
    }
    const result = await generateVoucher(bookingId);
    res.json(result);
  } catch (err) {
    console.error("Voucher error:", err);
    res.status(500).json({ error: "Voucher generation failed" });
  }
});

/**
 * POST /api/booking/hotel-details
 * Get detailed hotel info by hotel code.
 */
router.post("/hotel-details", async (req, res) => {
  try {
    const { hotelCode } = req.body;
    if (!hotelCode) {
      return res.status(400).json({ error: "hotelCode is required" });
    }
    const result = await getHotelDetails(hotelCode);
    res.json(result);
  } catch (err) {
    console.error("HotelDetails error:", err);
    res.status(500).json({ error: "Failed to get hotel details" });
  }
});

/**
 * POST /api/booking/bookings-by-date
 * Get all bookings within a date range.
 */
router.post("/bookings-by-date", async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }
    const result = await getBookingsByDate(fromDate, toDate);
    res.json(result);
  } catch (err) {
    console.error("BookingsByDate error:", err);
    res.status(500).json({ error: "Failed to get bookings" });
  }
});

export default router;
