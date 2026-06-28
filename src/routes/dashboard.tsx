import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Tv, Clapperboard, Layers, LogOut, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/cineflix-logo.jpg.asset.json";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — CINEFLIXPAYMENT" },
      { name: "description", content: "Acesse Canais ao Vivo, Filmes e Séries no CINEFLIXPAYMENT." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = typeof window !== "undefined" ? localStorage.getItem("cfp_user") ?? "Usuário" : "Usuário";

  const logout = () => {
    localStorage.removeItem("cfp_user");
    navigate({ to: "/" });
  };

  const cards = [
    { title: "Canais ao Vivo", desc: "Transmissões em tempo real", Icon: Tv, accent: "from-red-500/30 to-red-700/10" },
    { title: "Filmes (VOD)", desc: "Catálogo completo on-demand", Icon: Clapperboard, accent: "from-red-500/30 to-red-700/10" },
    { title: "Séries", desc: "Episódios e temporadas", Icon: Layers, accent: "from-red-500/30 to-red-700/10" },
  ];

  return (
    <div className="relative flex min-h-screen">
      {/* ambient */}
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
            <SidebarItem icon={<Tv className="h-4 w-4" />} label="Canais ao Vivo" active />
            <SidebarItem icon={<Clapperboard className="h-4 w-4" />} label="Filmes" />
            <SidebarItem icon={<Layers className="h-4 w-4" />} label="Séries" />
            <SidebarItem icon={<Settings className="h-4 w-4" />} label="Configurações" />
          </nav>

          <button
            onClick={logout}
            className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair / Voltar ao login
          </button>
        </div>
      </aside>

      {/* overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <main className="relative flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-background/40 px-4 py-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu className="h-6 w-6" />
            </button>
            <img src={logoAsset.url} alt="CINEFLIXPAYMENT" className="h-8 w-auto lg:hidden" />
            <div className="hidden lg:block">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vindo de volta</p>
              <h1 className="text-xl font-bold">Olá, {user} 👋</h1>
            </div>
          </div>
          <Link
            to="/"
            onClick={() => localStorage.removeItem("cfp_user")}
            className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground sm:flex"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ title, desc, Icon, accent }) => (
              <button
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 text-left transition-all hover:-translate-y-1 hover:border-primary/60"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 transition-opacity group-hover:opacity-100`} />
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity"
                  style={{ background: "oklch(0.58 0.24 25 / 0.35)" }} />

                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Acessar
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
