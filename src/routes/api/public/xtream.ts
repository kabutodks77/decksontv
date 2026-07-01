import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

function normalizeUrl(url: string) {
  let u = url.trim();
  // Add protocol if missing
  if (!/^https?:\/\//i.test(u)) u = "http://" + u;
  // Strip query string / hash the user may have pasted
  u = u.split("#")[0].split("?")[0];
  // Strip any Xtream endpoint the user may have included
  u = u.replace(/\/(player_api|panel_api|xmltv|get)\.php.*$/i, "");
  // Strip our own local proxy prefix if the user pasted it back
  u = u.replace(/\/api\/public\/xtream\/?$/i, "");
  u = u.replace(/\/api\/public\/?$/i, "");
  // Remove trailing slashes
  return u.replace(/\/+$/, "");
}

async function handleProxy(request: Request): Promise<Response> {
  try {
    let url: string | null;
    let username: string | null;
    let password: string | null;
    let action: string | null = null;
    const extra: Record<string, string> = {};

    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, string | undefined>;
      url = body.url ?? null;
      username = body.username ?? null;
      password = body.password ?? null;
      action = body.action ?? null;
      for (const [k, v] of Object.entries(body)) {
        if (["url", "username", "password", "action"].includes(k)) continue;
        if (typeof v === "string") extra[k] = v;
      }
    } else {
      const sp = new URL(request.url).searchParams;
      url = sp.get("url");
      username = sp.get("username");
      password = sp.get("password");
      action = sp.get("action");
      sp.forEach((v, k) => {
        if (!["url", "username", "password", "action"].includes(k)) extra[k] = v;
      });
    }

    if (!url || !username || !password) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios: url, username, password" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS } },
      );
    }

    const base = normalizeUrl(url);
    const params = new URLSearchParams({ username, password, ...extra });
    if (action) params.set("action", action);
    const target = `${base}/player_api.php?${params.toString()}`;

    const upstream = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "CineflixPayment/1.0" },
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        ...CORS,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no proxy";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export const Route = createFileRoute("/api/public/xtream")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => handleProxy(request),
      POST: async ({ request }) => handleProxy(request),
    },
  },
});
