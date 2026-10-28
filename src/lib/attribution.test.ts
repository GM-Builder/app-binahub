import { describe, expect, it } from "vitest";
import { readAssessmentAttribution } from "./attribution";

describe("Self Diagnostic attribution", () => {
  it("maps campaign parameters and removes query data from fallback URLs", () => {
    expect(readAssessmentAttribution(
      "?utm_source=google&utm_medium=cpc&utm_campaign=ceo&gclid=click-1",
      "https://app.binahub.id/insight?utm_source=google",
      "https://binahub.id/insight?private=value",
    )).toEqual({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "ceo",
      gclid: "click-1",
      landingPage: "https://app.binahub.id/insight",
      referrer: "https://binahub.id/insight",
    });
  });

  it("does not treat program access as a marketing source", () => {
    expect(readAssessmentAttribution("?source=program", "https://app.binahub.id/insight", "")).toEqual({
      landingPage: "https://app.binahub.id/insight",
    });
  });
});
