// Xtream Codes API helpers (via server-side proxy to avoid CORS)

export type XtreamCreds = {
  url: string;
  username?: string;
  password?: string;
  mac?: string;
};

export type XtreamCategory = {
  category_id: string;
  category_name: string;
  parent_id?: number;
};

export type XtreamStream = {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id?: number;
  series_id?: number;
  stream_icon?: string;
  cover?: string;
  rating?: string | number;
  category_id?: string;
  container_extension?: string;
  added?: string;
  epg_channel_id?: string;
  direct_source?: string;
};

export type XtreamEpisode = {
  id: string | number;
  title: string;
  container_extension?: string;
  info?: { movie_image?: string; plot?: string; duration?: string };
  episode_num?: number;
  season?: number;
};

export type XtreamSeriesInfo = {
  info?: { name?: string; cover?: string; plot?: string };
  seasons?: unknown[];
  episodes?: Record<string, XtreamEpisode[]>;
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

async function proxy<T>(creds: XtreamCreds, action?: string, extra: Record<string, string> = {}): Promise<T> {
  const res = await fetch("/api/public/xtream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...creds, ...(action ? { action } : {}), ...extra }),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta inválida do servidor Xtream (status ${res.status})`);
  }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
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
  const data = await proxy<XtreamAuthResponse>(creds);
  const auth = data?.user_info?.auth;
  const status = data?.user_info?.status;
  const ok = (auth === 1 || auth === "1") && (!status || /active/i.test(String(status)));
  if (!ok) {
    throw new Error(data?.user_info?.message || "Credenciais inválidas ou conta inativa.");
  }
  return data;
}

export async function getLiveCategories(creds: XtreamCreds) {
  return proxy<XtreamCategory[]>(creds, "get_live_categories");
}
export async function getVodCategories(creds: XtreamCreds) {
  return proxy<XtreamCategory[]>(creds, "get_vod_categories");
}
export async function getSeriesCategories(creds: XtreamCreds) {
  return proxy<XtreamCategory[]>(creds, "get_series_categories");
}

export async function getLiveStreams(creds: XtreamCreds, categoryId: string) {
  return proxy<XtreamStream[]>(creds, "get_live_streams", { category_id: categoryId });
}
export async function getVodStreams(creds: XtreamCreds, categoryId: string) {
  return proxy<XtreamStream[]>(creds, "get_vod_streams", { category_id: categoryId });
}
export async function getSeries(creds: XtreamCreds, categoryId: string) {
  return proxy<XtreamStream[]>(creds, "get_series", { category_id: categoryId });
}
export async function getSeriesInfo(creds: XtreamCreds, seriesId: string | number) {
  return proxy<XtreamSeriesInfo>(creds, "get_series_info", { series_id: String(seriesId) });
}

/** Build the direct playback URL. Requires a normalized server URL. */
export function buildStreamUrl(
  creds: XtreamCreds,
  kind: "live" | "movie" | "series",
  id: string | number,
  ext?: string,
) {
  const base = creds.url.replace(/\/+$/, "");
  const user = creds.username ?? creds.mac ?? "";
  const pass = creds.password ?? creds.mac ?? "";
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(pass);
  if (kind === "live") {
    return `${base}/live/${u}/${p}/${id}.m3u8`;
  }
  const suffix = ext && ext.length ? ext : "mp4";
  return `${base}/${kind}/${u}/${p}/${id}.${suffix}`;
}
