/**
 * Search engine service - activity search using keyword scoring.
 * Hotels and flights are served exclusively by real APIs (TBO + Amadeus).
 */
import { loadActivities } from "./dataLoader.js";

/**
 * Search activities based on parsed intent.
 */
export function searchActivities(intent) {
  const activities = loadActivities();
  const destination = (intent.destination || "").toLowerCase();
  const themes = new Set(intent.themes || []);

  const scored = activities.map((activity) => {
    let score = 0;

    // Destination match
    if (destination) {
      if (
        activity.city.toLowerCase().includes(destination) ||
        activity.country.toLowerCase().includes(destination)
      ) {
        score += 50;
      }
    }

    // Theme matching in description / category
    const descLower = activity.description.toLowerCase();
    for (const theme of themes) {
      if (descLower.includes(theme) || activity.category.toLowerCase().includes(theme)) {
        score += 15;
      }
    }

    // Rating bonus
    score += activity.rating * 2;

    return {
      ...activity,
      match_score: Math.round(score * 10) / 10,
    };
  });

  scored.sort((a, b) => b.match_score - a.match_score);
  return scored.slice(0, 5);
}
