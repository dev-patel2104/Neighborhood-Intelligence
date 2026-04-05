/**
 * Cost of living data loader — server-side only.
 *
 * Reads zone data from server/assets/costOfLiving/costOfLiving.csv.
 * The CSV is sourced from CMHC Rental Market Survey reports and provincial
 * real-estate board publications, and serves as the authoritative source
 * for auditing and validation purposes.
 *
 * CSV columns:
 *   province, zone_label, patterns, medianRent1BR, medianRent2BR,
 *   medianHomePrice, yoyRentChange, yoyHomePriceChange
 *
 * The `patterns` column is a pipe-separated list of regex strings
 * (case-insensitive) matched against the geocoded neighbourhood + address.
 *
 * Data vintage: CMHC Rental Market Report 2025 & provincial MLS Q4-2025.
 */

import { readFileSync } from "fs";
import { join } from "path";

// ─── Internal zone record ────────────────────────────────────────────────────

interface CostZone {
  province: string;
  zoneLabel: string;
  patterns: RegExp[];
  medianRent1BR: number;
  medianRent2BR: number;
  medianHomePrice: number;
  yoyRentChange: number;
  yoyHomePriceChange: number;
}

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuotes) {
      inQuotes = true;
    } else if (ch === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function loadZonesFromCsv(): CostZone[] {
  const csvPath = join(
    process.cwd(),
    "server",
    "assets",
    "costOfLiving",
    "costOfLiving.csv"
  );

  const content = readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  const zones: CostZone[] = [];

  // Row 0 is the header — skip it.
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = parseCsvLine(raw);
    if (cols.length < 8) continue;

    const [
      province,
      zoneLabel,
      patternsRaw,
      rent1BR,
      rent2BR,
      homePrice,
      rentChange,
      homePriceChange,
    ] = cols;

    const patterns = patternsRaw
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => new RegExp(p, "i"));

    if (patterns.length === 0) continue;

    zones.push({
      province: province.trim(),
      zoneLabel: zoneLabel.trim(),
      patterns,
      medianRent1BR: parseInt(rent1BR, 10),
      medianRent2BR: parseInt(rent2BR, 10),
      medianHomePrice: parseInt(homePrice, 10),
      yoyRentChange: parseFloat(rentChange),
      yoyHomePriceChange: parseFloat(homePriceChange),
    });
  }

  return zones;
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let _zones: CostZone[] | null = null;

function getZones(): CostZone[] {
  if (!_zones) {
    try {
      _zones = loadZonesFromCsv();
    } catch (err) {
      console.error("[costOfLivingLoader] Cannot read costOfLiving.csv:", err);
      _zones = [];
    }
  }
  return _zones;
}

// ─── Regional baseline ───────────────────────────────────────────────────────

/** Regional median 2BR rent used as the scoring baseline (CAD/month). */
const REGIONAL_MEDIAN_RENT_2BR = 1400;

// ─── Public result ───────────────────────────────────────────────────────────

export interface CostOfLivingResult {
  /** Cost-of-living score 20–95 (higher = more affordable). */
  score: number;
  /** Median 1-bedroom rent (CAD/month). */
  medianRent1BR: number;
  /** Median 2-bedroom rent (CAD/month). */
  medianRent2BR: number;
  /** Median home price (CAD). */
  medianHomePrice: number;
  /** Year-over-year rent change (%). */
  yoyRentChange: number;
  /** Year-over-year home price change (%). */
  yoyHomePriceChange: number;
  /** Name of the matched zone (for debugging). */
  zone: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Matches the geocoded neighbourhood / raw address to a zone and
 * returns cost-of-living data with a score (20–95, higher = more affordable).
 *
 * Returns `null` if no zone matches.
 */
export function getCostOfLivingData(
  neighborhood: string,
  rawAddress: string
): CostOfLivingResult | null {
  const searchText = `${neighborhood} ${rawAddress}`;

  for (const zone of getZones()) {
    for (const pattern of zone.patterns) {
      if (pattern.test(searchText)) {
        const ratio = zone.medianRent2BR / REGIONAL_MEDIAN_RENT_2BR;
        const score = Math.max(20, Math.min(95, Math.round(50 + (1 - ratio) * 50)));

        return {
          score,
          medianRent1BR: zone.medianRent1BR,
          medianRent2BR: zone.medianRent2BR,
          medianHomePrice: zone.medianHomePrice,
          yoyRentChange: zone.yoyRentChange,
          yoyHomePriceChange: zone.yoyHomePriceChange,
          zone: searchText.match(pattern)?.[0] ?? neighborhood,
        };
      }
    }
  }

  return null;
}
