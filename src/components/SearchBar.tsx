"use client";

import { useCallback, useRef, useState } from "react";
import { parseAddress } from "@/lib/addressParser";
import { useAddressSuggestions } from "@/hooks/useAddressSuggestions";
import SuggestionDropdown from "./SuggestionDropdown";

interface SearchBarProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

/**
 * Address search bar with debounced autocomplete suggestions.
 * Fully keyboard-accessible: Arrow keys navigate suggestions,
 * Enter submits, Escape closes the dropdown.
 */
export default function SearchBar({ onSearch, isLoading, initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading: suggestionsLoading, fetchSuggestions, clearSuggestions } =
    useAddressSuggestions();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      setValidationError(null);
      setActiveIndex(-1);
      setIsOpen(true);
      fetchSuggestions(val);
    },
    [fetchSuggestions]
  );

  const submitSearch = useCallback(
    (address: string) => {
      const parsed = parseAddress(address);
      if (parsed.error) {
        setValidationError(parsed.error);
        return;
      }
      setQuery(parsed.normalised);
      setIsOpen(false);
      clearSuggestions();
      onSearch(parsed.normalised);
    },
    [onSearch, clearSuggestions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          submitSearch(query);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0) {
            submitSearch(suggestions[activeIndex]);
          } else {
            submitSearch(query);
          }
          break;
        case "Escape":
          setIsOpen(false);
          clearSuggestions();
          break;
      }
    },
    [isOpen, suggestions, activeIndex, query, submitSearch, clearSuggestions]
  );

  const handleBlur = useCallback(() => {
    // Delay close so mousedown on suggestion fires first
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitSearch(query);
    },
    [query, submitSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Input with search icon */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              placeholder="Enter an HRM address — e.g. 2595 Agricola St, Halifax, NS"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search address"
              aria-autocomplete="list"
              aria-controls="suggestion-listbox"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              aria-invalid={validationError ? "true" : undefined}
              className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none transition
                focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                ${validationError ? "border-score-poor" : "border-gray-200"}
              `}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden sm:inline">Searching…</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion dropdown */}
        {isOpen && (
          <SuggestionDropdown
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={submitSearch}
            isLoading={suggestionsLoading}
          />
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <p role="alert" className="mt-2 text-xs text-score-poor">
          {validationError}
        </p>
      )}
    </form>
  );
}
