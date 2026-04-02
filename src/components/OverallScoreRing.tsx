import { bandToHex, scoreToLabel } from "@/lib/utils";
import type { ScoreBand } from "@/lib/types";

interface OverallScoreRingProps {
  score: number;
  band: ScoreBand;
  label: string;
}

/**
 * SVG donut/ring chart representing the overall neighbourhood score.
 * Pure SVG — no canvas, no third-party chart library.
 */
export default function OverallScoreRing({ score, band, label }: OverallScoreRingProps) {
  const SIZE = 180;
  const STROKE = 18;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const clampedScore = Math.max(0, Math.min(100, score));
  const fillLength = (clampedScore / 100) * CIRCUMFERENCE;
  const gapLength = CIRCUMFERENCE - fillLength;

  const fillColor = bandToHex(band);
  const qualityLabel = scoreToLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="rotate-[-90deg]"
          aria-label={`Overall score: ${score} out of 100`}
          role="img"
        >
          {/* Track ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={STROKE}
          />
          {/* Score arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={fillColor}
            strokeWidth={STROKE}
            strokeDasharray={`${fillLength} ${gapLength}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Centre text — rotated back to upright */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-extrabold leading-none"
            style={{ color: fillColor }}
          >
            {clampedScore}
          </span>
          <span className="text-xs font-medium text-gray-400 mt-1">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">{qualityLabel}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
