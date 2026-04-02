import type { ScoreBand, TrendDirection } from "./types";

/** Map a 0–100 score to a quality band */
export function scoreToBand(score: number): ScoreBand {
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

/** Tailwind text colour class for a band */
export function bandToTextClass(band: ScoreBand): string {
  return {
    good: "text-score-good",
    fair: "text-score-fair",
    poor: "text-score-poor",
  }[band];
}

/** Tailwind background colour class for a band */
export function bandToBgClass(band: ScoreBand): string {
  return {
    good: "bg-score-good-bg border-score-good-border",
    fair: "bg-score-fair-bg border-score-fair-border",
    poor: "bg-score-poor-bg border-score-poor-border",
  }[band];
}

/** Hex fill colour for SVG elements */
export function bandToHex(band: ScoreBand): string {
  return {
    good: "#22c55e",
    fair: "#f59e0b",
    poor: "#ef4444",
  }[band];
}

/** Human-readable score label */
export function scoreToLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Above Average";
  if (score >= 50) return "Average";
  if (score >= 35) return "Below Average";
  return "Needs Improvement";
}

/** Trend arrow character */
export function trendToArrow(trend: TrendDirection): string {
  return { up: "↑", down: "↓", flat: "→" }[trend];
}

/** Trend colour class */
export function trendToColorClass(trend: TrendDirection): string {
  return {
    up: "text-score-good",
    down: "text-score-poor",
    flat: "text-gray-400",
  }[trend];
}

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
