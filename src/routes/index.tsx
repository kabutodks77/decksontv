import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, User, Lock, Play, Loader2, AlertCircle } from "lucide-react";
import logoAsset from "@/assets/cineflix-logo.jpg.asset.json";
import { authenticate, saveCreds } from "@/lib/xtream";

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
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const creds = { url: server, username, password };
      await authenticate(creds);
      saveCreds(creds);
      localStorage.setItem("cfp_user", username);
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar";
      setError(
        /Failed to fetch|NetworkError|HTTP 0/i.test(msg)
          ? "Não foi possível conectar ao servidor. Verifique a URL e sua conexão (o servidor pode estar offline ou bloquear o navegador via CORS)."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.24 25 / 0.5), transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.24 25 / 0.4), transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoAsset.url}
            alt="CINEFLIXPAYMENT"
            className="w-full max-w-sm select-none drop-shadow-[0_0_30px_oklch(0.58_0.24_25/0.6)]"
            draggable={false}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h1 className="mb-1 text-center text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Faça login para acessar seu conteúdo
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              icon={<Globe className="h-4 w-4" />}
              label="Endereço do Servidor (URL)"
              type="url"
              placeholder="https://servidor.exemplo.com"
              value={server}
              onChange={setServer}
            />
            <Field
              icon={<User className="h-4 w-4" />}
              label="Usuário"
              type="text"
              placeholder="Seu usuário"
              value={username}
              onChange={setUsername}
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span className="text-foreground/90">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
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
            <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            Não tem uma conta? <span className="text-primary">Adquira seu plano aqui</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CINEFLIXPAYMENT. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}

function Field({
  icon, label, type, placeholder, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="group flex items-center gap-2 rounded-lg border border-border bg-input/50 px-3 py-2.5 transition-colors focus-within:border-primary focus-within:bg-input">
        <span className="text-muted-foreground group-focus-within:text-primary">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          required
        />
      </div>
    </label>
  );
}
