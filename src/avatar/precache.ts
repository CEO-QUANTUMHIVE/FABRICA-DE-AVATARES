import type { ResolvedAvatarAsset } from "./types";

export interface AvatarPrecacheResult {
  loaded: string[];
  failed: string[];
}

const priorityWeight = {
  critical: 0,
  eager: 1,
  lazy: 2,
} as const;

export const orderAssetsForPrecache = (assets: ResolvedAvatarAsset[]) =>
  [...assets].sort(
    (left, right) =>
      priorityWeight[left.priority ?? "lazy"] -
      priorityWeight[right.priority ?? "lazy"],
  );

const warmVideo = (
  asset: ResolvedAvatarAsset,
  timeoutMs: number,
): Promise<boolean> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      resolve(loaded);
    };
    const timeout = window.setTimeout(() => finish(false), timeoutMs);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => finish(true);
    video.oncanplaythrough = () => finish(true);
    video.onerror = () => finish(false);
    video.src = asset.resolvedUrl;
    video.load();
  });

export const precacheAvatarAssets = async (
  assets: ResolvedAvatarAsset[],
  options: { concurrency?: number; timeoutMs?: number } = {},
): Promise<AvatarPrecacheResult> => {
  if (typeof document === "undefined") {
    return { loaded: [], failed: assets.map((asset) => asset.id) };
  }

  const queue = orderAssetsForPrecache(assets);
  const result: AvatarPrecacheResult = { loaded: [], failed: [] };
  const concurrency = Math.max(1, options.concurrency ?? 3);
  const timeoutMs = options.timeoutMs ?? 20_000;

  const worker = async () => {
    while (queue.length > 0) {
      const asset = queue.shift();
      if (!asset) return;
      const loaded = await warmVideo(asset, timeoutMs);
      result[loaded ? "loaded" : "failed"].push(asset.id);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, worker),
  );
  return result;
};
