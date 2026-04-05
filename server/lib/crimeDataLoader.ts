/**
 * Crime incident data loader — server-side only.
 *
 * Reads every Crime*.csv from server/assets/crime/ (HRPS weekly exports).
 * Files are added weekly; all of them are aggregated into a single
 * in-process cache so historical data compounds over time.
 *
 * CSV format (HRPS export):
 *   OBJECTID, EVT_RT, EVT_RIN, EVT_DATE, LOCATION, RUCR, RUCR_EXT_D, x, y
 *   x/y are EPSG:3857 (Web Mercator); some rows omit x/y.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ─── Internal record ──────────────────────────────────────────────────────────

interface CrimeRecord {
  date: Date;
  location: string;
  crimeCode: number;
  crimeType: string;
  lat: number | null;
  lon: number | null;
}

// ─── Public result ────────────────────────────────────────────────────────────

export interface CrimeScoreResult {
  /** Safety score 20–95 (higher = safer). */
  score: number;
  /** Raw incident count within the search radius. */
  crimeCount: number;
  /** Severity-weighted total within the search radius. */
  weightedTotal: number;
  /** CSV file names that contributed to this result. */
  files: string[];
  /** Date of the most recent incident across all loaded files. */
  latestIncidentDate: Date | null;
}

// ─── RUCR severity weights ────────────────────────────────────────────────────
//
// Higher weight = more serious offence, pulls the safety score lower.
//   1410–1460  Assault variants          → 3
//   1610       Robbery                   → 5
//   2120       Break and Enter           → 3
//   2132/2142  Theft from Vehicle        → 1
//   2135       Theft of Vehicle          → 2

const CRIME_WEIGHTS: Partial<Record<number, number>> = {
  1410: 3,
  1420: 3,
  1430: 3,
  1460: 3,
  1610: 5,
  2120: 3,
  2132: 1,
  2135: 2,
  2142: 1,
};

// ─── Coordinate conversion ────────────────────────────────────────────────────

/** Converts EPSG:3857 (Web Mercator) to WGS-84 degrees. */
function mercatorToLatLon(x: number, y: number): { lat: number; lon: number } {
  const lon = (x / 20037508.342789244) * 180;
  const lat =
    (2 * Math.atan(Math.exp(y / 6378137.0)) - Math.PI / 2) * (180 / Math.PI);
  return { lat, lon };
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCrimeCsv(content: string): CrimeRecord[] {
  const lines = content.split("\n");
  const records: CrimeRecord[] = [];

  // Row 0 is the header — skip it.
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Columns: OBJECTID,EVT_RT,EVT_RIN,EVT_DATE,LOCATION,RUCR,RUCR_EXT_D[,x,y]
    const cols = raw.split(",");
    if (cols.length < 7) continue;

    const crimeCode = parseInt(cols[5], 10);
    if (isNaN(crimeCode)) continue;

    const date = new Date(cols[3]?.trim() ?? "");
    if (isNaN(date.getTime())) continue;

    let lat: number | null = null;
    let lon: number | null = null;

    if (cols.length >= 9 && cols[7]?.trim() && cols[8]?.trim()) {
      const x = parseFloat(cols[7]);
      const y = parseFloat(cols[8]);
      if (!isNaN(x) && !isNaN(y)) {
        ({ lat, lon } = mercatorToLatLon(x, y));
      }
    }

    records.push({
      date,
      location: cols[4]?.trim() ?? "",
      crimeCode,
      crimeType: cols[6]?.trim() ?? "",
      lat,
      lon,
    });
  }

  return records;
}

// ─── Module-level cache ───────────────────────────────────────────────────────

interface CrimeCache {
  crimes: CrimeRecord[];
  files: string[];
  latestDate: Date | null;
}

let _cache: CrimeCache | null = null;

function loadAllCrimeFiles(): CrimeCache {
  if (_cache) return _cache;

  const assetsDir = join(process.cwd(), "server", "assets", "crime");
  const crimes: CrimeRecord[] = [];
  const files: string[] = [];

  try {
    const csvFiles = readdirSync(assetsDir)
      .filter((f) => /^Crime.*\.csv$/i.test(f))
      .sort(); // chronological order when files include timestamps

    let latestDate: Date | null = null;

    for (const file of csvFiles) {
      try {
        const content = readFileSync(join(assetsDir, file), "utf-8");
        const parsed = parseCrimeCsv(content);
        for (const c of parsed) {
          crimes.push(c);
          if (!latestDate || c.date > latestDate) latestDate = c.date;
        }
        files.push(file);
      } catch (err) {
        console.error(`[crimeDataLoader] Cannot read ${file}:`, err);
      }
    }

    _cache = { crimes, files, latestDate };
  } catch (err) {
    console.error("[crimeDataLoader] Cannot read assets directory:", err);
    _cache = { crimes: [], files: [], latestDate: null };
  }
  return _cache;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Search radius used for the neighbourhood crime index. */
const SEARCH_RADIUS_KM = 1.0;

/**
 * Computes a safety score (20–95) for the given WGS-84 coordinates by
 * counting and severity-weighting every HRPS incident within 1 km.
 *
 * Returns `null` if no crime data files have been loaded.
 */
export function getCrimeScore(lat: number, lon: number): CrimeScoreResult | null {
  const { crimes, files, latestDate } = loadAllCrimeFiles();

  if (files.length === 0) return null;

  let weightedTotal = 0;
  let crimeCount = 0;

  // Bounding-box pre-filter: 1 km ≈ 0.009° lat, ≈ 0.013° lon at HRM latitude.
  // Eliminates ~95 % of records before the trig-heavy haversine runs.
  const LAT_MARGIN = 0.010;
  const LON_MARGIN = 0.014;

  for (const crime of crimes) {
    if (crime.lat === null || crime.lon === null) continue;
    if (Math.abs(crime.lat - lat) > LAT_MARGIN) continue;
    if (Math.abs(crime.lon - lon) > LON_MARGIN) continue;
    const dist = haversineKm(lat, lon, crime.lat, crime.lon);
    if (dist <= SEARCH_RADIUS_KM) {
      const weight = CRIME_WEIGHTS[crime.crimeCode] ?? 1;
      weightedTotal += weight;
      crimeCount++;
    }
  }

  // Logarithmic scale so that very high-crime areas don't bottom out instantly.
  // 0 incidents → 95 (safest), ~55 weighted points → 20 (most dangerous).
  const score = Math.max(
    20,
    Math.min(95, Math.round(95 - 20 * Math.log1p(weightedTotal)))
  );

  return {
    score,
    crimeCount,
    weightedTotal,
    files,
    latestIncidentDate: latestDate,
  };
}
