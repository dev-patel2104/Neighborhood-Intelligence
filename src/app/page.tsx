"use client";

import { useCallback, useEffect, useRef } from "react";
import SearchBar from "@/components/SearchBar";
import ScorecardDashboard from "@/components/ScorecardDashboard";
import ComparisonView from "@/components/ComparisonView";
import ComparisonBar from "@/components/ComparisonBar";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import InstallPrompt from "@/components/InstallPrompt";
import { useNeighborhoodSearch } from "@/hooks/useNeighborhoodSearch";
import { useComparison } from "@/hooks/useComparison";

const EXAMPLE_ADDRESSES = [
  "2595 Agricola St, Halifax, NS",
  "150 Wyse Rd, Dartmouth, NS",
  "287 Bedford Hwy, Bedford, NS",
];

export default function HomePage() {
  const { state, search, reset } = useNeighborhoodSearch();
  const comparison = useComparison();
  const isLoading = state.status === "loading";

  // Stable refs so the popstate listener never captures stale closures
  const searchRef = useRef(search);
  searchRef.current = search;
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // ── URL ↔ state sync ────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (address: string) => {
      window.history.pushState({ address }, "", `/?q=${encodeURIComponent(address)}`);
      // Exit comparison view when a new search is triggered
      comparison.stopCompare();
      search(address);
    },
    [search, comparison]
  );

  const handleReset = useCallback(() => {
    window.history.pushState({}, "", "/");
    comparison.stopCompare();
    reset();
  }, [reset, comparison]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) searchRef.current(q);

    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const addr = p.get("q");
      if (addr) searchRef.current(addr);
      else resetRef.current();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []); // intentionally empty — uses refs

  // ── Comparison handlers ────────────────────────────────────────────────────
  const handleAddToCompare = useCallback(() => {
    if (state.data) comparison.addItem(state.data);
  }, [state.data, comparison]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="w-full px-4 py-4 sm:px-6 lg:px-10 xl:px-16">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                aria-label="Go to home"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 transition group-hover:bg-brand-700">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900 leading-tight group-hover:text-brand-700 transition">
                    Neighborhood Intelligence
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Address-level insights at your fingertips
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          {/* Search bar — always visible */}
          <section aria-label="Search" className="mb-8">
            {state.status === "idle" && (
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Discover any HRM neighbourhood
                </h2>
                <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">
                  Enter any Halifax Regional Municipality address to get an instant scorecard
                  covering safety, schools, transit, environment, and more.
                </p>
              </div>
            )}

            <SearchBar onSearch={handleSearch} isLoading={isLoading} initialValue={state.data?.address ?? ""} />

            {state.status === "idle" && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-gray-400 self-center">Try:</span>
                {EXAMPLE_ADDRESSES.map((addr) => (
                  <button
                    key={addr}
                    onClick={() => handleSearch(addr)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {addr}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Results section */}
          <section aria-label="Neighborhood results" aria-live="polite">
            {state.status === "loading" && <LoadingState />}

            {state.status === "error" && state.error && (
              <ErrorState message={state.error} onRetry={handleReset} />
            )}

            {state.status === "success" && state.data && (
              <>
                {comparison.isComparing ? (
                  <ComparisonView
                    items={comparison.items}
                    onClose={comparison.stopCompare}
                    onRemoveItem={comparison.removeItem}
                  />
                ) : (
                  <ScorecardDashboard
                    data={state.data}
                    onNewSearch={handleReset}
                    onAddToCompare={handleAddToCompare}
                    isAddedToCompare={comparison.isAdded(state.data.address)}
                    canAddToCompare={comparison.canAdd}
                  />
                )}
              </>
            )}
          </section>

          {/* Landing feature highlights */}
          {state.status === "idle" && (
            <section aria-label="Feature highlights" className="mt-14">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>
                    ),
                    title: "8 Key Categories",
                    desc: "Safety, schools, Halifax Transit, walkability, environment, green space, cost of living, and community.",
                  },
                  {
                    icon: (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    ),
                    title: "Side-by-Side Compare",
                    desc: "Queue up to 4 HRM neighbourhoods and compare every category score simultaneously.",
                  },
                  {
                    icon: (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                      </svg>
                    ),
                    title: "Works Offline",
                    desc: "Install as a PWA for home-screen access and offline functionality anywhere you go.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      {feature.icon}
                    </span>
                    <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-100 py-6 text-center">
          <p className="text-xs text-gray-400">
            Neighborhood Intelligence &mdash; Powered by NeighborhoodIQ Composite Index.{" "}
            <span className="text-gray-300">Data is simulated for demonstration purposes.</span>
          </p>
        </footer>
      </div>

      {/* ── Fixed overlays ───────────────────────────────────────────────── */}
      <ComparisonBar
        items={comparison.items}
        onRemove={comparison.removeItem}
        onCompare={comparison.startCompare}
        onClear={comparison.clearAll}
      />
      <InstallPrompt />
    </>
  );
}
