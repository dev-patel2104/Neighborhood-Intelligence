/**
 * Nominatim (OpenStreetMap) geocoding client — no API key required.
 * Usage policy: max 1 req/s, valid User-Agent, no bulk requests.
 * https://nominatim.org/release-docs/latest/api/Search/
 *
 * Scoped to the four Atlantic Canadian provinces:
 *   Nova Scotia (NS), New Brunswick (NB),
 *   Prince Edward Island (PE), Newfoundland and Labrador (NL).
 */

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "NeighborhoodIntelligenceAtlantic/2.0 (github.com/dev-patel2104/Neighborhood-Intelligence)";
const FETCH_TIMEOUT_MS = Number(process.env.GEOCODER_TIMEOUT_MS ?? 6000);

// Bounding box for Atlantic Canada: left(minLon), top(maxLat), right(maxLon), bottom(minLat)
// Covers NS, NB, PE, NL (island + Labrador)
const ATLANTIC_VIEWBOX = "-67.5,53.5,-52.5,43.3";

// ─── Province mappings ───────────────────────────────────────────────────────

/** Canonical province abbreviations and their Nominatim state strings */
const ATLANTIC_PROVINCES: Record<string, string> = {
  "nova scotia":                "NS",
  "new brunswick":              "NB",
  "prince edward island":       "PE",
  "newfoundland and labrador":  "NL",
  "newfoundland":               "NL",
  "labrador":                   "NL",
};

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
  /** Clean civic address ready for display */
  displayAddress: string;
  /** OSM suburb / neighbourhood name */
  neighborhood: string;
  /** City or town */
  city: string;
  /** Province abbreviation (NS, NB, PE, NL) */
  province: string;
  /** Postal code */
  postcode: string;
  lat: number;
  lon: number;
}

export type GeocoderResult =
  | { found: true;  inRegion: true;  data: GeocodedAddress }
  | { found: true;  inRegion: false; errorMessage: string }
  | { found: false; inRegion: false; errorMessage: string };

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

/** Returns the province abbreviation if the address is in Atlantic Canada, or null */
function getAtlanticProvince(addr: NominatimAddress): string | null {
  const cc = (addr.country_code ?? "").toLowerCase();
  if (cc !== "ca") return null;
  const state = (addr.state ?? "").toLowerCase();
  return ATLANTIC_PROVINCES[state] ?? null;
}

/** Formats Nominatim address components into a clean civic address string */
function formatDisplay(r: NominatimResult, provinceAbbr: string): string {
  const a = r.address;
  const parts: string[] = [];

  if (a.house_number && a.road) {
    parts.push(`${a.house_number} ${a.road}`);
  } else if (a.road) {
    parts.push(a.road);
  }

  const suburb = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
  const city   = a.city   ?? a.town          ?? a.village ?? a.municipality;

  if (suburb) parts.push(suburb);
  if (city)   parts.push(city);

  parts.push(provinceAbbr);
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
    "Unknown"
  );
}

function extractCity(a: NominatimAddress): string {
  return a.city ?? a.town ?? a.village ?? a.municipality ?? "Unknown";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates that an address exists and lies within Atlantic Canada.
 * Returns geocoded data (neighbourhood, city, province, postcode, coordinates) on success.
 */
export async function geocodeAddress(rawAddress: string): Promise<GeocoderResult> {
  // Append regional context if no province/city is mentioned — improves Nominatim accuracy
  const hasContext = /nova\s*scotia|new\s*brunswick|prince\s*edward|newfoundland|labrador|halifax|dartmouth|moncton|fredericton|saint\s*john|charlottetown|st\.?\s*john'?s/i.test(rawAddress);
  const query = hasContext ? rawAddress : `${rawAddress}, Atlantic Canada`;

  try {
    const url =
      `${NOMINATIM_BASE}/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&addressdetails=1&limit=8&countrycodes=ca`;

    const results = await nominatimFetch(url);

    if (!results.length) {
      return {
        found: false,
        inRegion: false,
        errorMessage:
          "Address not found. Please check the spelling or try adding the city and province (e.g. Halifax, NS).",
      };
    }

    // Find the first result in an Atlantic province
    for (const r of results) {
      const prov = getAtlanticProvince(r.address);
      if (prov) {
        return {
          found: true,
          inRegion: true,
          data: {
            displayAddress: formatDisplay(r, prov),
            neighborhood:   extractNeighborhood(r.address),
            city:           extractCity(r.address),
            province:       prov,
            postcode:       r.address.postcode ?? "",
            lat:            parseFloat(r.lat),
            lon:            parseFloat(r.lon),
          },
        };
      }
    }

    const province = results[0].address.state ?? "another province/territory";
    return {
      found: true,
      inRegion: false,
      errorMessage: `This address appears to be in ${province}, outside Atlantic Canada. This tool covers Nova Scotia, New Brunswick, Prince Edward Island, and Newfoundland & Labrador.`,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return {
        found: false,
        inRegion: false,
        errorMessage: "Address lookup timed out — please try again.",
      };
    }
    console.error("[geocoder] Nominatim error:", err);
    return {
      found: false,
      inRegion: false,
      errorMessage: "Address lookup is temporarily unavailable. Please try again shortly.",
    };
  }
}

/**
 * Returns up to 6 autocomplete suggestions for a partial address in Atlantic Canada.
 * Results are bounded to the Atlantic Canada bounding box.
 */
export async function getAtlanticSuggestions(query: string): Promise<string[]> {
  if (query.trim().length < 3) return [];

  try {
    const url =
      `${NOMINATIM_BASE}/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&addressdetails=1&limit=10&countrycodes=ca` +
      `&viewbox=${ATLANTIC_VIEWBOX}&bounded=1`;

    const results = await nominatimFetch(url);

    return results
      .filter((r) => getAtlanticProvince(r.address) !== null)
      .map((r) => formatDisplay(r, getAtlanticProvince(r.address)!))
      .filter(Boolean)
      .filter((addr, i, arr) => arr.indexOf(addr) === i)
      .slice(0, 6);
  } catch (err) {
    console.error("[geocoder] Suggestions error:", err);
    return [];
  }
}
