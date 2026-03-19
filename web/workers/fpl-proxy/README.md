# FPL API CORS proxy (Cloudflare Worker)

The **Live** tab in the web app calls `fantasy.premierleague.com` from the browser. Many hosts (e.g. GitHub Pages) hit **CORS** blocks. This worker mirrors the public FPL `/api/*` endpoints and adds `Access-Control-Allow-*` headers.

## One-time setup

**Use a local Wrangler** (no `sudo`, avoids `EACCES` on `npm install -g`):

```bash
cd web/workers/fpl-proxy
npm install
npm run login    # opens browser — complete OAuth in the browser window
npm run deploy
```

**Do not** run `npm install wrangler@4` here unless you know how to fix native `sharp` builds. This project stays on **Wrangler 3.x** on purpose; it deploys the same Worker and avoids `node-gyp` errors on macOS.

Run **`login`** and **`deploy` as two separate commands** (press Enter between them). If you paste `login` and `npx` on the same line without a newline, the shell can glue them into garbage like `loginnpx` and nothing runs correctly.

### If `npm install -g wrangler` failed with `EACCES`

That tries to write under `/usr/local/`. **Don’t use `-g` here** — the `npm install` inside this folder puts Wrangler in `./node_modules` only.

### If `npm install` fails on `sharp` / `node-gyp`

This repo pins **Wrangler 3.x** so install works without compiling native addons. If you upgrade to Wrangler 4 and hit `sharp` errors, use Node 20+ LTS and Xcode Command Line Tools (`xcode-select --install`), or stay on the committed lockfile.

### Alternative: `npx` (no `package.json` install)

```bash
cd web/workers/fpl-proxy
npx --yes wrangler login
npx --yes wrangler deploy
```

Again: **two lines**, not `login` and `npx` stuck together.

2. Wrangler prints a URL like `https://tclot-fpl-proxy.<you>.workers.dev`.

3. **Wire the site** — set Vite env at **build** time (value = worker origin, **no** trailing slash):

   ```bash
   # Local test
   echo 'VITE_FPL_PROXY_URL=https://tclot-fpl-proxy.your-subdomain.workers.dev' >> web/.env.local
   cd web && npm run dev
   ```

4. **GitHub Pages** — add a **Repository secret** or variable:

   - Name: `VITE_FPL_PROXY_URL`
   - Value: `https://tclot-fpl-proxy.your-subdomain.workers.dev`

   The deploy workflow passes it into `npm run build` so the SPA embeds the proxy URL.

## Optional: restrict CORS origin

Edit `wrangler.toml` and set:

```toml
[vars]
ALLOW_ORIGIN = "https://YOUR_USER.github.io"
```

Redeploy. If unset, the worker echoes the request `Origin` or falls back to `*`.

## Limits

- **GET/HEAD only** — matches what the Live tab needs.
- No API keys; same public data as the FPL site.
