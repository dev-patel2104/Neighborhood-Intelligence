/**
 * Environment data loader — server-side only.
 *
 * Queries the Open-Meteo Air Quality API for real-time air quality
 * metrics at the given WGS-84 coordinates.
 *
 * Free for non-commercial use — no API key required.
 * https://open-meteo.com/en/docs/air-quality-api
 */

const OPEN_METEO_AQ_URL =
  process.env.OPEN_METEO_AQ_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality";
const FETCH_TIMEOUT_MS = Number(process.env.ENVIRONMENT_TIMEOUT_MS ?? 10_000);

// ─── Open-Meteo response shape ───────────────────────────────────────────────

interface OpenMeteoAQResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    us_aqi: number;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide: number;
    ozone: number;
  };
}

// ─── Public result ───────────────────────────────────────────────────────────

export interface EnvironmentResult {
  /** Environment score 20–95 (higher = better air quality). */
  score: number;
  /** US Air Quality Index value (0 = best, 500 = worst). */
  usAqi: number;
  /** Fine particulate matter (μg/m³). */
  pm25: number;
  /** Coarse particulate matter (μg/m³). */
  pm10: number;
  /** Nitrogen dioxide (μg/m³). */
  no2: number;
  /** Ground-level ozone (μg/m³). */
  ozone: number;
  /** ISO timestamp of the reading. */
  readingTime: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches real-time air quality data from Open-Meteo and computes an
 * environment score (20–95). Returns `null` if the API is unreachable.
 */
export async function getEnvironmentData(lat: number, lon: number): Promise<EnvironmentResult | null> {
  const url =
    `${OPEN_METEO_AQ_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      console.error(`[environmentLoader] Open-Meteo HTTP ${res.status}`);
      return null;
    }

    const data: OpenMeteoAQResponse = await res.json();
    const c = data.current;

    // Score: map US AQI 0–300+ to score 95–20.
    // AQI 0 → 95, AQI 50 → 73, AQI 100 → 48, AQI 160+ → 20
    const score = Math.max(20, Math.min(95, Math.round(98 - c.us_aqi * 0.5)));

    return {
      score,
      usAqi:       c.us_aqi,
      pm25:        c.pm2_5,
      pm10:        c.pm10,
      no2:         c.nitrogen_dioxide,
      ozone:       c.ozone,
      readingTime: c.time,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.error("[environmentLoader] Open-Meteo request timed out");
    } else {
      console.error("[environmentLoader] Open-Meteo error:", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
