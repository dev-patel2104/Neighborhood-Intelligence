import ScoreBar from "./ScoreBar";
import OverallScoreRing from "./OverallScoreRing";
import { bandToHex, bandToTextClass } from "@/lib/utils";
import type { CategoryId, NeighborhoodScore } from "@/lib/types";

// ── Minimal inline icons (reused subset from CategoryCard) ────────────────────
const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  safety: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  environment: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  costOfLiving: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  amenities: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  ),
};

interface ComparisonViewProps {
  items: NeighborhoodScore[];
  onClose: () => void;
  onRemoveItem: (address: string) => void;
}

/**
 * Side-by-side neighbourhood comparison.
 * Categories are rows; each neighbourhood is a column.
 * The winning score per row is highlighted with a coloured ring.
 */
export default function ComparisonView({ items, onClose, onRemoveItem }: ComparisonViewProps) {
  if (items.length < 2) return null;

  const categoryIds = items[0].categories.map((c) => c.id);

  // Helper: find the highest non-null score for a category across all items
  const maxCategoryScore = (id: CategoryId): number | null => {
    const scores = items
      .map((item) => item.categories.find((c) => c.id === id)?.score)
      .filter((s): s is number => s !== null && s !== undefined);
    return scores.length > 0 ? Math.max(...scores) : null;
  };

  const maxOverall = Math.max(...items.map((i) => i.overallScore));

  return (
    <section className="flex flex-col gap-6 animate-slide-up pb-24">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Neighborhood Comparison</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} neighborhoods · scores are out of 100
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Scorecard
        </button>
      </div>

      {/* ── Overall score cards row ───────────────────────────────────────── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isWinner = item.overallScore === maxOverall;
          return (
            <div
              key={item.address}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition ${
                isWinner ? "border-brand-500 ring-2 ring-brand-200" : "border-gray-100"
              }`}
            >
              {isWinner && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                  Top Pick
                </span>
              )}
              <OverallScoreRing
                score={item.overallScore}
                band={item.overallBand}
                label=""
              />
              <div className="text-center">
                <p className="font-bold text-gray-900 text-sm leading-snug">{item.neighborhood}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[160px]" title={item.address}>
                  {item.address}
                </p>
              </div>
              <button
                onClick={() => onRemoveItem(item.address)}
                className="mt-1 text-xs text-gray-400 hover:text-red-500 transition"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Category comparison table ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {/* Category label column */}
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                  Category
                </th>
                {items.map((item) => (
                  <th
                    key={item.address}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[180px]"
                  >
                    <span className="block truncate max-w-[160px]" title={item.neighborhood}>
                      {item.neighborhood}
                    </span>
                    <span
                      className="text-xs font-normal"
                      style={{ color: bandToHex(item.overallBand) }}
                    >
                      Overall: {item.overallScore}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categoryIds.map((catId, rowIndex) => {
                const best = maxCategoryScore(catId);
                return (
                  <tr
                    key={catId}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    {/* Category label (sticky) */}
                    <td
                      className={`sticky left-0 z-10 px-4 py-3.5 font-medium text-gray-700 border-r border-gray-100 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        {CATEGORY_ICONS[catId]}
                        <span className="text-xs font-semibold text-gray-600">
                          {items[0].categories.find((c) => c.id === catId)?.label}
                        </span>
                      </div>
                    </td>

                    {/* Score cell per neighbourhood */}
                    {items.map((item) => {
                      const cat = item.categories.find((c) => c.id === catId)!;
                      const isWinner = cat.score !== null && best !== null && cat.score === best && items.length > 1;
                      const scoreColor = bandToHex(cat.band);
                      const textClass = bandToTextClass(cat.band);
                      return (
                        <td key={item.address} className="px-4 py-3.5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              {cat.score !== null ? (
                                <>
                                  <span className={`text-xl font-bold leading-none ${textClass}`}>
                                    {cat.score}
                                  </span>
                                  <span className="text-xs text-gray-400">/ 100</span>
                                </>
                              ) : (
                                <span className="text-xl font-bold leading-none text-gray-300">N/A</span>
                              )}
                              {isWinner && (
                                <span
                                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: scoreColor }}
                                  title="Best in category"
                                >
                                  ★ Best
                                </span>
                              )}
                            </div>
                            <ScoreBar value={cat.score} band={cat.band} className="w-full max-w-[140px]" />
                            {/* Source + date */}
                            <p className="text-[10px] text-gray-400 leading-tight">
                              {cat.source} · {cat.updatedDate}
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Source legend ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">Data Sources</p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {items[0].categories.map((cat) => (
            <p key={cat.id} className="text-xs text-gray-400">
              <span className="font-medium text-gray-500">{cat.label}:</span> {cat.source}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
