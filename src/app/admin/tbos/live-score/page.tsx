import type { Metadata } from "next";
import { TbosLiveScoreScreen } from "./live-score-screen";

export const metadata: Metadata = {
  title: "T-BOS Live Score | BinaHub",
  robots: { index: false, follow: false },
};

type TbosLiveScorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TbosLiveScorePage({ searchParams }: TbosLiveScorePageProps) {
  const params = await searchParams;
  const programId = typeof params.programId === "string" ? params.programId : "";
  const batchId = typeof params.batchId === "string" ? params.batchId : "";
  return <TbosLiveScoreScreen programId={programId} initialBatchId={batchId} />;
}
