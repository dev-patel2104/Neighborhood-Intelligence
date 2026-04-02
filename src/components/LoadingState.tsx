/**
 * Skeleton loading UI that mirrors the shape of ScorecardDashboard.
 * Uses Tailwind's animate-pulse for the shimmer effect.
 */
export default function LoadingState() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Loading neighborhood data…">
      {/* Address header skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-64 rounded-md bg-gray-200" />
          <div className="h-4 w-44 rounded-md bg-gray-100" />
          <div className="h-3 w-52 rounded-md bg-gray-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-100" />
      </div>

      {/* Overall score panel skeleton */}
      <div className="flex gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Ring placeholder */}
        <div className="h-44 w-44 shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-5 w-48 rounded-md bg-gray-200" />
          <div className="h-4 w-full rounded-md bg-gray-100" />
          <div className="h-4 w-5/6 rounded-md bg-gray-100" />
          <div className="h-4 w-4/6 rounded-md bg-gray-100" />
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-28 rounded-md bg-gray-100" />
            <div className="h-4 w-28 rounded-md bg-gray-100" />
            <div className="h-4 w-28 rounded-md bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Category grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4"
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded-md bg-gray-200" />
              <div className="h-4 w-12 rounded-md bg-gray-100" />
            </div>
            <div className="h-8 w-16 rounded-md bg-gray-200" />
            <div className="h-2 w-full rounded-full bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-md bg-gray-100" />
              <div className="h-3 w-5/6 rounded-md bg-gray-100" />
              <div className="h-3 w-4/6 rounded-md bg-gray-100" />
            </div>
            <div className="mt-auto space-y-1.5 border-t border-gray-100 pt-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-28 rounded-md bg-gray-100" />
                  <div className="h-3 w-12 rounded-md bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
