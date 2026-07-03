import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Server, User, Shield } from "lucide-react";
import { getCreds, clearCreds } from "@/lib/xtream";
import { useEffect, useState } from "react";
import type { XtreamCreds } from "@/lib/xtream";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — CINEFLIXPAYMENT" },
      { name: "description", content: "Gerencie sua conexão e credenciais do CINEFLIXPAYMENT." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [creds, setCreds] = useState<XtreamCreds | null>(null);

  useEffect(() => {
    const c = getCreds();
    if (!c) {
      navigate({ to: "/" });
      return;
    }
    setCreds(c);
  }, [navigate]);

  const logout = () => {
    clearCreds();
    localStorage.removeItem("cfp_user");
    navigate({ to: "/" });
  };

  if (!creds) return null;

  return (
    <div className="min-h-screen px-4 py-8 lg:px-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>

      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Server className="h-4 w-4 text-primary" /> Servidor
          </div>
          <p className="break-all text-sm text-muted-foreground">{creds.url}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-primary" /> Conta
          </div>
          <p className="text-sm text-muted-foreground">
            {creds.mac ? `MAC: ${creds.mac}` : `Usuário: ${creds.username ?? "—"}`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" /> Sessão
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Suas credenciais ficam salvas apenas neste dispositivo.
          </p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
