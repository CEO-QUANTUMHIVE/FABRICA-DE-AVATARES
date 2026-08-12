import type {
  AvatarManifest,
  ResolvedAvatarAsset,
} from "./types";

const absoluteUrlPattern = /^(?:[a-z]+:)?\/\//i;

export const resolveAssetUrl = (url: string, baseUrl?: string) => {
  if (!baseUrl || absoluteUrlPattern.test(url) || url.startsWith("data:")) {
    return url;
  }

  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
};

export const validateAvatarManifest = (manifest: AvatarManifest) => {
  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported avatar manifest schema: ${manifest.schemaVersion}`);
  }
  if (!manifest.avatarId.trim() || !manifest.version.trim()) {
    throw new Error("Avatar manifest requires avatarId and version");
  }
  if (manifest.assets.length === 0) {
    throw new Error("Avatar manifest has no assets");
  }

  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (!asset.id.trim() || !asset.url.trim()) {
      throw new Error("Every avatar asset requires id and url");
    }
    if (ids.has(asset.id)) {
      throw new Error(`Duplicate avatar asset id: ${asset.id}`);
    }
    ids.add(asset.id);
  }

  const defaultIdle = manifest.assets.find(
    (asset) => asset.id === manifest.defaultIdleId,
  );
  if (!defaultIdle || defaultIdle.kind !== "idle") {
    throw new Error("defaultIdleId must reference an idle asset");
  }

  if (manifest.longWaitIdleId) {
    const longWaitIdle = manifest.assets.find(
      (asset) => asset.id === manifest.longWaitIdleId,
    );
    if (!longWaitIdle || longWaitIdle.kind !== "idle") {
      throw new Error("longWaitIdleId must reference an idle asset");
    }
  }
};

export const createAvatarRegistry = (manifest: AvatarManifest) => {
  validateAvatarManifest(manifest);

  const assets = manifest.assets.map<ResolvedAvatarAsset>((asset) => ({
    ...asset,
    resolvedUrl: resolveAssetUrl(asset.url, manifest.baseUrl),
    resolvedPosterUrl: asset.posterUrl
      ? resolveAssetUrl(asset.posterUrl, manifest.baseUrl)
      : undefined,
  }));
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const longWaitIdle = manifest.longWaitIdleId
    ? byId.get(manifest.longWaitIdleId)
    : undefined;
  const idleAssets = assets.filter(
    (asset) => asset.kind === "idle" && asset.id !== longWaitIdle?.id,
  );

  return {
    manifest,
    assets,
    byId,
    idleAssets,
    defaultIdle: byId.get(manifest.defaultIdleId)!,
    longWaitIdle,
  };
};

export type AvatarRegistry = ReturnType<typeof createAvatarRegistry>;
