# CFP Scraper (rodar na VPS Hostinger)

Este é o componente que roda **na sua VPS**, não no app Lovable. O app fala com ele via HTTPS.

## Deploy rápido

```bash
ssh root@SEU-IP
sudo apt update && sudo apt install -y nodejs npm chromium-browser nginx certbot python3-certbot-nginx
sudo mkdir -p /opt/cfp-scraper && cd /opt/cfp-scraper
# copie server.js para cá (scp ou nano)
npm init -y && npm i express puppeteer-core

# gere um token forte
openssl rand -hex 32   # anote o valor

sudo tee /etc/systemd/system/cfp-scraper.service >/dev/null <<'EOF'
[Unit]
Description=CFP Scraper
After=network.target

[Service]
Environment=SCRAPER_TOKEN=COLE_O_TOKEN_AQUI
Environment=CHROMIUM_PATH=/usr/bin/chromium-browser
ExecStart=/usr/bin/node /opt/cfp-scraper/server.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now cfp-scraper
```

## Nginx + HTTPS (Let's Encrypt)

```nginx
server {
  server_name scraper.seudominio.com;
  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
  }
}
```

```bash
sudo certbot --nginx -d scraper.seudominio.com
```

## Depois disso

No Lovable, salve dois secrets:
- `SCRAPER_URL` = `https://scraper.seudominio.com`
- `SCRAPER_TOKEN` = o mesmo token que você colocou no systemd
