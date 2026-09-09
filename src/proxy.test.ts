import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch as doesProxyMatch } from "next/experimental/testing/server";
import nextConfig from "../next.config";
import { config } from "./proxy";

describe("admin proxy matcher", () => {
  it.each(["/admin", "/admin/dashboard", "/admin/governance?tab=pilot"])("protects %s", (url) => {
    expect(doesProxyMatch({ config, nextConfig, url })).toBe(true);
  });

  it.each(["/", "/access-denied", "/api/auth/role", "/client/dashboard"])("does not intercept %s", (url) => {
    expect(doesProxyMatch({ config, nextConfig, url })).toBe(false);
  });
});
