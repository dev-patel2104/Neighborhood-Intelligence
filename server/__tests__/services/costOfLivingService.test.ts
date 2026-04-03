import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@server/lib/errors";

vi.mock("@server/lib/costOfLivingLoader", () => ({
  getCostOfLivingData: vi.fn(),
}));

import { getCostOfLivingData } from "@server/lib/costOfLivingLoader";
import { getCostOfLivingScore } from "@server/services/costOfLivingService";

const mockGetCostOfLivingData = vi.mocked(getCostOfLivingData);

const MOCK_RESULT = {
  score: 55,
  medianRent1BR: 1500,
  medianRent2BR: 1950,
  medianHomePrice: 420000,
  yoyRentChange: 6.1,
  yoyHomePriceChange: 5.3,
  zone: "north end",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCostOfLivingScore", () => {
  describe("input validation", () => {
    it("throws INVALID_INPUT when both neighborhood and address are empty", () => {
      expect(() => getCostOfLivingScore("", "")).toThrow(AppError);
      expect(() => getCostOfLivingScore("", "")).toThrowError(
        expect.objectContaining({ code: "INVALID_INPUT" })
      );
    });
  });

  describe("no data match", () => {
    it("throws NOT_FOUND when loader returns null", () => {
      mockGetCostOfLivingData.mockReturnValue(null);

      expect(() => getCostOfLivingScore("Unknown Hamlet", "123 Nowhere Rd")).toThrow(
        expect.objectContaining({ code: "NOT_FOUND" })
      );
    });
  });

  describe("successful result", () => {
    it("returns the cost-of-living result from the loader", () => {
      mockGetCostOfLivingData.mockReturnValue(MOCK_RESULT);

      const result = getCostOfLivingScore("North End", "2595 Agricola St");

      expect(result).toEqual(MOCK_RESULT);
    });

    it("calls loader with neighborhood and address", () => {
      mockGetCostOfLivingData.mockReturnValue(MOCK_RESULT);

      getCostOfLivingScore("North End", "2595 Agricola St, Halifax, NS");

      expect(mockGetCostOfLivingData).toHaveBeenCalledWith(
        "North End",
        "2595 Agricola St, Halifax, NS"
      );
    });

    it("works when only neighborhood is provided (address empty)", () => {
      mockGetCostOfLivingData.mockReturnValue(MOCK_RESULT);

      const result = getCostOfLivingScore("North End", "");

      expect(result).toEqual(MOCK_RESULT);
    });

    it("works when only address is provided (neighborhood empty)", () => {
      mockGetCostOfLivingData.mockReturnValue(MOCK_RESULT);

      const result = getCostOfLivingScore("", "2595 Agricola St, Halifax, NS");

      expect(result).toEqual(MOCK_RESULT);
    });
  });
});
