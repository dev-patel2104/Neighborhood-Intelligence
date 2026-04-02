"use client";

import { MAX_COMPARISONS } from "@/hooks/useComparison";
import type { NeighborhoodScore } from "@/lib/types";
import { bandToHex } from "@/lib/utils";

interface ComparisonBarProps {
  items: NeighborhoodScore[];
  onRemove: (address: string) => void;
  onCompare: () => void;
  onClear: () => void;
}

/**
 * Fixed bottom bar that appears whenever ≥ 1 neighbourhood is queued for comparison.
 * Lets users see and remove queued items, then launch the comparison view.
 */
export default function ComparisonBar({
  items,
  onRemove,
  onCompare,
  onClear,
}: ComparisonBarProps) {
  if (items.length === 0) return null;

  const canCompare = items.length >= 2;
  const remaining = MAX_COMPARISONS - items.length;

  return (
    <div
      role="region"
      aria-label="Comparison tray"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-2xl animate-slide-up"
    >
      <div className="w-full px-4 py-3 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left — label + chips */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 min-w-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
              Comparing ({items.length}/{MAX_COMPARISONS})
            </span>

            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item.address}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-2.5 pr-1.5 py-1 text-xs font-medium text-gray-700 max-w-[180px]"
                >
                  {/* Score dot */}
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: bandToHex(item.overallBand) }}
                  />
                  <span className="truncate">{item.neighborhood}</span>
                  <button
                    onClick={() => onRemove(item.address)}
                    aria-label={`Remove ${item.neighborhood} from comparison`}
                    className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}

              {/* "Add more" hint */}
              {remaining > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-400">
                  + {remaining} more
                </span>
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-gray-700 transition px-2 py-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Clear all
            </button>
            <button
              onClick={onCompare}
              disabled={!canCompare}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {canCompare ? "Compare Now" : `Need ${2 - items.length} more`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
