import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url(),
});

/**
 * Server function que pede ao scraper da VPS o link limpo (.m3u8/.mp4)
 * a partir da URL do player. Requer os secrets SCRAPER_URL e SCRAPER_TOKEN
 * configurados no Lovable Cloud.
 */
export const resolveStream = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const base = process.env.SCRAPER_URL;
    const token = process.env.SCRAPER_TOKEN;
    if (!base || !token) {
      return {
        stream: null as string | null,
        type: null as "hls" | "mp4" | null,
        error: "Scraper não configurado. Defina SCRAPER_URL e SCRAPER_TOKEN.",
      };
    }
    try {
      const res = await fetch(`${base.replace(/\/+$/, "")}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: data.url }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        stream?: string;
        type?: "hls" | "mp4";
        error?: string;
      };
      if (!res.ok || !json.stream) {
        return { stream: null, type: null, error: json.error ?? `HTTP ${res.status}` };
      }
      return { stream: json.stream, type: json.type ?? "hls", error: null };
    } catch (err) {
      return {
        stream: null,
        type: null,
        error: err instanceof Error ? err.message : "scraper offline",
      };
    }
  });
