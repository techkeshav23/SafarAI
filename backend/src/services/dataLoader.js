/**
 * Data loader service - loads JSON data for activities (the only remaining mock dataset).
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");

export function loadActivities() {
  return JSON.parse(readFileSync(join(DATA_DIR, "activities.json"), "utf-8"));
}
