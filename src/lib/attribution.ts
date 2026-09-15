export type AssessmentAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  landingPage?: string;
  referrer?: string;
};

const JOURNEY_STORAGE_KEY = "binahub.inboundJourney.v1";
const JOURNEY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: string | null, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function locationWithoutQuery(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 2048);
  } catch {
    return undefined;
  }
}

export function readAssessmentAttribution(search: string, currentUrl: string, documentReferrer: string): AssessmentAttribution {
  const params = new URLSearchParams(search);
  const explicitSource = clean(params.get("source"), 200);
  const attribution: AssessmentAttribution = {
    utmSource: clean(params.get("utm_source"), 200) || (explicitSource === "program" ? undefined : explicitSource),
    utmMedium: clean(params.get("utm_medium"), 200),
    utmCampaign: clean(params.get("utm_campaign"), 300),
    utmContent: clean(params.get("utm_content"), 300),
    utmTerm: clean(params.get("utm_term"), 300),
    gclid: clean(params.get("gclid"), 500),
    fbclid: clean(params.get("fbclid"), 500),
    msclkid: clean(params.get("msclkid"), 500),
    landingPage: clean(params.get("landing_page"), 2048) || locationWithoutQuery(currentUrl),
    referrer: clean(params.get("referrer"), 2048) || locationWithoutQuery(documentReferrer),
  };

  return Object.fromEntries(Object.entries(attribution).filter(([, value]) => Boolean(value))) as AssessmentAttribution;
}

/** Carries only an opaque UUID across the public site and app. No name, email,
 * campaign detail, or assessment answer is ever placed in this browser key. */
export function readAssessmentJourneyId(search: string) {
  const incoming = new URLSearchParams(search).get("bh_journey")?.trim();
  if (incoming && JOURNEY_ID_PATTERN.test(incoming)) {
    storeAssessmentJourneyId(incoming);
    return incoming;
  }
  try {
    const stored = window.localStorage.getItem(JOURNEY_STORAGE_KEY)?.trim();
    return stored && JOURNEY_ID_PATTERN.test(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function storeAssessmentJourneyId(journeyId: string) {
  if (!JOURNEY_ID_PATTERN.test(journeyId)) return;
  try { window.localStorage.setItem(JOURNEY_STORAGE_KEY, journeyId); } catch { /* optional storage */ }
}
