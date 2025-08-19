Netlify build fix

What changed?
- Switched Netlify build command from `npm ci && npm run build` to `npm install --no-audit --no-fund && npm run build`.
- This avoids the `npm ci` error when there's no package-lock.json in the repo.
- Sets Node 20 (stable on Netlify) and keeps publish/functions dirs.

How to use
1) Replace the file at the repo root: `netlify.toml` (create it if it doesn't exist).
2) Commit and push to GitHub. Netlify will pick the change and run `npm install` + `npm run build`.
3) (Optional) If you see peerDependencies conflicts, uncomment NPM_FLAGS in `netlify.toml`.

Tip
- Later you can re-enable `npm ci` for faster/ reproducible builds once you commit a `package-lock.json`.
