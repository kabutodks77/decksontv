import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, User, Lock, Play, Loader2, AlertCircle, Cpu, ShieldCheck, Tv, Smartphone, Monitor } from "lucide-react";
import logoAsset from "@/assets/cineflix-logo.jpg.asset.json";
import { authenticate, saveCreds, getCreds } from "@/lib/xtream";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CINEFLIXPAYMENT — Entre e Assista" },
      { name: "description", content: "Acesse sua conta CINEFLIXPAYMENT e comece a assistir agora." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"user" | "mac">("user");
  const [name, setName] = useState("");
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mac, setMac] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se já existe sessão salva, entra direto — não desloga sozinho.
  useEffect(() => {
    const c = getCreds();
    if (c) navigate({ to: "/dashboard" });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const creds =
        mode === "mac"
          ? { url: server.trim(), mac: mac.trim() }
          : { url: server.trim(), username: username.trim(), password };
      await authenticate(creds);
      saveCreds(creds);
      const displayName = name.trim() || (mode === "mac" ? mac.trim() : username.trim());
      localStorage.setItem("cfp_user", displayName);
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar";
      setError(
        /Failed to fetch|NetworkError|HTTP 0/i.test(msg)
          ? "Não foi possível conectar ao servidor. Verifique a URL e sua conexão."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Cinematic ambient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, oklch(0.55 0.24 25 / 0.35), transparent 55%), radial-gradient(ellipse at 90% 90%, oklch(0.5 0.22 20 / 0.28), transparent 55%), linear-gradient(180deg, oklch(0.08 0.02 20) 0%, oklch(0.05 0.005 20) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(oklch(1 0 0) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[1.05fr_minmax(0,520px)] lg:gap-16 lg:px-16 lg:py-14 xl:grid-cols-[1.2fr_minmax(0,560px)] 2xl:px-24">
        {/* Hero side (desktop / TV) */}
        <aside className="relative hidden flex-col justify-between lg:flex">
          <div>
            <img
              src={logoAsset.url}
              alt="CINEFLIXPAYMENT"
              className="h-14 w-auto drop-shadow-[0_0_30px_oklch(0.58_0.24_25/0.6)]"
              draggable={false}
            />
          </div>

          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
              Cinema · Séries · Ao Vivo
            </p>
            <h2 className="font-display text-6xl leading-[0.95] tracking-tight text-foreground xl:text-7xl">
              Seu universo de<br />
              <span className="bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">entretenimento</span> agora
            </h2>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Uma única conta para assistir em qualquer lugar — Smart TV, Android, iPhone, Tablet e Web. Qualidade 4K quando disponível, sem travamentos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge icon={<Tv className="h-4 w-4" />} label="Smart TV" />
              <Badge icon={<Smartphone className="h-4 w-4" />} label="Android / iPhone" />
              <Badge icon={<Monitor className="h-4 w-4" />} label="Web / Tablet" />
              <Badge icon={<ShieldCheck className="h-4 w-4" />} label="Conexão segura" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CINEFLIXPAYMENT. Todos os direitos reservados.
          </p>
        </aside>

        {/* Form side */}
        <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-0 lg:py-0">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-6 flex justify-center lg:hidden">
              <img
                src={logoAsset.url}
                alt="CINEFLIXPAYMENT"
                className="h-16 w-auto drop-shadow-[0_0_25px_oklch(0.58_0.24_25/0.55)]"
                draggable={false}
              />
            </div>

            <div
              className="rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-2xl sm:p-8"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h1 className="mb-1 text-center font-display text-3xl tracking-tight sm:text-4xl">
                Entre e assista
              </h1>
              <p className="mb-7 text-center text-sm text-muted-foreground">
                Informe seus dados de acesso para começar
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                {/* Mode toggle */}
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-input/40 p-1">
                  <ModeButton active={mode === "user"} onClick={() => setMode("user")}>
                    Usuário e Senha
                  </ModeButton>
                  <ModeButton active={mode === "mac"} onClick={() => setMode("mac")}>
                    Endereço MAC
                  </ModeButton>
                </div>

                <Field
                  icon={<User className="h-5 w-5" />}
                  label="Seu Nome"
                  type="text"
                  placeholder="Como devemos te chamar?"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />

                <Field
                  icon={<Globe className="h-5 w-5" />}
                  label="Endereço do Servidor"
                  type="url"
                  placeholder="https://servidor.exemplo.com"
                  value={server}
                  onChange={setServer}
                  autoComplete="url"
                  inputMode="url"
                />

                {mode === "user" ? (
                  <>
                    <Field
                      icon={<User className="h-5 w-5" />}
                      label="Usuário"
                      type="text"
                      placeholder="Seu usuário"
                      value={username}
                      onChange={setUsername}
                      autoComplete="username"
                    />
                    <Field
                      icon={<Lock className="h-5 w-5" />}
                      label="Senha"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                    />
                  </>
                ) : (
                  <Field
                    icon={<Cpu className="h-5 w-5" />}
                    label="Endereço MAC"
                    type="text"
                    placeholder="00:1A:79:XX:XX:XX"
                    value={mac}
                    onChange={setMac}
                    autoComplete="off"
                  />
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-foreground/90">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex min-h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-base font-bold uppercase tracking-wide text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Conectando...</>
                  ) : (
                    <><Play className="h-5 w-5 fill-current" />Entrar e Assistir</>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                className="mt-4 min-h-[48px] w-full rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Não tem uma conta? <span className="text-primary">Adquira seu plano</span>
              </button>
            </div>

            <p className="mt-6 text-center text-[11px] text-muted-foreground lg:hidden">
              © {new Date().getFullYear()} CINEFLIXPAYMENT
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-lg px-3 text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}

function Field({
  icon, label, type, placeholder, value, onChange, autoComplete, inputMode,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  inputMode?: "url" | "text" | "email" | "numeric" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="group flex min-h-[52px] items-center gap-2.5 rounded-xl border border-border bg-input/50 px-3.5 transition-colors focus-within:border-primary focus-within:bg-input focus-within:ring-2 focus-within:ring-primary/40">
        <span className="text-muted-foreground group-focus-within:text-primary">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className="w-full bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          required
        />
      </div>
    </label>
  );
}
