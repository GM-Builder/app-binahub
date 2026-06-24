"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, trackPage, identifyUser } from "@/lib/analytics";

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    trackPage(pathname);
  }, [pathname]);
}

export function useTrackEvent() {
  return useCallback(
    (name: string, properties?: Record<string, string | number | boolean>) => {
      trackEvent(name, properties);
    },
    []
  );
}

export function useIdentifyUser() {
  return useCallback(
    (userId: string, traits?: Record<string, string | number | boolean>) => {
      identifyUser(userId, traits);
    },
    []
  );
}

export function trackEngagementCreated(engagementId: string) {
  trackEvent("engagement_created", { engagement_id: engagementId });
}

export function trackEvidenceSubmitted(evidenceId: string, type: string) {
  trackEvent("evidence_submitted", { evidence_id: evidenceId, type });
}

export function trackReflectionSubmitted(reflectionId: string) {
  trackEvent("reflection_submitted", { reflection_id: reflectionId });
}

export function trackActionUpdated(actionId: string, status: string) {
  trackEvent("action_updated", { action_id: actionId, status });
}

export function trackCapabilityViewed(participantId: string) {
  trackEvent("capability_viewed", { participant_id: participantId });
}

export function trackReportGenerated(reportType: string) {
  trackEvent("report_generated", { report_type: reportType });
}
