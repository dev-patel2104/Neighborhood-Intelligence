/**
 * Nominatim (OpenStreetMap) geocoding client — no API key required.
 * Usage policy: max 1 req/s, valid User-Agent, no bulk requests.
 * https://nominatim.org/release-docs/latest/api/Search/
 *
 * Scoped to Halifax Regional Municipality (HRM), Nova Scotia, Canada.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT =
  "NeighborhoodIntelligenceHRM/1.0 (github.com/dev-patel2104/Neighborhood-Intelligence)";
const FETCH_TIMEOUT_MS = 6000;

// Bounding box for HRM: left(minLon), top(maxLat), right(maxLon), bottom(minLat)
const HRM_VIEWBOX = "-64.3,45.3,-62.8,44.2";

// ─── Nominatim response shapes ────────────────────────────────────────────────

interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
  type: string;
  importance: number;
}

// ─── Public result types ──────────────────────────────────────────────────────

export interface GeocodedAddress {
  /** Clean civic address ready for display (e.g. "2595 Agricola Street, North End, Halifax, NS B3K 4C4") */
  displayAddress: string;
  /** OSM suburb / neighbourhood name */
  neighborhood: string;
  /** City or town within HRM */
  city: string;
  /** Nova Scotia postal code */
  postcode: string;
  lat: number;
  lon: number;
}

export type GeocoderResult =
  | { found: true;  inHRM: true;  data: GeocodedAddress }
  | { found: true;  inHRM: false; errorMessage: string }
  | { found: false; inHRM: false; errorMessage: string };

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function nominatimFetch(url: string): Promise<NominatimResult[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
        Accept: "application/json",
      },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    return (await res.json()) as NominatimResult[];
  } finally {
    clearTimeout(timer);
  }
}

/** Returns true only if the Nominatim result is within HRM, Nova Scotia */
function isInHRM(addr: NominatimAddress): boolean {
  const cc    = (addr.country_code ?? "").toLowerCase();
  const state = (addr.state        ?? "").toLowerCase();
  const county = (addr.county      ?? "").toLowerCase();
  return cc === "ca" && state.includes("nova scotia") && county.includes("halifax");
}

/** Formats Nominatim address components into a clean civic address string */
function formatDisplay(r: NominatimResult): string {
  const a = r.address;
  const parts: string[] = [];

  if (a.house_number && a.road) {
    parts.push(`${a.house_number} ${a.road}`);
  } else if (a.road) {
    parts.push(a.road);
  }

  // Prefer the most specific locality label available
  const suburb = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
  const city   = a.city   ?? a.town          ?? a.village ?? a.municipality;

  if (suburb) parts.push(suburb);
  if (city)   parts.push(city);

  parts.push("NS");
  if (a.postcode) parts.push(a.postcode);

  return parts.join(", ");
}

function extractNeighborhood(a: NominatimAddress): string {
  return (
    a.suburb ??
    a.neighbourhood ??
    a.quarter ??
    a.city_district ??
    a.city ??
    a.town ??
    a.village ??
    "Halifax"
  );
}

function extractCity(a: NominatimAddress): string {
  return a.city ?? a.town ?? a.village ?? a.municipality ?? "Halifax";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates that an address exists and lies within HRM.
 * Returns geocoded data (real neighbourhood, city, postcode, coordinates) on success.
 */
export async function geocodeHrmAddress(rawAddress: string): Promise<GeocoderResult> {
  // Append HRM context if no municipality is mentioned — improves Nominatim accuracy
  const hasContext = /nova\s*scotia|halifax|dartmouth|bedford|sackville|fall\s*river|hammonds\s*plains/i.test(rawAddress);
  const query = hasContext ? rawAddress : `${rawAddress}, Halifax, Nova Scotia, Canada`;

  try {
    const url =
      `${NOMINATIM_BASE}/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&addressdetails=1&limit=5&countrycodes=ca`;

    const results = await nominatimFetch(url);

    if (!results.length) {
      return {
        found: false,
        inHRM: false,
        errorMessage:
          "Address not found. Please check the spelling or try adding the community name (e.g. Halifax, Dartmouth).",
      };
    }

    const hrmResult = results.find((r) => isInHRM(r.address));

    if (!hrmResult) {
      const province = results[0].address.state ?? "another province/territory";
      return {
        found: true,
        inHRM: false,
        errorMessage: `This address appears to be in ${province}, not in HRM. This tool covers Halifax Regional Municipality addresses only.`,
      };
    }

    return {
      found: true,
      inHRM: true,
      data: {
        displayAddress: formatDisplay(hrmResult),
        neighborhood:   extractNeighborhood(hrmResult.address),
        city:           extractCity(hrmResult.address),
        postcode:       hrmResult.address.postcode ?? "",
        lat:            parseFloat(hrmResult.lat),
        lon:            parseFloat(hrmResult.lon),
      },
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return {
        found: false,
        inHRM: false,
        errorMessage: "Address lookup timed out — please try again.",
      };
    }
    console.error("[geocoder] Nominatim error:", err);
    return {
      found: false,
      inHRM: false,
      errorMessage: "Address lookup is temporarily unavailable. Please try again shortly.",
    };
  }
}

/**
 * Returns up to 6 autocomplete suggestions for a partial HRM address.
 * Results are bounded to the HRM bounding box and filtered to Nova Scotia.
 */
export async function getHrmSuggestions(query: string): Promise<string[]> {
  if (query.trim().length < 3) return [];

  try {
    const url =
      `${NOMINATIM_BASE}/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&addressdetails=1&limit=10&countrycodes=ca` +
      `&viewbox=${HRM_VIEWBOX}&bounded=1`;

    const results = await nominatimFetch(url);

    return results
      .filter((r) => isInHRM(r.address))
      .map((r) => formatDisplay(r))
      .filter(Boolean)
      .filter((addr, i, arr) => arr.indexOf(addr) === i) // deduplicate
      .slice(0, 6);
  } catch (err) {
    console.error("[geocoder] Suggestions error:", err);
    return []; // fail silently — autocomplete is non-critical
  }
}
