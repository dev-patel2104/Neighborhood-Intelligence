import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/geocoder", () => ({
  getAtlanticSuggestions: vi.fn(),
  geocodeAddress: vi.fn(),
}));

import { getAtlanticSuggestions } from "@server/lib/geocoder";
import { getAddressSuggestions } from "@server/services/suggestionsService";

const mockGetAtlanticSuggestions = vi.mocked(getAtlanticSuggestions);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAddressSuggestions", () => {
  describe("short query guard", () => {
    it("returns empty array for empty string", async () => {
      const result = await getAddressSuggestions("");
      expect(result).toEqual([]);
    });

    it("returns empty array for 1-character query", async () => {
      const result = await getAddressSuggestions("a");
      expect(result).toEqual([]);
    });

    it("returns empty array for 2-character query", async () => {
      const result = await getAddressSuggestions("ha");
      expect(result).toEqual([]);
    });

    it("returns empty array for whitespace-only query shorter than 3 chars", async () => {
      const result = await getAddressSuggestions("  ");
      expect(result).toEqual([]);
    });

    it("does not call geocoder for short queries", async () => {
      await getAddressSuggestions("ab");
      expect(mockGetAtlanticSuggestions).not.toHaveBeenCalled();
    });
  });

  describe("valid query", () => {
    it("delegates to the geocoder for 3-character queries", async () => {
      mockGetAtlanticSuggestions.mockResolvedValue(["123 Main St, Halifax, NS"]);

      await getAddressSuggestions("123");

      expect(mockGetAtlanticSuggestions).toHaveBeenCalledWith("123");
    });

    it("trims the query before passing to geocoder", async () => {
      mockGetAtlanticSuggestions.mockResolvedValue([]);

      await getAddressSuggestions("  Agricola  ");

      expect(mockGetAtlanticSuggestions).toHaveBeenCalledWith("Agricola");
    });

    it("returns the geocoder's suggestions", async () => {
      const suggestions = [
        "2595 Agricola St, Halifax, NS",
        "Agricola Street, Halifax, NS",
      ];
      mockGetAtlanticSuggestions.mockResolvedValue(suggestions);

      const result = await getAddressSuggestions("Agricola");

      expect(result).toEqual(suggestions);
    });

    it("returns empty array when geocoder returns no results", async () => {
      mockGetAtlanticSuggestions.mockResolvedValue([]);

      const result = await getAddressSuggestions("zzz no match");

      expect(result).toEqual([]);
    });
  });
});
