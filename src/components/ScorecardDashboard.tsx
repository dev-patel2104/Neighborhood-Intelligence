import AddressHeader from "./AddressHeader";
import CategoryCard from "./CategoryCard";
import OverallScoreRing from "./OverallScoreRing";
import type { NeighborhoodScore } from "@/lib/types";

interface ScorecardDashboardProps {
  data: NeighborhoodScore;
  onNewSearch: () => void;
  // Comparison
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  canAddToCompare: boolean;
}

export default function ScorecardDashboard({
  data,
  onNewSearch,
  onAddToCompare,
  isAddedToCompare,
  canAddToCompare,
}: ScorecardDashboardProps) {
  return (
    <section className="flex flex-col gap-6 animate-slide-up pb-24">
      {/* Address + metadata */}
      <AddressHeader
        address={data.address}
        neighborhood={data.neighborhood}
        city={data.city}
        state={data.state}
        lastUpdated={data.lastUpdated}
        dataSource={data.dataSource}
        onNewSearch={onNewSearch}
        onAddToCompare={onAddToCompare}
        isAddedToCompare={isAddedToCompare}
        canAddToCompare={canAddToCompare}
      />

      {/* Overall score panel */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-8">
        <OverallScoreRing
          score={data.overallScore}
          band={data.overallBand}
          label="Overall Neighborhood Score"
        />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-bold text-gray-900">{data.neighborhood}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{data.summary}</p>

          {/* Score band legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
            {[
              { label: "Excellent (75–100)", color: "#22c55e" },
              { label: "Average (50–74)", color: "#f59e0b" },
              { label: "Needs Work (0–49)", color: "#ef4444" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Category Breakdown
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
