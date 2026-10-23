// @vitest-environment node
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("production build resource limits", () => {
  it("uses two page-data workers regardless of the host CPU count", () => {
    expect(nextConfig.experimental?.cpus).toBe(2);
    expect(nextConfig.experimental?.memoryBasedWorkersCount).not.toBe(true);
  });

  it("does not enable the alternative worker-thread pool", () => {
    expect(nextConfig.experimental?.workerThreads).toBe(false);
  });

  it("keeps TypeScript errors blocking the production build", () => {
    expect(nextConfig.typescript?.ignoreBuildErrors).not.toBe(true);
  });
});
