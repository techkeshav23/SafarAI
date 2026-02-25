const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function searchTravel(
  query: string,
  budgetMax?: number,
  history?: Array<{ role: string; content: string }>
) {
  const res = await fetch(`${API_BASE}/api/search/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, budget_max: budgetMax, history }),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function searchHotels(params: {
  cityCode: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
}) {
  const res = await fetch(`${API_BASE}/api/search/hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Hotel search failed");
  return res.json();
}

/**
 * Perform a standalone flight search using the parameters returned by the agent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchFlights(params: any) {
  const res = await fetch(`${API_BASE}/api/search/flights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Flight search failed");
  return res.json();
}

/* ── Booking Flow ── */

export async function preBookHotel(bookingCode: string) {
  const res = await fetch(`${API_BASE}/api/booking/prebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingCode }),
  });
  if (!res.ok) throw new Error("PreBook failed");
  return res.json();
}

export async function confirmBooking(
  bookingCode: string,
  options?: {
    customerDetails?: unknown[];
    clientReferenceId?: string;
    bookingReferenceId?: string;
    totalFare?: number;
    emailId?: string;
    phoneNumber?: string;
    bookingType?: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/booking/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingCode,
      ...options,
    }),
  });
  if (!res.ok) throw new Error("Booking failed");
  return res.json();
}

export async function getBookingDetail(
  confirmationNumber?: string,
  bookingReferenceId?: string
) {
  const res = await fetch(`${API_BASE}/api/booking/detail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationNumber, bookingReferenceId }),
  });
  if (!res.ok) throw new Error("Failed to get booking details");
  return res.json();
}

export async function cancelBooking(confirmationNumber: string) {
  const res = await fetch(`${API_BASE}/api/booking/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationNumber }),
  });
  if (!res.ok) throw new Error("Cancellation failed");
  return res.json();
}

export async function getBookingsByDate(fromDate: string, toDate: string) {
  const res = await fetch(`${API_BASE}/api/booking/bookings-by-date`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromDate, toDate }),
  });
  if (!res.ok) throw new Error("Failed to get bookings");
  return res.json();
}

export async function getHotelDetails(hotelCode: string) {
  const res = await fetch(`${API_BASE}/api/booking/hotel-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotelCode }),
  });
  if (!res.ok) throw new Error("Failed to get hotel details");
  return res.json();
}
