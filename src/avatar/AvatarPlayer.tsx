import type { AvatarRuntimeController } from "./useAvatarRuntime";

interface AvatarPlayerProps {
  runtime: AvatarRuntimeController;
  compact?: boolean;
  label?: string;
}

export const AvatarPlayer = ({
  runtime,
  compact = false,
  label = "Avatar QuantumHive",
}: AvatarPlayerProps) => {
  const { idleAsset, actionAsset } = runtime;

  return (
    <div
      className={`avatar-player ${compact ? "avatar-player--compact" : ""}`}
      data-state={runtime.status}
      aria-label={label}
    >
      <div className="avatar-player__halo" />
      <div className="avatar-player__fallback" aria-hidden="true">
        <span>QH</span>
      </div>
      <video
        key={idleAsset.id}
        className="avatar-player__video avatar-player__video--idle"
        src={idleAsset.resolvedUrl}
        poster={idleAsset.resolvedPosterUrl}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        onEnded={runtime.advanceIdle}
        onError={() => runtime.reportAssetError(idleAsset.id)}
      />
      {actionAsset && (
        <video
          key={`${actionAsset.id}-${runtime.playNonce}`}
          className="avatar-player__video avatar-player__video--action"
          src={actionAsset.resolvedUrl}
          poster={actionAsset.resolvedPosterUrl}
          muted={actionAsset.muted ?? false}
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          onEnded={runtime.finishAction}
          onError={() => runtime.reportAssetError(actionAsset.id)}
        />
      )}
      <span className="avatar-player__status">
        {runtime.status === "playing" ? "reaccionando" : "presente"}
      </span>
    </div>
  );
};
