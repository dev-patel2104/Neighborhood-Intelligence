import ScoreBar from "./ScoreBar";
import { bandToBgClass, bandToTextClass, trendToArrow, trendToColorClass } from "@/lib/utils";
import type { CategoryScore } from "@/lib/types";

// ── Category Icons (inline SVG paths) ─────────────────────────────────────────

const ICONS: Record<string, JSX.Element> = {
  safety: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  environment: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  costOfLiving: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  amenities: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  ),
};

interface CategoryCardProps {
  category: CategoryScore;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { id, label, score, band, trend, description, stats, source, updatedDate } = category;
  const icon = ICONS[id];
  const textClass = bandToTextClass(band);
  const bgBorderClass = bandToBgClass(band);
  const arrow = trendToArrow(trend);
  const arrowClass = trendToColorClass(trend);

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-md ${bgBorderClass} animate-fade-in`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`${textClass}`}>{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <span className={`text-xs font-medium ${arrowClass}`} title={`Trend: ${trend}`}>
          {arrow} {trend}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-2">
        {score !== null ? (
          <>
            <span className={`text-3xl font-bold leading-none ${textClass}`}>{score}</span>
            <span className="text-xs text-gray-400 pb-1">/ 100</span>
          </>
        ) : (
          <span className="text-3xl font-bold leading-none text-gray-300">N/A</span>
        )}
      </div>

      {/* Progress bar */}
      <ScoreBar value={score} band={band} />

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{description}</p>

      {/* Stats */}
      <ul className="mt-auto space-y-1 border-t border-gray-200 pt-3">
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500 truncate">{stat.label}</span>
            <span className="text-xs font-medium text-gray-700 shrink-0">{stat.value}</span>
          </li>
        ))}
      </ul>

      {/* Source + date attribution */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2">
        <span
          className="text-[10px] text-gray-400 truncate leading-tight"
          title={source}
        >
          {source}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-gray-400">{updatedDate}</span>
      </div>
    </article>
  );
}
