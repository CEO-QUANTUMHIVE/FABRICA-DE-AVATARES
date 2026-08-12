export type AvatarAssetKind =
  | "idle"
  | "welcome"
  | "farewell"
  | "look"
  | "taking_order"
  | "live_invite"
  | "action";

export type AvatarAssetPriority = "critical" | "eager" | "lazy";

export interface AvatarAssetDefinition {
  id: string;
  url: string;
  kind: AvatarAssetKind;
  priority?: AvatarAssetPriority;
  muted?: boolean;
  posterUrl?: string;
  bytes?: number;
  sha256?: string;
}

export interface AvatarManifest {
  schemaVersion: 1;
  avatarId: string;
  version: string;
  baseUrl?: string;
  defaultIdleId: string;
  longWaitIdleId?: string;
  assets: AvatarAssetDefinition[];
}

export interface ResolvedAvatarAsset extends AvatarAssetDefinition {
  resolvedUrl: string;
  resolvedPosterUrl?: string;
}

export type AvatarRuntimeStatus = "idle" | "playing" | "error";

export type AvatarRuntimeEvent =
  | { type: "clip_started"; assetId: string; origin: "chip" | "api" | "system" }
  | { type: "clip_finished"; assetId: string }
  | { type: "idle_changed"; assetId: string }
  | { type: "asset_error"; assetId: string; message: string }
  | { type: "precache_finished"; loaded: number; failed: number };

export interface AvatarChipDefinition {
  id: string;
  label: string;
  clipId?: string;
  response?: string;
  targetId?: string;
  mode?: "guided" | "free_chat";
  next?: AvatarChipDefinition[];
}
