interface AddressHeaderProps {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  lastUpdated: string;
  dataSource: string;
  onNewSearch: () => void;
  // Comparison props
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  canAddToCompare: boolean;
}

export default function AddressHeader({
  address,
  neighborhood,
  city,
  state,
  lastUpdated,
  dataSource,
  onNewSearch,
  onAddToCompare,
  isAddedToCompare,
  canAddToCompare,
}: AddressHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Address metadata */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <svg
            className="w-5 h-5 text-brand-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900 break-all">{address}</h2>
        </div>
        <p className="mt-0.5 text-sm text-gray-500 pl-7">
          {neighborhood} · {city}, {state}
        </p>
        <p className="mt-1 text-xs text-gray-400 pl-7">
          Data as of {lastUpdated} &mdash; {dataSource}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0 sm:mt-0">
        {/* Add to compare */}
        <button
          onClick={onAddToCompare}
          disabled={!canAddToCompare && !isAddedToCompare}
          title={
            isAddedToCompare
              ? "Already in comparison tray"
              : !canAddToCompare
              ? "Comparison tray is full (max 4)"
              : "Add to comparison"
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            isAddedToCompare
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          }`}
        >
          {isAddedToCompare ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Added
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Compare
            </>
          )}
        </button>

        {/* New search */}
        <button
          onClick={onNewSearch}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          New Search
        </button>
      </div>
    </header>
  );
}
