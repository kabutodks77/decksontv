// Xtream Codes API helpers (client-side)

export type XtreamCreds = {
  url: string;
  username: string;
  password: string;
};

export type XtreamCategory = {
  category_id: string;
  category_name: string;
  parent_id?: number;
};

const CREDS_KEY = "cfp_xtream_creds";

export function saveCreds(c: XtreamCreds) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(c));
}

export function getCreds(): XtreamCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    return raw ? (JSON.parse(raw) as XtreamCreds) : null;
  } catch {
    return null;
  }
}

export function clearCreds() {
  localStorage.removeItem(CREDS_KEY);
}

function normalizeUrl(url: string) {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = "http://" + u;
  return u.replace(/\/+$/, "");
}

function buildApiUrl(creds: XtreamCreds, params: Record<string, string> = {}) {
  const base = normalizeUrl(creds.url);
  const sp = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    ...params,
  });
  return `${base}/player_api.php?${sp.toString()}`;
}

async function xtreamFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data as T;
}

export type XtreamAuthResponse = {
  user_info?: {
    auth?: number | string;
    status?: string;
    username?: string;
    message?: string;
    exp_date?: string;
  };
  server_info?: Record<string, unknown>;
};

export async function authenticate(creds: XtreamCreds): Promise<XtreamAuthResponse> {
  const data = await xtreamFetch<XtreamAuthResponse>(buildApiUrl(creds));
  const auth = data?.user_info?.auth;
  const status = data?.user_info?.status;
  const ok = (auth === 1 || auth === "1") && (!status || /active/i.test(String(status)));
  if (!ok) {
    throw new Error(data?.user_info?.message || "Credenciais inválidas ou conta inativa.");
  }
  return data;
}

export async function getLiveCategories(creds: XtreamCreds) {
  return xtreamFetch<XtreamCategory[]>(buildApiUrl(creds, { action: "get_live_categories" }));
}
export async function getVodCategories(creds: XtreamCreds) {
  return xtreamFetch<XtreamCategory[]>(buildApiUrl(creds, { action: "get_vod_categories" }));
}
export async function getSeriesCategories(creds: XtreamCreds) {
  return xtreamFetch<XtreamCategory[]>(buildApiUrl(creds, { action: "get_series_categories" }));
}
