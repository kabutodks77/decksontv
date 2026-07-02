import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, X } from "lucide-react";

export type VideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
};

export function VideoPlayer({ src, title, poster, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setLoading(true);

    const isHls = /\.m3u8($|\?)/i.test(src);
    let hls: Hls | null = null;

    const onReady = () => setLoading(false);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onReady);

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
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onReady);
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-4 py-3 backdrop-blur">
          <h3 className="truncate pr-4 text-sm font-semibold">{title ?? "Reproduzindo"}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar player"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            poster={poster}
            controls
            playsInline
            className="h-full w-full"
          />
          {loading && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="max-w-md text-sm text-foreground/90">{error}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Dica: navegadores bloqueiam streams HTTP em páginas HTTPS. Use um servidor HTTPS ou abra o app localmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
