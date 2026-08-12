import { describe, expect, it } from "vitest";
import { createAvatarRegistry, resolveAssetUrl } from "./registry";
import type { AvatarManifest } from "./types";

const manifest: AvatarManifest = {
  schemaVersion: 1,
  avatarId: "sol",
  version: "v1",
  baseUrl: "https://cdn.example.com/tenant/sol/v1/",
  defaultIdleId: "idle_1",
  assets: [
    { id: "idle_1", url: "idle_1.webm", kind: "idle" },
    { id: "welcome", url: "welcome.webm", kind: "welcome" },
  ],
};

describe("avatar registry", () => {
  it("resolves relative asset URLs against the cache base", () => {
    const registry = createAvatarRegistry(manifest);
    expect(registry.byId.get("welcome")?.resolvedUrl).toBe(
      "https://cdn.example.com/tenant/sol/v1/welcome.webm",
    );
  });

  it("preserves absolute URLs", () => {
    expect(resolveAssetUrl("https://other.example/a.webm", manifest.baseUrl)).toBe(
      "https://other.example/a.webm",
    );
  });

  it("rejects duplicated semantic ids", () => {
    expect(() =>
      createAvatarRegistry({
        ...manifest,
        assets: [...manifest.assets, manifest.assets[0]],
      }),
    ).toThrow("Duplicate avatar asset id");
  });
});
