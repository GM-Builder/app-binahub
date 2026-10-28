export const ASSESSMENT_LOADING_MS = 5_000;

// Finish the short loading experience only after the API confirms durable receipt.
// A slow or failed save must never be presented as a successful submission.
export async function submitAssessment(
  payload: unknown,
  requestKey: string,
  onAccepted: () => void,
) {
  const started = Date.now();
  const response = await fetch('/api/assessment', {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || typeof data.assessmentId !== 'string') {
    const details = typeof data?.details === 'string' ? ` (${data.details})` : '';
    throw new Error((data?.error || 'Self Diagnostic could not be saved.') + details);
  }
  onAccepted();
  const remaining = Math.max(0, ASSESSMENT_LOADING_MS - (Date.now() - started));
  if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
  return data;
}
