import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { MediaItem } from "./media-library";

type Props = {
  current: MediaItem | null;
  isPlaying: boolean;
  blackout: boolean;
  onEnded?: () => void;
};

export type PlayerHandle = {
  container: HTMLDivElement | null;
  seekBy: (seconds: number) => void;
  restart: () => void;
};

/**
 * Fullscreen-capable media player with crossfade between videos & images.
 * Uses two stacked layers (A/B) and toggles opacity for seamless transitions.
 */
export const Player = forwardRef<PlayerHandle, Props>(function Player(
  { current, isPlaying, blackout, onEnded },
  handleRef,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [layer, setLayer] = useState<"A" | "B">("A");
  const [aMedia, setAMedia] = useState<MediaItem | null>(null);
  const [bMedia, setBMedia] = useState<MediaItem | null>(null);
  const lastIdRef = useRef<string | null>(null);

  const getActiveVideo = () => (layer === "A" ? videoARef.current : videoBRef.current);

  useImperativeHandle(handleRef, () => ({
    get container() { return containerRef.current; },
    seekBy(seconds: number) {
      const v = getActiveVideo();
      if (!v || !current || current.kind !== "video") return;
      const dur = isFinite(v.duration) ? v.duration : 0;
      const next = Math.max(0, Math.min(dur || v.currentTime + seconds, v.currentTime + seconds));
      v.currentTime = next;
    },
    restart() {
      const v = getActiveVideo();
      if (!v || !current || current.kind !== "video") return;
      try { v.currentTime = 0; } catch {}
    },
  }), [layer, current]);

  // Crossfade: when `current` changes, load it into the inactive layer then swap.
  useEffect(() => {
    if (!current) {
      setAMedia(null); setBMedia(null); lastIdRef.current = null; return;
    }
    if (current.id === lastIdRef.current) return;
    lastIdRef.current = current.id;
    if (layer === "A") { setBMedia(current); setLayer("B"); }
    else { setAMedia(current); setLayer("A"); }
  }, [current, layer]);

  // Reset video to start when a NEW media item loads (not on play/pause toggle).
  useEffect(() => {
    if (!current || current.kind !== "video") return;
    const active = layer === "A" ? videoARef.current : videoBRef.current;
    if (!active) return;
    try { active.currentTime = 0; } catch {}
  }, [current?.id, layer]);

  // Drive video playback for whichever layer is active.
  useEffect(() => {
    const active = layer === "A" ? videoARef.current : videoBRef.current;
    const inactive = layer === "A" ? videoBRef.current : videoARef.current;
    if (inactive) { try { inactive.pause(); } catch {} }
    if (!active || !current || current.kind !== "video") return;
    if (isPlaying) {
      active.play().catch(() => {});
    } else {
      active.pause();
    }
  }, [isPlaying, current, layer, aMedia, bMedia]);

  const renderLayer = (media: MediaItem | null, ref: React.RefObject<HTMLVideoElement | null>, isActive: boolean) => (
    <div
      className="absolute inset-0 media-fade"
      style={{ opacity: blackout ? 0 : isActive && media ? 1 : 0 }}
    >
      {media?.kind === "video" && (
        <video
          ref={ref}
          src={media.src}
          className="w-full h-full object-contain bg-black"
          playsInline
          onEnded={onEnded}
          preload="auto"
        />
      )}
      {media?.kind === "image" && (
        <img src={media.src} alt={media.name} className="w-full h-full object-contain bg-black" />
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-[color:var(--panel-border)] bg-black"
      style={{ boxShadow: "var(--shadow-inset-deep), 0 0 40px oklch(0 0 0 / 60%)" }}
    >
      {renderLayer(aMedia, videoARef, layer === "A")}
      {renderLayer(bMedia, videoBRef, layer === "B")}
      {(blackout || !current) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <span className="neon-text-cyan font-mono text-sm tracking-[0.3em]">
            {blackout ? "" : "● STANDBY"}
          </span>
        </div>
      )}
    </div>
  );
});
