import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, Play, Search, Tv, Clapperboard, Layers } from "lucide-react";
import {
  getCreds,
  getLiveCategories,
  getVodCategories,
  getSeriesCategories,
  getLiveStreams,
  getVodStreams,
  getSeries,
  getSeriesInfo,
  buildStreamUrl,
  type XtreamCategory,
  type XtreamStream,
  type XtreamSeriesInfo,
  type XtreamCreds,
} from "@/lib/xtream";
import { VideoPlayer } from "@/components/VideoPlayer";

type BrowseType = "live" | "vod" | "series";

const META: Record<BrowseType, { title: string; icon: typeof Tv; label: string }> = {
  live: { title: "Canais ao Vivo", icon: Tv, label: "canais" },
  vod: { title: "Filmes (VOD)", icon: Clapperboard, label: "filmes" },
  series: { title: "Séries", icon: Layers, label: "séries" },
};

export const Route = createFileRoute("/browse/$type")({
  head: ({ params }) => ({
    meta: [
      { title: `${META[(params.type as BrowseType) in META ? (params.type as BrowseType) : "live"].title} — CINEFLIXPAYMENT` },
      { name: "description", content: "Navegue pelo catálogo do CINEFLIXPAYMENT." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { type } = Route.useParams();
  const navigate = useNavigate();
  const kind = (["live", "vod", "series"].includes(type) ? type : "live") as BrowseType;
  const meta = META[kind];
  const Icon = meta.icon;

  const [creds, setCreds] = useState<XtreamCreds | null>(null);
  const [categories, setCategories] = useState<XtreamCategory[] | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [streams, setStreams] = useState<XtreamStream[] | null>(null);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Series episode selector
  const [seriesInfo, setSeriesInfo] = useState<XtreamSeriesInfo | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [openSeriesId, setOpenSeriesId] = useState<string | number | null>(null);

  // Player
  const [player, setPlayer] = useState<{ src: string; title: string; poster?: string } | null>(null);

  useEffect(() => {
    const c = getCreds();
    if (!c) {
      navigate({ to: "/" });
      return;
    }
    setCreds(c);
  }, [navigate]);

  useEffect(() => {
    if (!creds) return;
    let cancelled = false;
    setError(null);
    setCategories(null);
    setSelectedCat(null);
    setStreams(null);
    (async () => {
      try {
        const fn = kind === "live" ? getLiveCategories : kind === "vod" ? getVodCategories : getSeriesCategories;
        const list = await fn(creds);
        if (!cancelled) setCategories(list ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar categorias");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creds, kind]);

  const openCategory = async (cat: XtreamCategory) => {
    if (!creds) return;
    setSelectedCat(cat.category_id);
    setStreams(null);
    setLoadingStreams(true);
    setError(null);
    setQuery("");
    try {
      const fn = kind === "live" ? getLiveStreams : kind === "vod" ? getVodStreams : getSeries;
      const list = await fn(creds, cat.category_id);
      setStreams(list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar itens");
    } finally {
      setLoadingStreams(false);
    }
  };

  const playStream = (s: XtreamStream) => {
    if (!creds) return;
    if (kind === "live" && s.stream_id != null) {
      setPlayer({
        src: buildStreamUrl(creds, "live", s.stream_id),
        title: s.name,
        poster: s.stream_icon,
      });
    } else if (kind === "vod" && s.stream_id != null) {
      setPlayer({
        src: buildStreamUrl(creds, "movie", s.stream_id, s.container_extension),
        title: s.name,
        poster: s.stream_icon ?? s.cover,
      });
    } else if (kind === "series" && s.series_id != null) {
      openSeries(s.series_id, s.name);
    }
  };

  const openSeries = async (seriesId: string | number, name: string) => {
    if (!creds) return;
    setOpenSeriesId(seriesId);
    setSeriesInfo(null);
    setSeriesLoading(true);
    try {
      const info = await getSeriesInfo(creds, seriesId);
      setSeriesInfo({ ...info, info: { ...(info.info ?? {}), name: info.info?.name ?? name } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar série");
      setOpenSeriesId(null);
    } finally {
      setSeriesLoading(false);
    }
  };

  const filteredStreams = useMemo(() => {
    if (!streams) return null;
    if (!query.trim()) return streams;
    const q = query.toLowerCase();
    return streams.filter((s) => s.name.toLowerCase().includes(q));
  }, [streams, query]);

  const currentCategory = categories?.find((c) => c.category_id === selectedCat);

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.24 25 / 0.5), transparent 70%)" }}
      />

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/70 px-4 py-4 backdrop-blur-md lg:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
        <div
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{meta.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {currentCategory ? currentCategory.category_name : `${categories?.length ?? 0} categorias`}
          </p>
        </div>
        {selectedCat && streams && (
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-56 rounded-lg border border-border bg-input/50 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </header>

      <main className="px-4 py-6 lg:px-10">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {!selectedCat && (
          <>
            {categories == null && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando categorias...
              </div>
            )}
            {categories && categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma categoria disponível.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories?.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => openCategory(cat)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60"
                >
                  <span className="min-w-0 truncate text-sm font-semibold">{cat.category_name}</span>
                  <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedCat && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedCat(null);
                  setStreams(null);
                  setQuery("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Categorias
              </button>
              <span className="text-xs text-muted-foreground">
                {filteredStreams?.length ?? 0} {meta.label}
              </span>
            </div>

            {/* Mobile search */}
            <div className="mb-4 sm:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-border bg-input/50 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {loadingStreams && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando {meta.label}...
              </div>
            )}

            {!loadingStreams && filteredStreams && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredStreams.map((s, i) => {
                  const key = `${s.stream_id ?? s.series_id ?? i}-${s.name}`;
                  const cover = s.stream_icon ?? s.cover;
                  return (
                    <button
                      key={key}
                      onClick={() => playStream(s)}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card/60 text-left transition-all hover:-translate-y-1 hover:border-primary/60"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={s.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full"
                            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                          >
                            <Play className="h-5 w-5 fill-current text-primary-foreground" />
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-xs font-semibold">{s.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Series episodes modal */}
      {openSeriesId != null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <h3 className="truncate pr-4 font-semibold">
                {seriesInfo?.info?.name ?? "Carregando..."}
              </h3>
              <button
                onClick={() => {
                  setOpenSeriesId(null);
                  setSeriesInfo(null);
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {seriesLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando episódios...
                </div>
              )}
              {seriesInfo?.episodes &&
                Object.entries(seriesInfo.episodes).map(([season, eps]) => (
                  <div key={season} className="mb-5">
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Temporada {season}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {eps.map((ep) => (
                        <button
                          key={String(ep.id)}
                          onClick={() => {
                            if (!creds) return;
                            setPlayer({
                              src: buildStreamUrl(creds, "series", ep.id, ep.container_extension),
                              title: `${seriesInfo.info?.name ?? ""} — ${ep.title}`,
                              poster: ep.info?.movie_image,
                            });
                          }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/60"
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Play className="h-4 w-4 fill-current text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{ep.title}</p>
                            {ep.episode_num != null && (
                              <p className="text-xs text-muted-foreground">Episódio {ep.episode_num}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {player && (
        <VideoPlayer
          src={player.src}
          title={player.title}
          poster={player.poster}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  );
}
