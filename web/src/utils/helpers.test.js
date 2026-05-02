import { describe, it, expect } from "vitest";
import { makeMarketSlug, marketUrl, makeRequirementKey } from "./helpers";

describe("makeMarketSlug", () => {
  it("converts simple names to lowercase underscored slugs", () => {
    expect(makeMarketSlug("Ash Prime Set")).toBe("ash_prime_set");
  });

  it("strips apostrophes (Baro Ki'Teer → baro_kiteer)", () => {
    expect(makeMarketSlug("Baro Ki'Teer")).toBe("baro_kiteer");
  });

  it("collapses non-alphanumeric runs to single underscore", () => {
    expect(makeMarketSlug("Ash  Prime---Neuroptics")).toBe("ash_prime_neuroptics");
  });

  it("trims leading/trailing underscores", () => {
    expect(makeMarketSlug("  -Ash- ")).toBe("ash");
  });

  it("returns empty string for empty/null input", () => {
    expect(makeMarketSlug("")).toBe("");
    expect(makeMarketSlug(null)).toBe("");
    expect(makeMarketSlug(undefined)).toBe("");
  });
});

describe("marketUrl", () => {
  it("builds a market URL from name", () => {
    expect(marketUrl("Ash Prime Set")).toBe("https://warframe.market/items/ash_prime_set");
  });

  it("falls back to root market URL when slug is empty", () => {
    expect(marketUrl("")).toBe("https://warframe.market/");
    expect(marketUrl(null)).toBe("https://warframe.market/");
  });
});

describe("makeRequirementKey", () => {
  it("joins parent and requirement uniqueNames with separator", () => {
    expect(makeRequirementKey("/Lotus/Ash", "/Lotus/Salvage")).toBe("/Lotus/Ash::/Lotus/Salvage");
  });
});
