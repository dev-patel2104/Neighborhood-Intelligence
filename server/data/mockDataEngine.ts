/**
 * Neighbourhood data engine — server-side only.
 * Scoped to Atlantic Canada (NS, NB, PE, NL).
 *
 * Assembles a full scorecard from pre-fetched real data.
 * Categories without a real data source show score = null / stats = "N/A".
 */

import { clamp, scoreToBand, scoreToLabel } from "@/lib/utils";
import { getCrimeScore, type CrimeScoreResult } from "@server/lib/crimeDataLoader";
import type { AmenityResult } from "@server/lib/amenityLoader";
import type { EnvironmentResult } from "@server/lib/environmentLoader";
import type { CostOfLivingResult } from "@server/lib/costOfLivingLoader";
import type {
  CategoryId,
  CategoryScore,
  CategoryStat,
  NeighborhoodScore,
} from "@/lib/types";

// ─── Hash (used for deterministic description selection) ─────────────────────

function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

// ─── Description banks ────────────────────────────────────────────────────────

const NO_DATA_DESC = "Real-time data is not currently available for this category.";

const descriptions: Record<CategoryId, string[]> = {
  safety: [
    "Very low crime rates with active community watch programs and regular police patrols.",
    "Below-average crime rates; residents report feeling safe walking at night.",
    "Crime rates are near the regional average; some property crime reported.",
    "Crime rates slightly above average; residents advise caution after dark.",
    "Higher-than-average crime rates; local police have increased community outreach programs.",
  ],
  environment: [
    "Excellent air quality year-round, minimal industrial influence, and clean Atlantic coastal air.",
    "Good air quality with occasional seasonal pollen spikes; generally clean maritime air.",
    "Moderate air quality; some industrial or port activity noticeable on high-wind days.",
    "Air quality below the regional average; proximity to industrial corridors is a factor.",
    "Poor air quality due to nearby industrial zones; air quality advisories issued periodically.",
  ],
  costOfLiving: [
    "Very affordable for the region; housing costs are well below the provincial median.",
    "Below-average cost of living; good value given proximity to urban amenities.",
    "Cost of living near the regional median; housing prices have been stable recently.",
    "Above-average costs; in-migration and demand have driven significant price appreciation.",
    "Among the priciest communities in the region; particularly competitive for single-family homes.",
  ],
  amenities: [
    "Outstanding amenity density — restaurants, shops, healthcare, and recreation all within a short walk.",
    "Well-served with a diverse mix of dining, retail, and essential services nearby.",
    "Adequate amenity access; most everyday needs met within the neighbourhood.",
    "Limited nearby amenities; residents often drive to neighbouring communities for errands.",
    "Very few amenities within walking distance; the area is primarily residential.",
  ],
};

// ─── Stat builders — real data only, N/A fallback ────────────────────────────

const NA_STATS: CategoryStat[] = [{ label: "Data", value: "N/A" }];

function safetyStats(crime?: CrimeScoreResult): CategoryStat[] {
  if (!crime) return NA_STATS;
  return [
    { label: "Incidents within 1 km (7-day)", value: String(crime.crimeCount) },
    { label: "Weighted crime index (1 km)", value: String(crime.weightedTotal) },
  ];
}

function environmentStats(env?: EnvironmentResult): CategoryStat[] {
  if (!env) return NA_STATS;
  return [
    { label: "US Air Quality Index", value: String(env.usAqi) },
    { label: "PM2.5 (μg/m³)", value: env.pm25.toFixed(1) },
    { label: "PM10 (μg/m³)", value: env.pm10.toFixed(1) },
    { label: "Ozone (μg/m³)", value: env.ozone.toFixed(1) },
  ];
}

function costOfLivingStats(col?: CostOfLivingResult): CategoryStat[] {
  if (!col) return NA_STATS;
  return [
    { label: "Median home price (CAD)", value: `$${col.medianHomePrice.toLocaleString("en-CA")}` },
    { label: "Median 2BR rent (CAD/mo)", value: `$${col.medianRent2BR.toLocaleString("en-CA")}` },
    { label: "YoY rent change", value: `${col.yoyRentChange >= 0 ? "+" : ""}${col.yoyRentChange}%` },
    { label: "YoY home price change", value: `${col.yoyHomePriceChange >= 0 ? "+" : ""}${col.yoyHomePriceChange}%` },
  ];
}

function amenityStats(amenity?: AmenityResult): CategoryStat[] {
  if (!amenity) return NA_STATS;
  const stats: CategoryStat[] = [
    { label: "Amenities within 1.5 km", value: String(amenity.totalCount) },
  ];
  for (const [group, count] of Object.entries(amenity.groupCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)) {
    stats.push({ label: group, value: String(count) });
  }
  return stats;
}

// ─── Data sources ────────────────────────────────────────────────────────────

const CATEGORY_SOURCES: Record<CategoryId, string> = {
  safety:       "Halifax Regional Police Service (HRPS)",
  environment:  "Open-Meteo Air Quality API",
  costOfLiving: "CMHC Rental Market Survey 2025",
  amenities:    "OpenStreetMap / Overpass API",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickDescription(id: CategoryId, score: number | null, _seed: number): string {
  if (score === null) return NO_DATA_DESC;
  const bank = descriptions[id];
  const bucketIndex = clamp(Math.floor((100 - score) / 22), 0, bank.length - 1);
  return bank[bucketIndex];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GeoOverrides {
  neighborhood: string;
  city: string;
  province: string;
  displayAddress: string;
  lat?: number;
  lon?: number;
}

export interface RealDataResults {
  amenity?: AmenityResult | null;
  environment?: EnvironmentResult | null;
  costOfLiving?: CostOfLivingResult | null;
}

export function generateNeighborhoodData(
  rawAddress: string,
  geo?: GeoOverrides,
  real?: RealDataResults
): NeighborhoodScore {
  const normalised = rawAddress.trim().toLowerCase();
  const seed = djb2Hash(normalised);

  const neighborhood = geo?.neighborhood ?? "Unknown";
  const city = geo?.city ?? "Unknown";
  const province = geo?.province ?? "NS";
  const displayAddress = geo?.displayAddress ?? rawAddress;

  // Crime data from local CSV files (currently available for HRM only).
  const crimeResult =
    geo?.lat != null && geo?.lon != null
      ? getCrimeScore(geo.lat, geo.lon)
      : null;

  const now = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "short" });

  // ── Build each category from real data only ────────────────────────────────

  interface CatDef {
    id: CategoryId;
    label: string;
    score: number | null;
    stats: CategoryStat[];
    updatedDate: string;
  }

  const catDefs: CatDef[] = [
    {
      id: "safety", label: "Safety",
      score: crimeResult?.score ?? null,
      stats: safetyStats(crimeResult ?? undefined),
      updatedDate: crimeResult?.latestIncidentDate
        ? crimeResult.latestIncidentDate.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
        : "N/A",
    },
    {
      id: "environment", label: "Environment",
      score: real?.environment?.score ?? null,
      stats: environmentStats(real?.environment ?? undefined),
      updatedDate: real?.environment ? now : "N/A",
    },
    {
      id: "costOfLiving", label: "Cost of Living",
      score: real?.costOfLiving?.score ?? null,
      stats: costOfLivingStats(real?.costOfLiving ?? undefined),
      updatedDate: real?.costOfLiving ? "Q4 2025" : "N/A",
    },
    {
      id: "amenities", label: "Amenities",
      score: real?.amenity?.score ?? null,
      stats: amenityStats(real?.amenity ?? undefined),
      updatedDate: real?.amenity ? now : "N/A",
    },
  ];

  const categories: CategoryScore[] = catDefs.map(({ id, label, score, stats, updatedDate }) => ({
    id,
    label,
    score,
    band: score !== null ? scoreToBand(score) : null,
    trend: "flat" as const,
    description: pickDescription(id, score, seed),
    stats,
    source: CATEGORY_SOURCES[id],
    updatedDate,
  }));

  // Overall score: average of categories that have real data only.
  const scoredCategories = categories.filter((c) => c.score !== null);
  const overallScore = scoredCategories.length > 0
    ? Math.round(scoredCategories.reduce((s, c) => s + c.score!, 0) / scoredCategories.length)
    : 0;
  const overallBand = scoreToBand(overallScore)!;
  const overallLabel = scoreToLabel(overallScore);

  const summaries = [
    `${neighborhood} in ${city} is a ${overallLabel.toLowerCase()} area that balances everyday convenience with residential comfort.`,
    `With an overall score of ${overallScore}, ${neighborhood} stands out for its character and access to local amenities.`,
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
    dataSource: "Atlantic Canada NeighbourhoodIQ Composite Index",
  };
}
