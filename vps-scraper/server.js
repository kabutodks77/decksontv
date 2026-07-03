/**
 * CINEFLIXPAYMENT — Scraper de player para rodar na VPS Hostinger.
 *
 * Deploy na VPS (Ubuntu):
 *   sudo apt update && sudo apt install -y nodejs npm chromium-browser
 *   mkdir -p /opt/cfp-scraper && cd /opt/cfp-scraper
 *   # copie este arquivo para /opt/cfp-scraper/server.js
 *   npm init -y && npm i express puppeteer-core
 *   export SCRAPER_TOKEN="troque-por-um-token-forte"
 *   export CHROMIUM_PATH="/usr/bin/chromium-browser"
 *   node server.js
 *
 * Rodar como serviço (systemd) — /etc/systemd/system/cfp-scraper.service:
 *   [Service]
 *   Environment=SCRAPER_TOKEN=troque-por-um-token-forte
 *   Environment=CHROMIUM_PATH=/usr/bin/chromium-browser
 *   ExecStart=/usr/bin/node /opt/cfp-scraper/server.js
 *   Restart=always
 *
 * Uso:
 *   POST https://SEU-DOMINIO/scrape
 *   Headers: Authorization: Bearer <SCRAPER_TOKEN>
 *   Body:    { "url": "https://player-do-filme..." }
 *   Resp:    { "stream": "https://.../master.m3u8", "type": "hls" }
 */
const express = require("express");
const puppeteer = require("puppeteer-core");

const PORT = process.env.PORT || 8787;
const TOKEN = process.env.SCRAPER_TOKEN;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser";

if (!TOKEN) {
  console.error("SCRAPER_TOKEN não definido. Abortando.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/scrape", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "unauthorized" });

  const target = String(req.body?.url || "").trim();
  if (!/^https?:\/\//i.test(target)) return res.status(400).json({ error: "invalid url" });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    );

    const hits = { hls: null, mp4: null };
    page.on("request", (req) => {
      const u = req.url();
      if (!hits.hls && /\.m3u8(\?|$)/i.test(u)) hits.hls = u;
      if (!hits.mp4 && /\.mp4(\?|$)/i.test(u)) hits.mp4 = u;
    });

    await page.goto(target, { waitUntil: "networkidle2", timeout: 45000 });
    // dá um tempinho pra players que só disparam o manifest após play
    await page.waitForTimeout(4000);
    try {
      await page.evaluate(() => {
        const v = document.querySelector("video");
        if (v) v.play().catch(() => {});
      });
      await page.waitForTimeout(3000);
    } catch {}

    const stream = hits.hls || hits.mp4;
    if (!stream) return res.status(404).json({ error: "no stream found" });
    res.json({ stream, type: hits.hls ? "hls" : "mp4" });
  } catch (err) {
    res.status(500).json({ error: err.message || "scrape failed" });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

app.listen(PORT, () => console.log(`cfp-scraper on :${PORT}`));
