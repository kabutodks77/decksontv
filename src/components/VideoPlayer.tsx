import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, X, Rewind, FastForward, Maximize2, Scaling } from "lucide-react";

export type VideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
};

type ResizeMode = "contain" | "cover" | "fill";
const RESIZE_LABELS: Record<ResizeMode, string> = {
  contain: "Ajustar",
  cover: "Zoom",
  fill: "Preencher",
};
const RESIZE_ORDER: ResizeMode[] = ["contain", "cover", "fill"];

async function lockPortrait() {
  try {
    const orientation = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
    if (orientation?.lock) await orientation.lock("portrait");
  } catch {
    /* iOS Safari */
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
    else if (anyEl.webkitEnterFullscreen) await anyEl.webkitEnterFullscreen();
    else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen();
  } catch {
    /* user gesture required */
  }
}

export function VideoPlayer({ src, title, poster, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resize, setResize] = useState<ResizeMode>("contain");
  const [showModeToast, setShowModeToast] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setLoading(true);

    const isHls = /\.m3u8($|\?)/i.test(src);
    let hls: Hls | null = null;

    const onReady = async () => {
      setLoading(false);
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

    video.play().catch(() => {});

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

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + delta));
  };

  const cycleResize = () => {
    setResize((prev) => {
      const idx = RESIZE_ORDER.indexOf(prev);
      const next = RESIZE_ORDER[(idx + 1) % RESIZE_ORDER.length];
      setShowModeToast(true);
      window.setTimeout(() => setShowModeToast(false), 1200);
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration || v.currentTime + 5, v.currentTime + 5);
      else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
      else if (e.key === " ") { e.preventDefault(); if (v.paused) v.play(); else v.pause(); }
      else if (e.key === "Escape") onClose?.();
      else if (e.key === "z" || e.key === "Z") cycleResize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goFullscreen = async () => {
    if (containerRef.current) {
      await requestFullscreen(containerRef.current);
      await lockPortrait();
    }
  };

  const videoClass =
    resize === "fill"
      ? "h-full w-full object-fill"
      : resize === "cover"
        ? "h-full w-full object-cover"
        : "h-full w-full object-contain";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-black sm:h-auto sm:max-w-5xl sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/80 to-transparent px-4 py-3"
             style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
          <h3 className="truncate pr-4 text-sm font-semibold text-white">{title ?? "Reproduzindo"}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleResize}
              aria-label={`Modo de tela: ${RESIZE_LABELS[resize]}`}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Scaling className="h-3.5 w-3.5" />
              {RESIZE_LABELS[resize]}
            </button>
            <button
              onClick={goFullscreen}
              aria-label="Tela cheia"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar player"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative h-full w-full bg-black sm:aspect-video">
          <video
            ref={videoRef}
            poster={poster}
            controls
            playsInline
            {...({ "webkit-playsinline": "true" } as Record<string, string>)}
            className={videoClass}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 sm:px-12">
            <button
              onClick={() => skip(-5)}
              aria-label="Voltar 5 segundos"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-all hover:scale-105 hover:bg-red-600/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95"
            >
              <Rewind className="h-6 w-6" />
            </button>
            <button
              onClick={() => skip(5)}
              aria-label="Avançar 5 segundos"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-all hover:scale-105 hover:bg-red-600/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95"
            >
              <FastForward className="h-6 w-6" />
            </button>
          </div>

          {showModeToast && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              {RESIZE_LABELS[resize]}
            </div>
          )}

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
