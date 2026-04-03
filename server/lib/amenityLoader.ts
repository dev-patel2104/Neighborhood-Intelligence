/**
 * Amenity data loader — server-side only.
 *
 * Queries the Overpass API (OpenStreetMap) for amenity-tagged nodes/ways
 * within a radius of the given WGS-84 coordinates.
 *
 * Amenities are grouped into six sub-categories and scored based on
 * total count + category diversity.
 *
 * Overpass usage policy: keep requests reasonable; no bulk queries.
 * https://wiki.openstreetmap.org/wiki/Overpass_API#Introduction
 */

const OVERPASS_URL = process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS ?? 15_000);
const SEARCH_RADIUS_M = Number(process.env.AMENITY_SEARCH_RADIUS_M ?? 1500); // default 1.5 km

// ─── Amenity sub-categories ──────────────────────────────────────────────────

export interface AmenityGroup {
  label: string;
  types: string[];
}

const AMENITY_GROUPS: AmenityGroup[] = [
  {
    label: "Food & Dining",
    types: ["restaurant", "cafe", "fast_food", "bar", "pub", "food_court", "ice_cream", "biergarten"],
  },
  {
    label: "Shopping & Essentials",
    types: ["supermarket", "convenience", "marketplace", "pharmacy"],
  },
  {
    label: "Healthcare",
    types: ["hospital", "clinic", "doctors", "dentist", "veterinary"],
  },
  {
    label: "Education",
    types: ["school", "kindergarten", "library", "university", "college"],
  },
  {
    label: "Finance",
    types: ["bank", "atm", "bureau_de_change"],
  },
  {
    label: "Recreation",
    types: ["cinema", "theatre", "community_centre", "arts_centre", "nightclub", "swimming_pool"],
  },
];

// Build a lookup from amenity type → group label for fast classification.
const TYPE_TO_GROUP = new Map<string, string>();
for (const group of AMENITY_GROUPS) {
  for (const t of group.types) {
    TYPE_TO_GROUP.set(t, group.label);
  }
}

// ─── Overpass response shape ─────────────────────────────────────────────────

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// ─── Public result ───────────────────────────────────────────────────────────

export interface AmenityResult {
  /** Amenities score 20–95 (higher = more amenities). */
  score: number;
  /** Total amenity count within the search radius. */
  totalCount: number;
  /** Counts per sub-category. */
  groupCounts: Record<string, number>;
  /** Number of distinct sub-categories represented. */
  categoriesCovered: number;
  /** Flat list of every amenity type found (for debugging / enrichment). */
  typeCounts: Record<string, number>;
}

// ─── Query builder ───────────────────────────────────────────────────────────

function buildOverpassQuery(lat: number, lon: number): string {
  return `[out:json][timeout:15];(node["amenity"](around:${SEARCH_RADIUS_M},${lat},${lon});way["amenity"](around:${SEARCH_RADIUS_M},${lat},${lon}););out tags;`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Queries the Overpass API for amenities near the given coordinate,
 * categorises them, and computes a composite amenity score (20–95).
 *
 * Returns `null` if the API is unreachable or returns an error.
 */
export async function getAmenityScore(lat: number, lon: number): Promise<AmenityResult | null> {
  const query = buildOverpassQuery(lat, lon);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "NeighborhoodIntelligenceHRM/1.0",
        Accept: "application/json",
      },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      console.error(`[amenityLoader] Overpass HTTP ${res.status}`);
      return null;
    }

    const data: OverpassResponse = await res.json();
    return classifyAmenities(data.elements);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.error("[amenityLoader] Overpass request timed out");
    } else {
      console.error("[amenityLoader] Overpass error:", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Classification & scoring ────────────────────────────────────────────────

function classifyAmenities(elements: OverpassElement[]): AmenityResult {
  const groupCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const el of elements) {
    const amenityType = el.tags?.amenity;
    if (!amenityType) continue;

    // Count raw type
    typeCounts[amenityType] = (typeCounts[amenityType] ?? 0) + 1;

    // Count by group (if it maps to one of our tracked groups)
    const groupLabel = TYPE_TO_GROUP.get(amenityType);
    if (groupLabel) {
      groupCounts[groupLabel] = (groupCounts[groupLabel] ?? 0) + 1;
    }
  }

  const totalCount = elements.filter((e) => e.tags?.amenity).length;
  const categoriesCovered = Object.keys(groupCounts).length;

  // Score formula:
  //   countComponent  = 16 × ln(1 + totalCount)   — rewards density (log scale)
  //   diversityBonus  = categoriesCovered × 2      — rewards variety across groups
  //   score           = clamp(20 + countComponent + diversityBonus, 20, 95)
  const countComponent = 16 * Math.log(1 + totalCount);
  const diversityBonus = categoriesCovered * 2;
  const score = Math.max(20, Math.min(95, Math.round(20 + countComponent + diversityBonus)));

  return { score, totalCount, groupCounts, categoriesCovered, typeCounts };
}
