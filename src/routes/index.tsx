import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerHandle } from "@/components/Player";
import { ControlPanel } from "@/components/ControlPanel";
import { IMAGES, VIDEOS, type MediaItem } from "@/components/media-library";

export const Route = createFileRoute("/")({
  component: DJController,
  head: () => ({
    meta: [
      { title: "Neon Deck — DJ-Style Media Controller" },
      { name: "description", content: "Stage-ready DJ-style media controller with fullscreen video/image playback, crossfades, queue, and auto-trigger." },
    ],
  }),
});

function DJController() {
  const [mode, setMode] = useState<"video" | "image">("video");
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [autoSec, setAutoSec] = useState(8);
  const [autoOn, setAutoOn] = useState(false);
  const playerRef = useRef<PlayerHandle>(null);

  // Preload all media for instant playback
  useEffect(() => {
    VIDEOS.forEach((v) => { const el = document.createElement("video"); el.src = v.src; el.preload = "auto"; });
    IMAGES.forEach((i) => { const el = new Image(); el.src = i.src; });
  }, []);

  const select = useCallback((m: MediaItem) => {
    setBlackout(false);
    setMode(m.kind);
    setCurrent(m);
    setIsPlaying(m.kind === "video");
  }, []);

  const playNextFromQueue = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) { setIsPlaying(false); return q; }
      const [next, ...rest] = q;
      select(next);
      return rest;
    });
  }, [select]);

  const playPause = useCallback(() => {
    if (!current || current.kind !== "video") return;
    setIsPlaying((p) => !p);
  }, [current]);

  const stop = useCallback(() => { setIsPlaying(false); setCurrent(null); }, []);

  const fullscreen = useCallback(() => {
    const el = playerRef.current?.container;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  const seekBy = useCallback((s: number) => playerRef.current?.seekBy(s), []);

  // Slot selection by mode (supports any slot number, e.g. 1..99)
  const selectSlot = useCallback((slot: number) => {
    const list = mode === "video" ? VIDEOS : IMAGES;
    const item = list.find((m) => m.slot === slot);
    if (item) select(item);
  }, [mode, select]);

  // Buffer digits so quick "1" then "1" within 600ms triggers slot 11.
  const digitBufferRef = useRef<string>("");
  const digitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushDigits = useCallback(() => {
    const buf = digitBufferRef.current;
    digitBufferRef.current = "";
    if (digitTimerRef.current) { clearTimeout(digitTimerRef.current); digitTimerRef.current = null; }
    if (buf.length === 0) return;
    const slot = parseInt(buf, 10);
    if (!isNaN(slot)) selectSlot(slot);
  }, [selectSlot]);

  const pushDigit = useCallback((d: string) => {
    digitBufferRef.current += d;
    if (digitTimerRef.current) clearTimeout(digitTimerRef.current);
    // If 2 digits collected, fire immediately; otherwise wait briefly for a second digit.
    if (digitBufferRef.current.length >= 2) {
      flushDigits();
    } else {
      digitTimerRef.current = setTimeout(flushDigits, 350);
    }
  }, [flushDigits]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === "v") setMode("video");
      else if (k === "i") setMode("image");
      else if (/^[0-9]$/.test(k)) pushDigit(k);
      else if (e.code === "Space") { e.preventDefault(); playPause(); }
      else if (k === "f") fullscreen();
      else if (k === "b") setBlackout((b) => !b);
      else if (k === "arrowright" || k === "l") { e.preventDefault(); seekBy(10); }
      else if (k === "arrowleft" || k === "j") { e.preventDefault(); seekBy(-10); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pushDigit, playPause, fullscreen, seekBy]);

  // Auto-trigger advancing through queue
  useEffect(() => {
    if (!autoOn) return;
    const t = setInterval(() => {
      setQueue((q) => {
        if (q.length === 0) return q;
        const [next, ...rest] = q;
        select(next);
        return rest;
      });
    }, autoSec * 1000);
    return () => clearInterval(t);
  }, [autoOn, autoSec, select]);

  return (
    <div className="min-h-screen w-full text-foreground p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg console-surface flex items-center justify-center">
            <span className="neon-text-cyan font-black">◆</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest neon-text-cyan">NEON DECK</h1>
            <p className="text-[0.7rem] font-mono opacity-60 tracking-widest">DJ-STYLE MEDIA CONTROLLER</p>
          </div>
        </div>
        <div className="font-mono text-[0.7rem] opacity-50 tracking-widest hidden md:block">v1.0 · STAGE READY</div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3">
          <Player
            ref={playerRef}
            current={current}
            isPlaying={isPlaying}
            blackout={blackout}
            onEnded={playNextFromQueue}
          />
          <p className="mt-3 font-mono text-[0.7rem] opacity-50 tracking-widest text-center">
            CLICK FULLSCREEN OR PRESS [F] FOR STAGE OUTPUT
          </p>
        </section>
        <section className="lg:col-span-2">
          <ControlPanel
            videos={VIDEOS}
            images={IMAGES}
            mode={mode}
            current={current}
            isPlaying={isPlaying}
            blackout={blackout}
            queue={queue}
            autoTriggerSec={autoSec}
            isAutoOn={autoOn}
            onSelect={select}
            onSetMode={setMode}
            onPlayPause={playPause}
            onStop={stop}
            onBlackout={() => setBlackout((b) => !b)}
            onFullscreen={fullscreen}
            onEnqueue={(m) => setQueue((q) => [...q, m])}
            onClearQueue={() => setQueue([])}
            onToggleAuto={() => setAutoOn((a) => !a)}
            onChangeAutoSec={setAutoSec}
            onSeek={seekBy}
          />
        </section>
      </main>
    </div>
  );
}
