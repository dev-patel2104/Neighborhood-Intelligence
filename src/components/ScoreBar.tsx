import { bandToHex } from "@/lib/utils";
import type { ScoreBand } from "@/lib/types";

interface ScoreBarProps {
  value: number;  // 0–100
  band: ScoreBand;
  className?: string;
}

/**
 * Horizontal progress bar whose fill colour reflects the score band.
 * Width is set via inline style to avoid Tailwind purge issues with
 * dynamically computed percentage values.
 */
export default function ScoreBar({ value, band, className = "" }: ScoreBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const fillColor = bandToHex(band);

  return (
    <div
      className={`relative h-2 w-full rounded-full bg-gray-100 overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score: ${clampedValue} out of 100`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clampedValue}%`, backgroundColor: fillColor }}
      />
    </div>
  );
}
