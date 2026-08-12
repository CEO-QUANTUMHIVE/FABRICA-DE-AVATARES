import type { AvatarAssetDefinition, AvatarManifest } from "../avatar";

const defaultPrototypeBaseUrl =
  "https://motor-avatares-video-test-854335368640.us-central1.run.app/avatar-videos/sol/v1";

const baseUrl =
  import.meta.env.VITE_AVATAR_ASSET_BASE_URL?.trim() || defaultPrototypeBaseUrl;

const asset = (
  id: string,
  kind: AvatarAssetDefinition["kind"],
  priority: AvatarAssetDefinition["priority"] = "lazy",
  muted = kind === "idle" || kind === "look",
): AvatarAssetDefinition => ({
  id,
  kind,
  priority,
  muted,
  url: `${id}.webm`,
});

export const demoAvatarManifest: AvatarManifest = {
  schemaVersion: 1,
  avatarId: "sol",
  version: "v1",
  baseUrl,
  defaultIdleId: "connector_idle_cut_1",
  longWaitIdleId: "connector_idle_cut_wait",
  assets: [
    asset("connector_idle_cut_1", "idle", "critical"),
    asset("connector_idle_cut_hair", "idle", "eager"),
    asset("connector_idle_cut_3", "idle", "eager"),
    asset("connector_idle_cut_4", "idle", "lazy"),
    asset("connector_idle_cut_6", "idle", "lazy"),
    asset("connector_idle_cut_wait", "idle", "lazy"),
    asset("connector_welcome_cut", "welcome", "critical", false),
    asset("connector_farewell_cut", "farewell", "lazy", false),
    asset("connector_look_left_cut", "look", "critical"),
    asset("connector_look_right_cut", "look", "critical"),
    asset("connector_taking_order_cut", "taking_order", "eager", false),
    asset("connector_live_invite_cut", "live_invite", "eager", false),
  ],
};
