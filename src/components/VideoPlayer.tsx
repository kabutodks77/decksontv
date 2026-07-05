import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, X, Rewind, FastForward, Maximize2 } from "lucide-react";

export type VideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
};

// Force portrait orientation on the player (Android/Chrome). Ignored on iOS.
async function lockPortrait() {
  try {
    const orientation = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
    if (orientation?.lock) await orientation.lock("portrait");
  } catch {
    /* not supported (iOS Safari) */
  }
}

function unlockOrientation() {
  try {
    const orientation = (screen as unknown as { orientation?: { unlock?: () => void } }).orientation;
    orientation?.unlock?.();
  } catch {
    /* noop */
  }
}

async function requestFullscreen(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    webkitEnterFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  try {
    if (anyEl.requestFullscreen) await anyEl.requestFullscreen();
    else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
    else if (anyEl.webkitEnterFullscreen) await anyEl.webkitEnterFullscreen(); // iOS video
    else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen();
  } catch {
    /* user gesture may be required */
  }
}

export function VideoPlayer({ src, title, poster, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setLoading(true);

    const isHls = /\.m3u8($|\?)/i.test(src);
    let hls: Hls | null = null;

    const onReady = async () => {
      setLoading(false);
      // Auto go fullscreen landscape on first playback
      if (containerRef.current) {
        await requestFullscreen(containerRef.current);
        await lockPortrait();
      }
    };
    video.addEventListener("playing", onReady, { once: true });
    video.addEventListener("loadeddata", () => setLoading(false));

    if (isHls && !video.canPlayType("application/vnd.apple.mpegurl") && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError("Falha ao carregar o stream. Verifique a conexão ou o servidor.");
      });
    } else {
      video.src = src;
    }

    video.play().catch(() => {
      /* autoplay may be blocked; user can press play */
    });

    return () => {
      video.removeEventListener("playing", onReady);
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
      unlockOrientation();
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };
      if (document.fullscreenElement) doc.exitFullscreen?.().catch(() => {});
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
    };
  }, [src]);

  // Keyboard shortcuts: ← / → skip 5s, space toggles play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.key === "ArrowRight") { v.currentTime = Math.min(v.duration || v.currentTime + 5, v.currentTime + 5); }
      else if (e.key === "ArrowLeft") { v.currentTime = Math.max(0, v.currentTime - 5); }
      else if (e.key === " ") { e.preventDefault(); if (v.paused) v.play(); else v.pause(); }
      else if (e.key === "Escape") { onClose?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || Infinity), v.currentTime + delta));
  };

  const goFullscreen = async () => {
    if (containerRef.current) {
      await requestFullscreen(containerRef.current);
      await lockPortrait();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 sm:p-4 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="relative w-full h-full sm:h-auto sm:max-w-5xl overflow-hidden sm:rounded-2xl border-0 sm:border sm:border-border bg-black shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
          <h3 className="truncate pr-4 text-sm font-semibold text-white">{title ?? "Reproduzindo"}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goFullscreen}
              aria-label="Tela cheia"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar player"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="relative h-full w-full sm:aspect-video bg-black">
          <video
            ref={videoRef}
            poster={poster}
            controls
            playsInline
            {...({ "webkit-playsinline": "true" } as Record<string, string>)}
            className="h-full w-full object-contain"
          />
          {/* ±5s skip buttons overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 sm:px-12">
            <button
              onClick={() => skip(-5)}
              aria-label="Voltar 5 segundos"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-all hover:scale-105 hover:bg-red-600/80 focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95"
            >
              <Rewind className="h-6 w-6" />
            </button>
            <button
              onClick={() => skip(5)}
              aria-label="Avançar 5 segundos"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-all hover:scale-105 hover:bg-red-600/80 focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95"
            >
              <FastForward className="h-6 w-6" />
            </button>
          </div>
          {loading && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-10 w-10 animate-spin text-red-500" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="max-w-md text-sm text-white/90">{error}</p>
              <p className="max-w-md text-xs text-white/60">
                Dica: navegadores bloqueiam streams HTTP em páginas HTTPS. Use um servidor HTTPS ou abra o app localmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
