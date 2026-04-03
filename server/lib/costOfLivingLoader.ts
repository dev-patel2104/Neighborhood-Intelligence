/**
 * Cost of living data loader — server-side only.
 *
 * Uses bundled zone-level housing data for all four Atlantic provinces,
 * sourced from CMHC Rental Market Survey reports and provincial
 * real-estate board publications.
 *
 * No free, no-auth real-time API exists for Canadian rent/housing data,
 * so this data is pre-bundled and matched to the geocoded neighbourhood
 * name at query time.
 *
 * Data vintage: CMHC Rental Market Report 2025 & provincial MLS Q4-2025.
 */

// ─── Zone data ──────────────────────────────────────────────────────────────

interface CostZone {
  /** Patterns matched against the geocoded neighbourhood + address string. */
  patterns: RegExp[];
  /** Median monthly rent — 1 bedroom (CAD). */
  medianRent1BR: number;
  /** Median monthly rent — 2 bedroom (CAD). */
  medianRent2BR: number;
  /** Median single-family home price (CAD). */
  medianHomePrice: number;
  /** Year-over-year rent change (%). */
  yoyRentChange: number;
  /** Year-over-year home price change (%). */
  yoyHomePriceChange: number;
}

// ── Nova Scotia ──────────────────────────────────────────────────────────────

const NS_ZONES: CostZone[] = [
  {
    patterns: [/downtown halifax/i, /barrington/i, /lower water/i, /granville/i, /hollis/i],
    medianRent1BR: 1750, medianRent2BR: 2300, medianHomePrice: 580000,
    yoyRentChange: 5.2, yoyHomePriceChange: 3.8,
  },
  {
    patterns: [/south end/i, /spring garden/i, /south park/i, /tower road/i],
    medianRent1BR: 1700, medianRent2BR: 2250, medianHomePrice: 560000,
    yoyRentChange: 4.8, yoyHomePriceChange: 4.1,
  },
  {
    patterns: [/north end/i, /hydrostone/i, /agricola/i, /robie/i, /young st/i, /gottingen/i],
    medianRent1BR: 1500, medianRent2BR: 1950, medianHomePrice: 420000,
    yoyRentChange: 6.1, yoyHomePriceChange: 5.3,
  },
  {
    patterns: [/west end/i, /quinpool/i, /oxford/i],
    medianRent1BR: 1550, medianRent2BR: 2000, medianHomePrice: 440000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/clayton park/i, /lacewood/i, /parkland/i],
    medianRent1BR: 1450, medianRent2BR: 1900, medianHomePrice: 410000,
    yoyRentChange: 4.5, yoyHomePriceChange: 3.2,
  },
  {
    patterns: [/fairview/i, /kempt/i, /dutch village/i],
    medianRent1BR: 1300, medianRent2BR: 1700, medianHomePrice: 360000,
    yoyRentChange: 5.8, yoyHomePriceChange: 4.0,
  },
  {
    patterns: [/rockingham/i],
    medianRent1BR: 1450, medianRent2BR: 1900, medianHomePrice: 440000,
    yoyRentChange: 3.9, yoyHomePriceChange: 3.5,
  },
  {
    patterns: [/spryfield/i, /leiblin/i],
    medianRent1BR: 1200, medianRent2BR: 1550, medianHomePrice: 320000,
    yoyRentChange: 7.2, yoyHomePriceChange: 6.1,
  },
  {
    patterns: [/herring cove/i, /purcells cove/i],
    medianRent1BR: 1250, medianRent2BR: 1600, medianHomePrice: 330000,
    yoyRentChange: 4.0, yoyHomePriceChange: 3.0,
  },
  {
    patterns: [/dartmouth south/i, /dartmouth downtown/i, /portland/i, /alderney/i],
    medianRent1BR: 1400, medianRent2BR: 1800, medianHomePrice: 380000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.8,
  },
  {
    patterns: [/dartmouth north/i, /burnside/i, /shannon park/i],
    medianRent1BR: 1250, medianRent2BR: 1600, medianHomePrice: 310000,
    yoyRentChange: 6.0, yoyHomePriceChange: 5.0,
  },
  {
    patterns: [/woodlawn/i, /westphal/i, /dartmouth/i],
    medianRent1BR: 1350, medianRent2BR: 1700, medianHomePrice: 370000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.2,
  },
  {
    patterns: [/cole harbour/i],
    medianRent1BR: 1350, medianRent2BR: 1750, medianHomePrice: 370000,
    yoyRentChange: 4.8, yoyHomePriceChange: 3.9,
  },
  {
    patterns: [/eastern passage/i, /cow bay/i],
    medianRent1BR: 1300, medianRent2BR: 1650, medianHomePrice: 350000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/bedford/i],
    medianRent1BR: 1550, medianRent2BR: 2050, medianHomePrice: 480000,
    yoyRentChange: 4.0, yoyHomePriceChange: 3.5,
  },
  {
    patterns: [/lower sackville/i, /sackville/i],
    medianRent1BR: 1250, medianRent2BR: 1600, medianHomePrice: 340000,
    yoyRentChange: 6.5, yoyHomePriceChange: 5.2,
  },
  {
    patterns: [/fall river/i, /windsor junction/i, /enfield/i],
    medianRent1BR: 1400, medianRent2BR: 1800, medianHomePrice: 420000,
    yoyRentChange: 3.5, yoyHomePriceChange: 2.8,
  },
  {
    patterns: [/hammonds plains/i, /tantallon/i],
    medianRent1BR: 1500, medianRent2BR: 1950, medianHomePrice: 470000,
    yoyRentChange: 3.2, yoyHomePriceChange: 2.5,
  },
  {
    patterns: [/timberlea/i, /lakeside/i, /beechville/i],
    medianRent1BR: 1350, medianRent2BR: 1750, medianHomePrice: 380000,
    yoyRentChange: 4.5, yoyHomePriceChange: 3.6,
  },
  // Cape Breton & other NS
  {
    patterns: [/sydney/i, /glace bay/i, /new waterford/i, /north sydney/i, /cape breton/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 175000,
    yoyRentChange: 8.5, yoyHomePriceChange: 7.2,
  },
  {
    patterns: [/truro/i, /bible hill/i],
    medianRent1BR: 1050, medianRent2BR: 1350, medianHomePrice: 280000,
    yoyRentChange: 6.0, yoyHomePriceChange: 5.0,
  },
  {
    patterns: [/new glasgow/i, /stellarton/i, /pictou/i, /westville/i],
    medianRent1BR: 900, medianRent2BR: 1150, medianHomePrice: 210000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.8,
  },
  {
    patterns: [/antigonish/i],
    medianRent1BR: 1100, medianRent2BR: 1400, medianHomePrice: 310000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/bridgewater/i, /lunenburg/i],
    medianRent1BR: 1050, medianRent2BR: 1300, medianHomePrice: 290000,
    yoyRentChange: 5.8, yoyHomePriceChange: 5.0,
  },
  {
    patterns: [/kentville/i, /wolfville/i, /new minas/i, /annapolis/i],
    medianRent1BR: 1050, medianRent2BR: 1350, medianHomePrice: 300000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.2,
  },
  {
    patterns: [/yarmouth/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 185000,
    yoyRentChange: 6.0, yoyHomePriceChange: 5.5,
  },
  {
    patterns: [/amherst/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 165000,
    yoyRentChange: 7.0, yoyHomePriceChange: 6.0,
  },
  // Fallback for Halifax and general NS
  {
    patterns: [/halifax/i],
    medianRent1BR: 1500, medianRent2BR: 1900, medianHomePrice: 450000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.0,
  },
];

// ── New Brunswick ────────────────────────────────────────────────────────────

const NB_ZONES: CostZone[] = [
  {
    patterns: [/downtown moncton/i, /main st.*moncton/i],
    medianRent1BR: 1200, medianRent2BR: 1500, medianHomePrice: 310000,
    yoyRentChange: 6.5, yoyHomePriceChange: 5.0,
  },
  {
    patterns: [/moncton/i, /riverview/i, /dieppe/i],
    medianRent1BR: 1150, medianRent2BR: 1400, medianHomePrice: 290000,
    yoyRentChange: 6.0, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/fredericton/i],
    medianRent1BR: 1100, medianRent2BR: 1350, medianHomePrice: 280000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.0,
  },
  {
    patterns: [/saint john/i, /st\.?\s*john(?!'s)/i],
    medianRent1BR: 1050, medianRent2BR: 1300, medianHomePrice: 250000,
    yoyRentChange: 5.8, yoyHomePriceChange: 5.5,
  },
  {
    patterns: [/miramichi/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 190000,
    yoyRentChange: 7.0, yoyHomePriceChange: 6.0,
  },
  {
    patterns: [/bathurst/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 165000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/edmundston/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 175000,
    yoyRentChange: 4.5, yoyHomePriceChange: 3.5,
  },
  {
    patterns: [/campbellton/i],
    medianRent1BR: 750, medianRent2BR: 950, medianHomePrice: 140000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.0,
  },
  {
    patterns: [/sussex/i, /hampton/i, /quispamsis/i, /rothesay/i],
    medianRent1BR: 1000, medianRent2BR: 1250, medianHomePrice: 270000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.2,
  },
  {
    patterns: [/oromocto/i],
    medianRent1BR: 1050, medianRent2BR: 1300, medianHomePrice: 260000,
    yoyRentChange: 4.5, yoyHomePriceChange: 3.8,
  },
  {
    patterns: [/shediac/i],
    medianRent1BR: 1000, medianRent2BR: 1250, medianHomePrice: 260000,
    yoyRentChange: 6.5, yoyHomePriceChange: 5.5,
  },
  {
    patterns: [/woodstock/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 170000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.0,
  },
];

// ── Prince Edward Island ─────────────────────────────────────────────────────

const PE_ZONES: CostZone[] = [
  {
    patterns: [/downtown charlottetown/i],
    medianRent1BR: 1300, medianRent2BR: 1650, medianHomePrice: 380000,
    yoyRentChange: 6.5, yoyHomePriceChange: 5.0,
  },
  {
    patterns: [/charlottetown/i],
    medianRent1BR: 1200, medianRent2BR: 1500, medianHomePrice: 350000,
    yoyRentChange: 6.0, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/summerside/i],
    medianRent1BR: 1000, medianRent2BR: 1250, medianHomePrice: 270000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.5,
  },
  {
    patterns: [/stratford/i],
    medianRent1BR: 1250, medianRent2BR: 1550, medianHomePrice: 370000,
    yoyRentChange: 5.8, yoyHomePriceChange: 4.8,
  },
  {
    patterns: [/cornwall/i, /north river/i],
    medianRent1BR: 1150, medianRent2BR: 1400, medianHomePrice: 330000,
    yoyRentChange: 5.5, yoyHomePriceChange: 4.2,
  },
  {
    patterns: [/montague/i, /souris/i, /georgetown/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 210000,
    yoyRentChange: 5.0, yoyHomePriceChange: 4.0,
  },
  {
    patterns: [/kensington/i, /o'leary/i, /alberton/i, /tignish/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 190000,
    yoyRentChange: 4.5, yoyHomePriceChange: 3.5,
  },
];

// ── Newfoundland and Labrador ────────────────────────────────────────────────

const NL_ZONES: CostZone[] = [
  {
    patterns: [/downtown.*st\.?\s*john'?s/i, /water st.*st\.?\s*john'?s/i, /duckworth/i],
    medianRent1BR: 1100, medianRent2BR: 1400, medianHomePrice: 320000,
    yoyRentChange: 4.0, yoyHomePriceChange: 2.5,
  },
  {
    patterns: [/st\.?\s*john'?s/i, /mount pearl/i, /paradise/i, /conception bay south/i, /torbay/i],
    medianRent1BR: 1050, medianRent2BR: 1300, medianHomePrice: 300000,
    yoyRentChange: 3.8, yoyHomePriceChange: 2.2,
  },
  {
    patterns: [/corner brook/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 195000,
    yoyRentChange: 3.5, yoyHomePriceChange: 1.8,
  },
  {
    patterns: [/gander/i],
    medianRent1BR: 900, medianRent2BR: 1100, medianHomePrice: 220000,
    yoyRentChange: 3.0, yoyHomePriceChange: 1.5,
  },
  {
    patterns: [/grand falls/i, /windsor/i, /bishop'?s falls/i],
    medianRent1BR: 800, medianRent2BR: 1000, medianHomePrice: 175000,
    yoyRentChange: 3.0, yoyHomePriceChange: 1.5,
  },
  {
    patterns: [/clarenville/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 200000,
    yoyRentChange: 3.2, yoyHomePriceChange: 1.8,
  },
  {
    patterns: [/happy valley/i, /goose bay/i, /labrador city/i, /wabush/i],
    medianRent1BR: 950, medianRent2BR: 1200, medianHomePrice: 180000,
    yoyRentChange: 2.5, yoyHomePriceChange: 1.0,
  },
  {
    patterns: [/stephenville/i, /port aux basques/i, /deer lake/i],
    medianRent1BR: 750, medianRent2BR: 950, medianHomePrice: 155000,
    yoyRentChange: 3.0, yoyHomePriceChange: 1.5,
  },
  {
    patterns: [/carbonear/i, /harbour grace/i, /bay roberts/i],
    medianRent1BR: 850, medianRent2BR: 1050, medianHomePrice: 195000,
    yoyRentChange: 3.5, yoyHomePriceChange: 2.0,
  },
];

// ─── All zones combined ──────────────────────────────────────────────────────

const ALL_ZONES: CostZone[] = [
  ...NS_ZONES,
  ...NB_ZONES,
  ...PE_ZONES,
  ...NL_ZONES,
];

/** Regional median 2BR rent used as the scoring baseline. */
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

  for (const zone of ALL_ZONES) {
    for (const pattern of zone.patterns) {
      if (pattern.test(searchText)) {
        // Score: compare zone rent to regional median.
        // Below median → higher score (affordable), above → lower score.
        const ratio = zone.medianRent2BR / REGIONAL_MEDIAN_RENT_2BR;
        const score = Math.max(20, Math.min(95, Math.round(50 + (1 - ratio) * 50)));

        return {
          score,
          medianRent1BR:      zone.medianRent1BR,
          medianRent2BR:      zone.medianRent2BR,
          medianHomePrice:    zone.medianHomePrice,
          yoyRentChange:      zone.yoyRentChange,
          yoyHomePriceChange: zone.yoyHomePriceChange,
          zone: searchText.match(pattern)?.[0] ?? neighborhood,
        };
      }
    }
  }

  return null;
}
