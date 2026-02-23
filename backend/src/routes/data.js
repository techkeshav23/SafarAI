/**
 * Static data router - TBO country/city lookups.
 */
import { Router } from "express";
import { getCountryList, getCityList } from "../services/tboApi.js";

const router = Router();

/**
 * GET /api/data/countries
 */
router.get("/countries", async (req, res) => {
  try {
    const result = await getCountryList();
    res.json(result);
  } catch (err) {
    console.error("CountryList error:", err);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

/**
 * POST /api/data/cities
 */
router.post("/cities", async (req, res) => {
  try {
    const { countryCode } = req.body;
    if (!countryCode) {
      return res.status(400).json({ error: "countryCode is required" });
    }
    const result = await getCityList(countryCode);
    res.json(result);
  } catch (err) {
    console.error("CityList error:", err);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

export default router;
