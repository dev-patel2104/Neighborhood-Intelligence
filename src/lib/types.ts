// ─── Score Bands ────────────────────────────────────────────────────────────

export type ScoreBand = "good" | "fair" | "poor";

export type TrendDirection = "up" | "down" | "flat";

// ─── Category Identifiers ────────────────────────────────────────────────────

export type CategoryId =
  | "safety"
  | "schools"
  | "transit"
  | "walkability"
  | "environment"
  | "greenSpace"
  | "costOfLiving"
  | "community";

// ─── Individual Category Score ───────────────────────────────────────────────

export interface CategoryScore {
  id: CategoryId;
  label: string;
  score: number; // 0–100
  band: ScoreBand;
  trend: TrendDirection;
  description: string;
  stats: CategoryStat[];
  source: string;      // data attribution
  updatedDate: string; // e.g. "Mar 2025"
}

export interface CategoryStat {
  label: string;
  value: string;
}

// ─── Full Neighborhood Scorecard ─────────────────────────────────────────────

export interface NeighborhoodScore {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  overallScore: number;
  overallBand: ScoreBand;
  overallLabel: string;
  summary: string;
  categories: CategoryScore[];
  lastUpdated: string;
  dataSource: string;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Search State (used by hooks) ────────────────────────────────────────────

export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface SearchState {
  status: SearchStatus;
  data: NeighborhoodScore | null;
  error: string | null;
}
