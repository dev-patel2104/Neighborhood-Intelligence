import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@server/lib/errors";

vi.mock("@server/lib/environmentLoader", () => ({
  getEnvironmentData: vi.fn(),
}));

import { getEnvironmentData } from "@server/lib/environmentLoader";
import { getEnvironmentScore } from "@server/services/environmentService";

const mockGetEnvironmentData = vi.mocked(getEnvironmentData);

const MOCK_RESULT = {
  score: 82,
  usAqi: 18,
  pm25: 3.2,
  pm10: 6.1,
  no2: 5.4,
  ozone: 42.0,
  readingTime: "2025-04-01T12:00:00",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getEnvironmentScore", () => {
  describe("input validation", () => {
    it("throws INVALID_INPUT when lat is NaN", async () => {
      await expect(getEnvironmentScore(NaN, -63.5)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT when lon is NaN", async () => {
      await expect(getEnvironmentScore(44.6, NaN)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT when both coordinates are NaN", async () => {
      await expect(getEnvironmentScore(NaN, NaN)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws AppError on invalid input", async () => {
      await expect(getEnvironmentScore(NaN, -63.5)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("loader failure", () => {
    it("throws UNAVAILABLE when loader returns null", async () => {
      mockGetEnvironmentData.mockResolvedValue(null);

      await expect(getEnvironmentScore(44.6, -63.5)).rejects.toMatchObject({
        code: "UNAVAILABLE",
      });
    });
  });

  describe("successful result", () => {
    it("returns the environment result from the loader", async () => {
      mockGetEnvironmentData.mockResolvedValue(MOCK_RESULT);

      const result = await getEnvironmentScore(44.6, -63.5);

      expect(result).toEqual(MOCK_RESULT);
    });

    it("calls the loader with the provided coordinates", async () => {
      mockGetEnvironmentData.mockResolvedValue(MOCK_RESULT);

      await getEnvironmentScore(44.6476, -63.5728);

      expect(mockGetEnvironmentData).toHaveBeenCalledWith(44.6476, -63.5728);
    });

    it("calls the loader exactly once", async () => {
      mockGetEnvironmentData.mockResolvedValue(MOCK_RESULT);

      await getEnvironmentScore(44.6, -63.5);

      expect(mockGetEnvironmentData).toHaveBeenCalledTimes(1);
    });
  });
});
