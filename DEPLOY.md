# Deploying to GitHub Pages (no Actions)

## One-time setup

1. **Create a repo on GitHub** (e.g. `TCLOT`).

2. **Enable GitHub Pages** in the repo:  
   **Settings** → **Pages** → **Source**: choose **"Deploy from a branch"**  
   Branch: **gh-pages** (create it when you first deploy)

3. **Push your code** and connect the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/TCLOT.git
   git push -u origin main
   ```

4. **If your repo name isn't `TCLOT`**, change `base` in `web/vite.config.js` to match:
   ```js
   base: '/your-repo-name/',
   ```

## Deploying (whenever you want to update the site)

1. **Refresh league data:**
   ```bash
   python3 ingest.py 6802
   ```

2. **Build and deploy:**
   ```bash
   cd web && npm run deploy
   ```

That’s it. The site will be live at:

**https://YOUR_USERNAME.github.io/TCLOT/**

## Changing the league ID

Update the league ID in step 1:
```bash
python3 ingest.py YOUR_LEAGUE_ID
```
