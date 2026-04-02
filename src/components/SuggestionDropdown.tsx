"use client";

interface SuggestionDropdownProps {
  suggestions: string[];
  activeIndex: number;
  onSelect: (suggestion: string) => void;
  isLoading: boolean;
}

/**
 * Keyboard-accessible autocomplete dropdown.
 * Rendered below the search input; item selection handled via click.
 * Keyboard navigation (arrows, Enter, Escape) is managed by SearchBar.
 */
export default function SuggestionDropdown({
  suggestions,
  activeIndex,
  onSelect,
  isLoading,
}: SuggestionDropdownProps) {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label="Address suggestions"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      {isLoading ? (
        <li className="px-4 py-3 text-sm text-gray-400 animate-pulse">
          Searching addresses…
        </li>
      ) : (
        suggestions.map((suggestion, index) => (
          <li
            key={suggestion}
            role="option"
            aria-selected={index === activeIndex}
            id={`suggestion-${index}`}
            className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm transition-colors ${
              index === activeIndex
                ? "bg-brand-50 text-brand-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            onMouseDown={(e) => {
              // Use mousedown instead of click to fire before the input's onBlur
              e.preventDefault();
              onSelect(suggestion);
            }}
          >
            {/* Map pin icon */}
            <svg
              className="h-4 w-4 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span className="truncate">{suggestion}</span>
          </li>
        ))
      )}
    </ul>
  );
}
