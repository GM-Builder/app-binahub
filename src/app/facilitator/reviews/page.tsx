import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { facilitatorReviews } from "@/lib/demo-data";

export default function ReviewsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Facilitator Workspace" title="Assessment Reviews">
      <div className="grid gap-4">
        {facilitatorReviews.map((review) => (
          <article key={`${review.client}-${review.model}`} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{review.status}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">{review.client}</h2>
            <p className="mt-1 text-sm text-[#4A4C54]/70">
              {review.module} - {review.model}
            </p>
          </article>
        ))}
      </div>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
