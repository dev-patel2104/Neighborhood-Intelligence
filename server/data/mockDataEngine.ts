/**
 * Deterministic mock data engine — server-side only.
 * Scoped to the Halifax Regional Municipality (HRM), Nova Scotia, Canada.
 * Given the same address string it always returns the same scores (djb2 hash seed).
 */

import { clamp, scoreToBand, scoreToLabel } from "@/lib/utils";
import { getCrimeScore, type CrimeScoreResult } from "@server/lib/crimeDataLoader";
import type {
  CategoryId,
  CategoryScore,
  CategoryStat,
  NeighborhoodScore,
  TrendDirection,
} from "@/lib/types";

// ─── Hash ─────────────────────────────────────────────────────────────────────

function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

function seededRandom(seed: number, offset: number): number {
  const n = djb2Hash(`${seed}-${offset}`);
  return (n % 10000) / 10000;
}

function seededInt(seed: number, offset: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed, offset) * (max - min + 1)) + min;
}

// ─── HRM name banks ───────────────────────────────────────────────────────────

// Actual HRM communities and neighbourhoods
const HRM_NEIGHBORHOODS = [
  "North End",
  "South End",
  "Downtown Halifax",
  "West End",
  "Fairview",
  "Clayton Park",
  "Rockingham",
  "Spryfield",
  "Dartmouth North",
  "Dartmouth South",
  "Woodlawn",
  "Cole Harbour",
  "Eastern Passage",
  "Westphal",
  "Bedford West",
  "Lower Sackville",
  "Fall River",
  "Hammonds Plains",
  "Timberlea",
  "Lakeside",
  "Herring Cove",
  "Purcells Cove",
  "Armdale",
  "Quinpool Corridor",
  "Hydrostone District",
  "Agricola Street Corridor",
  "Burnside",
  "Shannon Park",
  "Leiblin Park",
  "Windsor Junction",
];

// HRM municipalities / urban areas
const HRM_CITIES = [
  "Halifax",
  "Dartmouth",
  "Bedford",
  "Lower Sackville",
  "Fall River",
  "Hammonds Plains",
  "Eastern Passage",
  "Cole Harbour",
  "Timberlea",
  "Musquodoboit Harbour",
];

// Province is always Nova Scotia within HRM
const PROVINCE = "NS";

// ─── Description banks ────────────────────────────────────────────────────────

const descriptions: Record<CategoryId, string[]> = {
  safety: [
    "Very low crime rates with active neighbourhood watch and regular Halifax Regional Police patrols.",
    "Below-average crime rates; residents report feeling safe walking at night.",
    "Crime rates are near the HRM average; some property crime reported.",
    "Crime rates slightly above the HRM average; residents advise caution after dark.",
    "Higher-than-average crime rates; HRPS has increased community outreach programs in the area.",
  ],
  schools: [
    "Top-rated Nova Scotia public schools with provincial assessment scores well above average.",
    "Strong HRCE school zone with multiple highly-rated elementary and junior high schools.",
    "Schools meet provincial standards with a mix of performance levels across grades.",
    "Some schools below provincial benchmarks; HRCE improvement plans are in progress.",
    "Schools face significant challenges; many families explore French Immersion or private options.",
  ],
  transit: [
    "Excellent Halifax Transit coverage with frequent express routes and ferry access to downtown.",
    "Good bus coverage; Halifax Transit routes connect to Scotia Square in under 25 minutes.",
    "Adequate Halifax Transit service; peak-hour frequency and weekend coverage could improve.",
    "Limited Halifax Transit options; most residents rely on personal vehicles for daily errands.",
    "Minimal transit infrastructure; a car is essential — nearest Halifax Transit stop is far.",
  ],
  walkability: [
    "Extremely walkable: grocery stores, cafés, pharmacies, and waterfront parks within 10 minutes.",
    "Very walkable; most daily errands can be accomplished on foot along well-maintained sidewalks.",
    "Somewhat walkable; some amenities within walking distance, but many require a short drive.",
    "Mostly car-dependent; a few local shops reachable on foot, but limited pedestrian infrastructure.",
    "Car-dependent; practically all errands require driving on arterial roads.",
  ],
  environment: [
    "Excellent air quality year-round, minimal industrial influence, and low traffic noise levels.",
    "Good air quality with occasional seasonal pollen spikes; generally clean Atlantic coastal air.",
    "Moderate air quality; some industrial or port activity noticeable on high-wind days.",
    "Air quality below HRM average; proximity to Burnside or port corridors is a factor.",
    "Poor air quality due to nearby industrial zones; NS AQI advisories issued periodically.",
  ],
  greenSpace: [
    "Exceptional green space with access to Halifax Harbour, Point Pleasant Park, and trail networks.",
    "Multiple parks, lakes, and community gardens within easy walking distance.",
    "Decent park access; neighbourhood green space meets HRM minimum standards.",
    "Limited parkland; green space is sparse relative to the HRM average.",
    "Very little accessible green space; high density limits outdoor recreation options.",
  ],
  costOfLiving: [
    "Very affordable for HRM; housing costs are well below the Halifax metro median.",
    "Below-average cost of living; good value given proximity to downtown Halifax.",
    "Cost of living near the HRM median; housing prices have been stable over recent years.",
    "Above-average costs; rapid in-migration has driven significant price appreciation.",
    "Among the priciest communities in HRM; particularly competitive for single-family homes.",
  ],
  community: [
    "Exceptionally diverse and welcoming community, reflecting Halifax's growing immigrant population.",
    "Strong community ties; active neighbourhood association, farmers' markets, and civic events.",
    "Mixed community with growing engagement; resident association is expanding programs.",
    "Community cohesion is developing; high turnover typical of student or rental-heavy areas.",
    "Low community engagement; transient population limits long-term neighbourhood bonds.",
  ],
};

// ─── Stat generators — HRM/Canadian context ───────────────────────────────────

function safetyStats(seed: number, crime?: CrimeScoreResult): CategoryStat[] {
  if (crime) {
    return [
      { label: "Incidents within 1 km (7-day)", value: String(crime.crimeCount) },
      { label: "Weighted crime index (1 km)", value: String(crime.weightedTotal) },
      { label: "Est. HRPS response time", value: `${seededInt(seed, 102, 4, 14)} min avg` },
    ];
  }
  return [
    { label: "Annual incidents per 1,000 residents", value: String(seededInt(seed, 101, 8, 85)) },
    { label: "HRPS response time", value: `${seededInt(seed, 102, 4, 14)} min avg` },
    { label: "Neighbourhood watch program", value: seededInt(seed, 103, 0, 1) ? "Active" : "Inactive" },
  ];
}
function schoolStats(seed: number): CategoryStat[] {
  return [
    { label: "HRCE schools within 2 km", value: String(seededInt(seed, 201, 1, 6)) },
    { label: "Avg provincial assessment percentile", value: `${seededInt(seed, 202, 18, 96)}th` },
    { label: "Student-to-teacher ratio", value: `${seededInt(seed, 203, 14, 28)}:1` },
  ];
}
function transitStats(seed: number): CategoryStat[] {
  return [
    { label: "Halifax Transit routes within 500 m", value: String(seededInt(seed, 301, 0, 12)) },
    { label: "Avg commute to downtown Halifax", value: `${seededInt(seed, 302, 10, 50)} min` },
    { label: "Transit frequency (peak)", value: `Every ${seededInt(seed, 303, 10, 30)} min` },
  ];
}
function walkabilityStats(seed: number): CategoryStat[] {
  return [
    { label: "Walk score", value: `${seededInt(seed, 401, 10, 98)} / 100` },
    { label: "Bike score", value: `${seededInt(seed, 402, 5, 90)} / 100` },
    { label: "Restaurants within 1 km", value: String(seededInt(seed, 403, 0, 40)) },
  ];
}
function environmentStats(seed: number): CategoryStat[] {
  return [
    { label: "Avg NS Air Quality Health Index", value: String(seededInt(seed, 501, 1, 7)) },
    { label: "Noise level (dB avg)", value: String(seededInt(seed, 502, 40, 74)) },
    { label: "Days with AQHI > 4 per year", value: String(seededInt(seed, 503, 0, 30)) },
  ];
}
function greenSpaceStats(seed: number): CategoryStat[] {
  return [
    { label: "Parks within 1 km", value: String(seededInt(seed, 601, 0, 8)) },
    { label: "Tree canopy coverage", value: `${seededInt(seed, 602, 8, 55)}%` },
    { label: "Nearest trail / park", value: `${seededInt(seed, 603, 1, 20)} min walk` },
  ];
}
function costOfLivingStats(seed: number): CategoryStat[] {
  const price = seededInt(seed, 701, 380, 980) * 1000;
  const rent = seededInt(seed, 702, 1400, 3200);
  const changeSign = seededInt(seed, 703, 0, 1) ? "+" : "-";
  return [
    { label: "Median home price (CAD)", value: `$${price.toLocaleString("en-CA")}` },
    { label: "Median monthly rent (CAD)", value: `$${rent.toLocaleString("en-CA")}` },
    { label: "YoY price change", value: `${changeSign}${seededInt(seed, 704, 1, 14)}%` },
  ];
}
function communityStats(seed: number): CategoryStat[] {
  return [
    { label: "Diversity index", value: `${(seededRandom(seed, 801) * 0.75 + 0.2).toFixed(2)} / 1.0` },
    { label: "Median resident tenure", value: `${seededInt(seed, 802, 2, 18)} years` },
    { label: "Homeownership rate", value: `${seededInt(seed, 803, 30, 80)}%` },
  ];
}

// ─── Canadian / HRM data sources ─────────────────────────────────────────────

const CATEGORY_SOURCES: Record<CategoryId, string> = {
  safety:       "Halifax Regional Police Service (HRPS)",
  schools:      "Halifax Regional Centre for Education (HRCE)",
  transit:      "Halifax Transit",
  walkability:  "Walk Score®",
  environment:  "Nova Scotia Environment & Climate Change",
  greenSpace:   "HRM Parks & Recreation",
  costOfLiving: "CMHC Housing Market Report",
  community:    "Statistics Canada Census 2021",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function seededDate(seed: number, offset: number): string {
  const month = MONTHS[seededInt(seed, offset, 0, 11)];
  const year = 2023 + seededInt(seed, offset + 1, 0, 2); // 2023 – 2025
  return `${month} ${year}`;
}

function deriveTrend(seed: number, slot: number): TrendDirection {
  const r = seededInt(seed, slot, 0, 9);
  if (r < 4) return "flat";
  if (r < 7) return "up";
  return "down";
}

function pickDescription(id: CategoryId, score: number, seed: number): string {
  const bank = descriptions[id];
  const bucketIndex = clamp(Math.floor((100 - score) / 22), 0, bank.length - 1);
  const variance = seededInt(seed, 900, 0, 1) === 1 ? 1 : 0;
  return bank[clamp(bucketIndex + variance, 0, bank.length - 1)];
}

// ─── Address → HRM community resolver ────────────────────────────────────────
// Attempts to extract a known HRM community from the address string.
// Falls back to a deterministically chosen neighbourhood name.

const COMMUNITY_KEYWORDS: Array<{ pattern: RegExp; name: string; city: string }> = [
  { pattern: /eastern passage/i,     name: "Eastern Passage",         city: "Eastern Passage" },
  { pattern: /cole harbour/i,        name: "Cole Harbour",            city: "Cole Harbour" },
  { pattern: /hammonds plains/i,     name: "Hammonds Plains",         city: "Hammonds Plains" },
  { pattern: /timberlea/i,           name: "Timberlea",               city: "Timberlea" },
  { pattern: /lakeside/i,            name: "Lakeside",                city: "Lakeside" },
  { pattern: /fall river/i,          name: "Fall River",              city: "Fall River" },
  { pattern: /lower sackville/i,     name: "Lower Sackville",         city: "Lower Sackville" },
  { pattern: /upper sackville/i,     name: "Upper Sackville",         city: "Upper Sackville" },
  { pattern: /sackville/i,           name: "Sackville",               city: "Lower Sackville" },
  { pattern: /bedford/i,             name: "Bedford",                 city: "Bedford" },
  { pattern: /dartmouth/i,           name: "Dartmouth",               city: "Dartmouth" },
  { pattern: /woodlawn/i,            name: "Woodlawn",                city: "Dartmouth" },
  { pattern: /westphal/i,            name: "Westphal",                city: "Dartmouth" },
  { pattern: /spring garden/i,       name: "South End",               city: "Halifax" },
  { pattern: /south park/i,          name: "South End",               city: "Halifax" },
  { pattern: /south st/i,            name: "South End",               city: "Halifax" },
  { pattern: /barrington/i,          name: "Downtown Halifax",        city: "Halifax" },
  { pattern: /lower water/i,         name: "Downtown Halifax",        city: "Halifax" },
  { pattern: /dresden row/i,         name: "Downtown Halifax",        city: "Halifax" },
  { pattern: /quinpool/i,            name: "Quinpool Corridor",       city: "Halifax" },
  { pattern: /agricola/i,            name: "Agricola Street Corridor",city: "Halifax" },
  { pattern: /robie/i,               name: "North End",               city: "Halifax" },
  { pattern: /young st/i,            name: "North End",               city: "Halifax" },
  { pattern: /kempt/i,               name: "Fairview",                city: "Halifax" },
  { pattern: /dutch village/i,       name: "Fairview",                city: "Halifax" },
  { pattern: /lacewood/i,            name: "Clayton Park",            city: "Halifax" },
  { pattern: /parkland/i,            name: "Clayton Park",            city: "Halifax" },
  { pattern: /chain lake/i,          name: "Bayer's Lake",            city: "Halifax" },
  { pattern: /herring cove/i,        name: "Herring Cove",            city: "Halifax" },
  { pattern: /spryfield/i,           name: "Spryfield",               city: "Halifax" },
  { pattern: /rockingham/i,          name: "Rockingham",              city: "Halifax" },
  { pattern: /\bhalifax\b/i,         name: "Halifax",                 city: "Halifax" },
];

function resolveHrmLocation(raw: string): { neighborhood: string; city: string } {
  for (const { pattern, name, city } of COMMUNITY_KEYWORDS) {
    if (pattern.test(raw)) return { neighborhood: name, city };
  }
  return null as unknown as { neighborhood: string; city: string };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Optional real geo data from the geocoder — overrides the hash-derived names. */
export interface GeoOverrides {
  neighborhood: string;
  city: string;
  displayAddress: string;
  /** WGS-84 coordinates used to compute the real crime index. */
  lat?: number;
  lon?: number;
}

export function generateNeighborhoodData(
  rawAddress: string,
  geo?: GeoOverrides
): NeighborhoodScore {
  const normalised = rawAddress.trim().toLowerCase();
  const seed = djb2Hash(normalised);

  // Prefer geocoder-supplied names, then keyword resolver, then seeded fallback
  const resolved = resolveHrmLocation(rawAddress);
  const neighborhood =
    geo?.neighborhood ??
    resolved?.neighborhood ??
    HRM_NEIGHBORHOODS[seed % HRM_NEIGHBORHOODS.length];
  const city =
    geo?.city ??
    resolved?.city ??
    HRM_CITIES[(seed >> 8) % HRM_CITIES.length];
  const province = PROVINCE;
  const displayAddress = geo?.displayAddress ?? rawAddress;

  // Real crime data for the safety category (null if no CSV files loaded or no coords).
  const crimeResult =
    geo?.lat != null && geo?.lon != null
      ? getCrimeScore(geo.lat, geo.lon)
      : null;

  const categoryDefs: {
    id: CategoryId;
    label: string;
    offset: number;
    statsGen: (s: number) => CategoryStat[];
  }[] = [
    { id: "safety",        label: "Safety",         offset: 10, statsGen: safetyStats },
    { id: "schools",       label: "Schools",        offset: 20, statsGen: schoolStats },
    { id: "transit",       label: "Transit",        offset: 30, statsGen: transitStats },
    { id: "walkability",   label: "Walkability",    offset: 40, statsGen: walkabilityStats },
    { id: "environment",   label: "Environment",    offset: 50, statsGen: environmentStats },
    { id: "greenSpace",    label: "Green Space",    offset: 60, statsGen: greenSpaceStats },
    { id: "costOfLiving",  label: "Cost of Living", offset: 70, statsGen: costOfLivingStats },
    { id: "community",     label: "Community",      offset: 80, statsGen: communityStats },
  ];

  const categories: CategoryScore[] = categoryDefs.map(({ id, label, offset, statsGen }) => {
    const isSafety = id === "safety";
    const score = isSafety && crimeResult != null
      ? crimeResult.score
      : seededInt(seed, offset, 20, 98);
    const band = scoreToBand(score);

    let updatedDate = seededDate(seed, offset + 90);
    if (isSafety && crimeResult?.latestIncidentDate) {
      updatedDate = crimeResult.latestIncidentDate.toLocaleDateString("en-CA", {
        year: "numeric", month: "short", day: "numeric",
      });
    }

    return {
      id, label, score, band,
      trend: deriveTrend(seed, offset + 5),
      description: pickDescription(id, score, seed + offset),
      stats: isSafety ? safetyStats(seed + offset, crimeResult ?? undefined) : statsGen(seed + offset),
      source: CATEGORY_SOURCES[id],
      updatedDate,
    };
  });

  const overallScore = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const overallBand = scoreToBand(overallScore);
  const overallLabel = scoreToLabel(overallScore);

  const summaries = [
    `${neighborhood} is a ${overallLabel.toLowerCase()} area within HRM that balances everyday convenience with residential comfort.`,
    `With an overall score of ${overallScore}, ${neighborhood} stands out for its community character and access to Halifax amenities.`,
    `${neighborhood} offers residents a ${overallLabel.toLowerCase()} quality of life, with strong points across several key categories.`,
  ];

  return {
    address: displayAddress,
    neighborhood,
    city,
    state: province,
    overallScore,
    overallBand,
    overallLabel,
    summary: summaries[seed % summaries.length],
    categories,
    lastUpdated: new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
    dataSource: "HRM NeighbourhoodIQ Composite Index (Simulated)",
  };
}
