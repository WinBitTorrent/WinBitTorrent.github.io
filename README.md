# WinBitTorrent — website

Promotional website for **[WinBitTorrent](https://github.com/Gorbachevvv/winBitTorrent)**, a native WinUI 3 desktop client for qBittorrent on Windows.

Static site (plain HTML/CSS/JS, no build step) styled after **WinUI 3 / Fluent Design**, with light & dark themes, RU/EN localization, and a responsive mobile layout.

## Structure

```
index.html            Main page (hero, screenshots, features, RuTracker, tech, requirements)
donate.html           Donations page (placeholder details to be filled in)
assets/css/style.css  Fluent design system + light/dark themes + responsive
assets/js/i18n.js     RU/EN translation dictionary
assets/js/main.js     Theme toggle, language toggle, screenshot tabs, scroll reveal, copy
assets/img/           Logo + app screenshots
.nojekyll             Disable Jekyll processing on GitHub Pages
```

## Local preview

```bash
python -m http.server 8000
# open http://localhost:8000/
```

## Deploy to GitHub Pages

1. Commit and push these files to the default branch of `WinBitTorrent/WinBitTorrent`.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Select branch `main` (or `master`) and folder `/ (root)`, then **Save**.
4. The site publishes at `https://winbittorrent.github.io/WinBitTorrent/`.

## To customize later

- **Donation details** — replace the placeholder values in `donate.html` (YooMoney card number, BTC/USDT addresses) inside each `.copy-field` `<code>` and the matching `data-copy` attribute on the copy button.
- **Version / download links** — update the release URLs in `index.html` (hero buttons and sub-download links) when a new version ships.
