import { createFileRoute, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { Tv, Clapperboard, Layers, LogOut, Settings, Menu, X, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/cineflix-logo.jpg.asset.json";
import {
  getCreds,
  clearCreds,
  getLiveCategories,
  getVodCategories,
  getSeriesCategories,
  type XtreamCategory,
} from "@/lib/xtream";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — CINEFLIXPAYMENT" },
      { name: "description", content: "Acesse Canais ao Vivo, Filmes e Séries no CINEFLIXPAYMENT." },
    ],
  }),
  component: Dashboard,
});

type Cats = {
  live: XtreamCategory[];
  vod: XtreamCategory[];
  series: XtreamCategory[];
};

function Dashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Cats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const user = typeof window !== "undefined" ? localStorage.getItem("cfp_user") ?? "Usuário" : "Usuário";

  useEffect(() => {
    const creds = getCreds();
    if (!creds) {
      navigate({ to: "/" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [live, vod, series] = await Promise.all([
          getLiveCategories(creds),
          getVodCategories(creds),
          getSeriesCategories(creds),
        ]);
        if (!cancelled) setCats({ live: live ?? [], vod: vod ?? [], series: series ?? [] });
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Erro ao carregar categorias");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const doLogout = () => {
    clearCreds();
    localStorage.removeItem("cfp_user");
    navigate({ to: "/" });
  };

  const cards = [
    { title: "Canais ao Vivo", desc: "Transmissões em tempo real", Icon: Tv, count: cats?.live.length, type: "live" },
    { title: "Filmes (VOD)", desc: "Catálogo completo on-demand", Icon: Clapperboard, count: cats?.vod.length, type: "vod" },
    { title: "Séries", desc: "Episódios e temporadas", Icon: Layers, count: cats?.series.length, type: "series" },
  ];

  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none fixed -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.24 25 / 0.5), transparent 70%)" }} />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center justify-between">
            <img src={logoAsset.url} alt="CINEFLIXPAYMENT" className="h-8 w-auto" />
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarLink to="/browse/$type" params={{ type: "live" }} icon={<Tv className="h-4 w-4" />} label="Canais ao Vivo" onNavigate={() => setOpen(false)} />
            <SidebarLink to="/browse/$type" params={{ type: "vod" }} icon={<Clapperboard className="h-4 w-4" />} label="Filmes" onNavigate={() => setOpen(false)} />
            <SidebarLink to="/browse/$type" params={{ type: "series" }} icon={<Layers className="h-4 w-4" />} label="Séries" onNavigate={() => setOpen(false)} />
            <SidebarLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Configurações" onNavigate={() => setOpen(false)} />
          </nav>

          <button
            onClick={() => setConfirmLogout(true)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <main className="relative flex-1">
        <header className="flex items-center gap-3 border-b border-border/60 bg-background/40 px-4 py-4 backdrop-blur-md lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6" />
          </button>
          <img src={logoAsset.url} alt="CINEFLIXPAYMENT" className="h-8 w-auto lg:hidden" />
          <div className="hidden lg:block">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vindo de volta</p>
            <h1 className="text-xl font-bold">Olá, {user} 👋</h1>
          </div>
        </header>

        <section className="px-4 py-8 lg:px-10">
          <div className="mb-8 lg:hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vindo de volta</p>
            <h1 className="text-2xl font-bold">Olá, {user} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">O que vamos assistir hoje?</p>
          </div>
          <div className="mb-6 hidden lg:block">
            <p className="text-sm text-muted-foreground">O que vamos assistir hoje?</p>
          </div>

          {loadError && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>Não foi possível carregar categorias: {loadError}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ title, desc, Icon, count, type }) => (
              <Link
                key={title}
                to="/browse/$type"
                params={{ type }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 text-left transition-all hover:-translate-y-1 hover:border-primary/60 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-700/5 opacity-60 transition-opacity group-hover:opacity-100" />
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
                  style={{ background: "oklch(0.58 0.24 25 / 0.35)" }} />

                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {cats == null && !loadError ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Carregando...</>
                      ) : (
                        <>{count ?? 0} categorias</>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Acessar
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold">Sair da conta?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Você precisará informar suas credenciais novamente para voltar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/60"
              >
                Cancelar
              </button>
              <button
                onClick={doLogout}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({
  to,
  params,
  icon,
  label,
  onNavigate,
}: {
  to: string;
  params?: Record<string, string>;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resolved = params
    ? Object.entries(params).reduce((p, [k, v]) => p.replace(`$${k}`, v), to)
    : to;
  const active = pathname === resolved;
  return (
    <Link
      // @ts-expect-error dynamic to
      to={to}
      // @ts-expect-error dynamic params
      params={params}
      onClick={onNavigate}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
