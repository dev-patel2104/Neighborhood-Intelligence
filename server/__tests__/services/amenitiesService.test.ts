import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@server/lib/errors";

vi.mock("@server/lib/amenityLoader", () => ({
  getAmenityScore: vi.fn(),
}));

import { getAmenityScore } from "@server/lib/amenityLoader";
import { getNearbyAmenities } from "@server/services/amenitiesService";

const mockGetAmenityScore = vi.mocked(getAmenityScore);

const MOCK_RESULT = {
  score: 72,
  totalCount: 45,
  groupCounts: { "Food & Dining": 12, "Shopping & Essentials": 8 },
  categoriesCovered: 4,
  typeCounts: { restaurant: 10, cafe: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getNearbyAmenities", () => {
  describe("input validation", () => {
    it("throws INVALID_INPUT when lat is NaN", async () => {
      await expect(getNearbyAmenities(NaN, -63.5)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT when lon is NaN", async () => {
      await expect(getNearbyAmenities(44.6, NaN)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT when both coordinates are NaN", async () => {
      await expect(getNearbyAmenities(NaN, NaN)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws AppError on invalid input", async () => {
      await expect(getNearbyAmenities(NaN, -63.5)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("loader failure", () => {
    it("throws UNAVAILABLE when loader returns null", async () => {
      mockGetAmenityScore.mockResolvedValue(null);

      await expect(getNearbyAmenities(44.6, -63.5)).rejects.toMatchObject({
        code: "UNAVAILABLE",
      });
    });
  });

  describe("successful result", () => {
    it("returns the amenity result from the loader", async () => {
      mockGetAmenityScore.mockResolvedValue(MOCK_RESULT);

      const result = await getNearbyAmenities(44.6, -63.5);

      expect(result).toEqual(MOCK_RESULT);
    });

    it("calls the loader with the provided coordinates", async () => {
      mockGetAmenityScore.mockResolvedValue(MOCK_RESULT);

      await getNearbyAmenities(44.6476, -63.5728);

      expect(mockGetAmenityScore).toHaveBeenCalledWith(44.6476, -63.5728);
    });

    it("calls the loader exactly once", async () => {
      mockGetAmenityScore.mockResolvedValue(MOCK_RESULT);

      await getNearbyAmenities(44.6, -63.5);

      expect(mockGetAmenityScore).toHaveBeenCalledTimes(1);
    });
  });
});
