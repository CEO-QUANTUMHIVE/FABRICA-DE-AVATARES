import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IdleSequencer } from "./idleSequencer";
import { precacheAvatarAssets } from "./precache";
import { createAvatarRegistry } from "./registry";
import type {
  AvatarManifest,
  AvatarRuntimeEvent,
  ResolvedAvatarAsset,
} from "./types";

export interface UseAvatarRuntimeOptions {
  manifest: AvatarManifest;
  enabled?: boolean;
  inactivityMs?: number;
  onEvent?: (event: AvatarRuntimeEvent) => void;
}

export const useAvatarRuntime = ({
  manifest,
  enabled = true,
  inactivityMs = 14_000,
  onEvent,
}: UseAvatarRuntimeOptions) => {
  const registry = useMemo(() => createAvatarRegistry(manifest), [manifest]);
  const emitRef = useRef(onEvent);
  emitRef.current = onEvent;
  const sequencer = useMemo(
    () =>
      new IdleSequencer(
        registry.idleAssets.map((asset) => asset.id),
        registry.defaultIdle.id,
        registry.longWaitIdle?.id,
      ),
    [registry],
  );

  const [idleAsset, setIdleAsset] = useState<ResolvedAvatarAsset>(
    registry.defaultIdle,
  );
  const [actionAsset, setActionAsset] = useState<ResolvedAvatarAsset | null>(null);
  const [playNonce, setPlayNonce] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const actionAssetRef = useRef<ResolvedAvatarAsset | null>(null);
  actionAssetRef.current = actionAsset;

  useEffect(() => {
    setIdleAsset(registry.defaultIdle);
    setActionAsset(null);
    setLastError(null);
  }, [registry]);

  useEffect(() => {
    let cancelled = false;
    void precacheAvatarAssets(registry.assets).then((result) => {
      if (!cancelled) {
        emitRef.current?.({
          type: "precache_finished",
          loaded: result.loaded.length,
          failed: result.failed.length,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [registry]);

  const advanceIdle = useCallback(() => {
    if (actionAssetRef.current) return;
    const nextId = sequencer.next();
    const nextAsset = registry.byId.get(nextId) ?? registry.defaultIdle;
    setIdleAsset(nextAsset);
    emitRef.current?.({ type: "idle_changed", assetId: nextAsset.id });
  }, [registry, sequencer]);

  useEffect(() => {
    if (!enabled || actionAsset) return;
    let timer = window.setTimeout(advanceIdle, inactivityMs);
    const reschedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(advanceIdle, inactivityMs);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((eventName) =>
      window.addEventListener(eventName, reschedule, { passive: true }),
    );
    return () => {
      window.clearTimeout(timer);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, reschedule),
      );
    };
  }, [actionAsset, advanceIdle, enabled, inactivityMs]);

  const play = useCallback(
    (assetId: string, origin: "chip" | "api" | "system" = "api") => {
      const asset = registry.byId.get(assetId);
      if (!asset) {
        const message = `Unknown avatar asset: ${assetId}`;
        setLastError(message);
        emitRef.current?.({ type: "asset_error", assetId, message });
        return false;
      }

      if (asset.kind === "idle") {
        setIdleAsset(asset);
        setActionAsset(null);
        emitRef.current?.({ type: "idle_changed", assetId });
        return true;
      }

      setLastError(null);
      setActionAsset(asset);
      setPlayNonce((value) => value + 1);
      emitRef.current?.({ type: "clip_started", assetId, origin });
      return true;
    },
    [registry],
  );

  const finishAction = useCallback(() => {
    setActionAsset((current) => {
      if (current) {
        emitRef.current?.({ type: "clip_finished", assetId: current.id });
      }
      return null;
    });
  }, []);

  const reportAssetError = useCallback((assetId: string) => {
    const message = `No se pudo reproducir ${assetId}`;
    setLastError(message);
    emitRef.current?.({ type: "asset_error", assetId, message });
    if (actionAssetRef.current?.id === assetId) {
      setActionAsset(null);
    } else {
      advanceIdle();
    }
  }, [advanceIdle]);

  return {
    registry,
    idleAsset,
    actionAsset,
    playNonce,
    lastError,
    status: actionAsset ? ("playing" as const) : ("idle" as const),
    play,
    finishAction,
    advanceIdle,
    reportAssetError,
  };
};

export type AvatarRuntimeController = ReturnType<typeof useAvatarRuntime>;
