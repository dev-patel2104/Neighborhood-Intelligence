/**
 * Deterministic mock data engine — server-side only.
 * Given the same address string it always returns the same scores (djb2 hash seed).
 */

import { clamp, scoreToBand, scoreToLabel } from "@/lib/utils";
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

// ─── Name banks ───────────────────────────────────────────────────────────────

const NEIGHBORHOOD_PREFIXES = [
  "Maple","Oak","River","Cedar","Pine","Elm","Birch","Willow",
  "Highland","Lakeside","Sunset","Sunrise","Meadow","Forest",
  "Valley","Hillside","Orchard","Garden","Spring","Harbor",
];
const NEIGHBORHOOD_SUFFIXES = [
  "Heights","Park","District","Village","Commons","Square",
  "Crossing","Ridge","Grove","Place","Run","Terrace",
];
const CITIES = [
  "Springfield","Riverside","Madison","Georgetown","Greenville",
  "Franklin","Clinton","Salem","Chester","Burlington",
];
const STATES = ["CA","TX","FL","NY","PA","IL","OH","GA","NC","WA"];

// ─── Description banks ────────────────────────────────────────────────────────

const descriptions: Record<CategoryId, string[]> = {
  safety: [
    "Very low crime rates with active community watch programs and frequent police patrols.",
    "Below-average crime rates; residents report feeling safe walking at night.",
    "Crime rates are near the city average; some property crime reported.",
    "Crime rates slightly above average; residents advise caution after dark.",
    "Higher-than-average crime rates; local authorities are implementing improvement programs.",
  ],
  schools: [
    "Top-rated public schools with test scores well above state averages.",
    "Strong school district with multiple highly-rated elementary and middle schools.",
    "Schools meet state standards with a mix of performance levels across grades.",
    "Some schools underperforming; district-wide improvement plans are in place.",
    "Schools face significant challenges; many families opt for private alternatives.",
  ],
  transit: [
    "Excellent transit access with multiple subway lines, frequent buses, and bike lanes.",
    "Good bus coverage and nearby light rail; commute downtown under 25 minutes.",
    "Adequate bus service; peak-hour frequency could be better.",
    "Limited transit options; most residents rely on personal vehicles.",
    "Poor transit infrastructure; a car is essential for daily errands.",
  ],
  walkability: [
    "Extremely walkable: groceries, cafes, pharmacies, and parks all within 10 minutes.",
    "Very walkable; most daily errands can be accomplished on foot.",
    "Somewhat walkable; some amenities within walking distance, others require a drive.",
    "Mostly car-dependent; a few destinations reachable on foot.",
    "Car-dependent; practically all errands require driving.",
  ],
  environment: [
    "Excellent air quality year-round, low noise pollution, and minimal industrial activity nearby.",
    "Good air quality with occasional seasonal spikes; generally clean and quiet.",
    "Moderate air quality; some industrial influence noticeable on high-traffic days.",
    "Air quality below average; residents with respiratory conditions should take note.",
    "Poor air quality due to proximity to industrial zones; frequent AQI advisories issued.",
  ],
  greenSpace: [
    "Abundant parks, trails, and green corridors — over 40% tree canopy coverage.",
    "Multiple parks and community gardens within easy walking distance.",
    "Some green space available; neighbourhood park access is decent.",
    "Limited parks; green space is sparse compared to city average.",
    "Very little accessible green space; urban density limits outdoor recreation options.",
  ],
  costOfLiving: [
    "Very affordable; housing costs are well below the city median.",
    "Below-average cost of living; good value for the quality of amenities offered.",
    "Cost of living is near the city median; housing prices have been stable.",
    "Above-average costs; housing has appreciated significantly in recent years.",
    "High cost of living; among the priciest areas in the metropolitan region.",
  ],
  community: [
    "Exceptionally diverse and welcoming community with vibrant local culture and events.",
    "Strong community ties; regular neighbourhood events and active civic groups.",
    "Mixed community with improving engagement; resident association is growing.",
    "Community cohesion is developing; turnover rates somewhat high.",
    "Low community engagement; high transient population limits neighbourhood bonds.",
  ],
};

// ─── Stat generators ──────────────────────────────────────────────────────────

function safetyStats(seed: number): CategoryStat[] {
  return [
    { label: "Annual crimes per 1,000 residents", value: String(seededInt(seed, 101, 8, 85)) },
    { label: "Emergency response time", value: `${seededInt(seed, 102, 4, 14)} min avg` },
    { label: "Community watch program", value: seededInt(seed, 103, 0, 1) ? "Active" : "Inactive" },
  ];
}
function schoolStats(seed: number): CategoryStat[] {
  return [
    { label: "Public schools within 1 mile", value: String(seededInt(seed, 201, 1, 6)) },
    { label: "Avg state test score percentile", value: `${seededInt(seed, 202, 18, 96)}th` },
    { label: "Student-to-teacher ratio", value: `${seededInt(seed, 203, 14, 28)}:1` },
  ];
}
function transitStats(seed: number): CategoryStat[] {
  return [
    { label: "Bus routes within 0.5 mi", value: String(seededInt(seed, 301, 0, 12)) },
    { label: "Avg commute to downtown", value: `${seededInt(seed, 302, 15, 55)} min` },
    { label: "Transit score", value: `${seededInt(seed, 303, 10, 98)} / 100` },
  ];
}
function walkabilityStats(seed: number): CategoryStat[] {
  return [
    { label: "Walk score", value: `${seededInt(seed, 401, 10, 98)} / 100` },
    { label: "Bike score", value: `${seededInt(seed, 402, 5, 90)} / 100` },
    { label: "Restaurants within 0.5 mi", value: String(seededInt(seed, 403, 0, 40)) },
  ];
}
function environmentStats(seed: number): CategoryStat[] {
  return [
    { label: "Avg annual AQI", value: String(seededInt(seed, 501, 18, 130)) },
    { label: "Noise level (dB avg)", value: String(seededInt(seed, 502, 42, 78)) },
    { label: "Days exceeding EPA AQI threshold", value: String(seededInt(seed, 503, 0, 60)) },
  ];
}
function greenSpaceStats(seed: number): CategoryStat[] {
  return [
    { label: "Parks within 1 mile", value: String(seededInt(seed, 601, 0, 8)) },
    { label: "Tree canopy coverage", value: `${seededInt(seed, 602, 5, 55)}%` },
    { label: "Nearest park distance", value: `${seededInt(seed, 603, 1, 25)} min walk` },
  ];
}
function costOfLivingStats(seed: number): CategoryStat[] {
  return [
    { label: "Median home price", value: `$${(seededInt(seed, 701, 180, 950) * 1000).toLocaleString()}` },
    { label: "Median monthly rent", value: `$${seededInt(seed, 702, 900, 3800).toLocaleString()}` },
    { label: "YoY price change", value: `${seededInt(seed, 703, 0, 1) ? "+" : "-"}${seededInt(seed, 704, 1, 14)}%` },
  ];
}
function communityStats(seed: number): CategoryStat[] {
  return [
    { label: "Diversity index", value: `${(seededRandom(seed, 801) * 0.85 + 0.15).toFixed(2)} / 1.0` },
    { label: "Median resident tenure", value: `${seededInt(seed, 802, 2, 18)} years` },
    { label: "Homeownership rate", value: `${seededInt(seed, 803, 25, 80)}%` },
  ];
}

// ─── Source + date metadata ───────────────────────────────────────────────────

const CATEGORY_SOURCES: Record<CategoryId, string> = {
  safety:       "FBI Uniform Crime Reporting (UCR)",
  schools:      "Nat'l Center for Education Statistics",
  transit:      "American Public Transportation Assoc.",
  walkability:  "Walk Score®",
  environment:  "EPA Air Quality Index",
  greenSpace:   "USFS Urban Tree Canopy Assessment",
  costOfLiving: "Bureau of Labor Statistics CPI",
  community:    "US Census Bureau ACS",
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateNeighborhoodData(rawAddress: string): NeighborhoodScore {
  const normalised = rawAddress.trim().toLowerCase();
  const seed = djb2Hash(normalised);

  const neighborhood =
    NEIGHBORHOOD_PREFIXES[seed % NEIGHBORHOOD_PREFIXES.length] +
    " " +
    NEIGHBORHOOD_SUFFIXES[(seed >> 4) % NEIGHBORHOOD_SUFFIXES.length];
  const city = CITIES[(seed >> 8) % CITIES.length];
  const state = STATES[(seed >> 12) % STATES.length];

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
    const score = seededInt(seed, offset, 20, 98);
    const band = scoreToBand(score);
    return {
      id, label, score, band,
      trend: deriveTrend(seed, offset + 5),
      description: pickDescription(id, score, seed + offset),
      stats: statsGen(seed + offset),
      source: CATEGORY_SOURCES[id],
      updatedDate: seededDate(seed, offset + 90),
    };
  });

  const overallScore = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const overallBand = scoreToBand(overallScore);
  const overallLabel = scoreToLabel(overallScore);

  const summaries = [
    `${neighborhood} is a ${overallLabel.toLowerCase()} area that balances everyday convenience with residential comfort.`,
    `With an overall score of ${overallScore}, ${neighborhood} stands out for its community character and local amenities.`,
    `${neighborhood} offers residents a ${overallLabel.toLowerCase()} quality of life, with strong points in several key categories.`,
  ];

  return {
    address: rawAddress,
    neighborhood,
    city,
    state,
    overallScore,
    overallBand,
    overallLabel,
    summary: summaries[seed % summaries.length],
    categories,
    lastUpdated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    dataSource: "NeighborhoodIQ Composite Index (Simulated)",
  };
}
