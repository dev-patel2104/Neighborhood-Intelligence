import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@server/lib/errors";

vi.mock("@server/lib/geocoder", () => ({
  geocodeAddress: vi.fn(),
  getAtlanticSuggestions: vi.fn(),
}));

vi.mock("@server/services/amenitiesService", () => ({
  getNearbyAmenities: vi.fn(),
}));

vi.mock("@server/services/environmentService", () => ({
  getEnvironmentScore: vi.fn(),
}));

vi.mock("@server/services/costOfLivingService", () => ({
  getCostOfLivingScore: vi.fn(),
}));

vi.mock("@server/data/mockDataEngine", () => ({
  generateNeighborhoodData: vi.fn(),
}));

import { geocodeAddress } from "@server/lib/geocoder";
import { getNearbyAmenities } from "@server/services/amenitiesService";
import { getEnvironmentScore } from "@server/services/environmentService";
import { getCostOfLivingScore } from "@server/services/costOfLivingService";
import { generateNeighborhoodData } from "@server/data/mockDataEngine";
import { getNeighborhoodScore } from "@server/services/neighborhoodService";

const mockGeocodeAddress = vi.mocked(geocodeAddress);
const mockGetNearbyAmenities = vi.mocked(getNearbyAmenities);
const mockGetEnvironmentScore = vi.mocked(getEnvironmentScore);
const mockGetCostOfLivingScore = vi.mocked(getCostOfLivingScore);
const mockGenerateNeighborhoodData = vi.mocked(generateNeighborhoodData);

const MOCK_GEO_SUCCESS = {
  found: true as const,
  inRegion: true as const,
  data: {
    displayAddress: "2595 Agricola St, North End, Halifax, NS B3K 4C5",
    neighborhood: "North End",
    city: "Halifax",
    province: "NS",
    postcode: "B3K 4C5",
    lat: 44.6601,
    lon: -63.5944,
  },
};

const MOCK_SCORECARD = {
  address: "2595 Agricola St, North End, Halifax, NS B3K 4C5",
  neighborhood: "North End",
  city: "Halifax",
  state: "NS",
  overallScore: 72,
  overallBand: "good" as const,
  overallLabel: "Good",
  summary: "North End is a good neighbourhood.",
  categories: [],
  lastUpdated: "April 1, 2025",
  dataSource: "Atlantic Canada NeighbourhoodIQ Composite Index",
};

const MOCK_AMENITY = {
  score: 78,
  totalCount: 55,
  groupCounts: {},
  categoriesCovered: 4,
  typeCounts: {},
};

const MOCK_ENVIRONMENT = {
  score: 85,
  usAqi: 12,
  pm25: 2.1,
  pm10: 4.0,
  no2: 3.5,
  ozone: 38.0,
  readingTime: "2025-04-01T12:00:00",
};

const MOCK_COST_OF_LIVING = {
  score: 52,
  medianRent1BR: 1500,
  medianRent2BR: 1950,
  medianHomePrice: 420000,
  yoyRentChange: 6.1,
  yoyHomePriceChange: 5.3,
  zone: "north end",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateNeighborhoodData.mockReturnValue(MOCK_SCORECARD);
  mockGetNearbyAmenities.mockResolvedValue(MOCK_AMENITY);
  mockGetEnvironmentScore.mockResolvedValue(MOCK_ENVIRONMENT);
  mockGetCostOfLivingScore.mockReturnValue(MOCK_COST_OF_LIVING);
});

describe("getNeighborhoodScore", () => {
  describe("address validation", () => {
    it("throws INVALID_INPUT for an empty address", async () => {
      await expect(getNeighborhoodScore("")).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT for a whitespace-only address", async () => {
      await expect(getNeighborhoodScore("    ")).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT for an address shorter than 5 characters", async () => {
      await expect(getNeighborhoodScore("abc")).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws INVALID_INPUT for an address longer than 200 characters", async () => {
      const longAddress = "A".repeat(201);
      await expect(getNeighborhoodScore(longAddress)).rejects.toMatchObject({
        code: "INVALID_INPUT",
      });
    });

    it("throws AppError for invalid input", async () => {
      await expect(getNeighborhoodScore("ab")).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("geocoding failures", () => {
    it("throws NOT_FOUND when geocoder cannot find the address", async () => {
      mockGeocodeAddress.mockResolvedValue({
        found: false,
        inRegion: false,
        errorMessage: "Address not found.",
      });

      await expect(getNeighborhoodScore("12345 Nowhere Blvd")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws OUTSIDE_REGION when address is outside Atlantic Canada", async () => {
      mockGeocodeAddress.mockResolvedValue({
        found: true,
        inRegion: false,
        errorMessage: "Address is in Ontario, outside Atlantic Canada.",
      });

      await expect(getNeighborhoodScore("123 King St, Toronto, ON")).rejects.toMatchObject({
        code: "OUTSIDE_REGION",
      });
    });
  });

  describe("successful scorecard assembly", () => {
    it("returns the scorecard from the data engine", async () => {
      mockGeocodeAddress.mockResolvedValue(MOCK_GEO_SUCCESS);

      const result = await getNeighborhoodScore("2595 Agricola St, Halifax, NS");

      expect(result).toEqual(MOCK_SCORECARD);
    });

    it("calls generateNeighborhoodData with geocoded data and real service results", async () => {
      mockGeocodeAddress.mockResolvedValue(MOCK_GEO_SUCCESS);

      await getNeighborhoodScore("2595 Agricola St, Halifax, NS");

      expect(mockGenerateNeighborhoodData).toHaveBeenCalledWith(
        "2595 Agricola St, Halifax, NS",
        {
          neighborhood: "North End",
          city: "Halifax",
          province: "NS",
          displayAddress: MOCK_GEO_SUCCESS.data.displayAddress,
          lat: MOCK_GEO_SUCCESS.data.lat,
          lon: MOCK_GEO_SUCCESS.data.lon,
        },
        {
          amenity: MOCK_AMENITY,
          environment: MOCK_ENVIRONMENT,
          costOfLiving: MOCK_COST_OF_LIVING,
        }
      );
    });

    it("continues with null amenities when amenity service fails", async () => {
      mockGeocodeAddress.mockResolvedValue(MOCK_GEO_SUCCESS);
      mockGetNearbyAmenities.mockRejectedValue(new Error("Overpass timeout"));

      await getNeighborhoodScore("2595 Agricola St, Halifax, NS");

      expect(mockGenerateNeighborhoodData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ amenity: null })
      );
    });

    it("continues with null environment when environment service fails", async () => {
      mockGeocodeAddress.mockResolvedValue(MOCK_GEO_SUCCESS);
      mockGetEnvironmentScore.mockRejectedValue(new Error("Open-Meteo timeout"));

      await getNeighborhoodScore("2595 Agricola St, Halifax, NS");

      expect(mockGenerateNeighborhoodData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ environment: null })
      );
    });

    it("continues with null cost-of-living when that service throws", async () => {
      mockGeocodeAddress.mockResolvedValue(MOCK_GEO_SUCCESS);
      mockGetCostOfLivingScore.mockImplementation(() => {
        throw new AppError("NOT_FOUND", "No data for this zone.");
      });

      await getNeighborhoodScore("2595 Agricola St, Halifax, NS");

      expect(mockGenerateNeighborhoodData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ costOfLiving: null })
      );
    });
  });
});
