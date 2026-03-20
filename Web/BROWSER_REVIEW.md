# Browser Review

This pipeline captures real browser screenshots so the UI can be judged from the rendered result instead of from code alone.

## Install browser runtime

```bash
npm run browser:review:install
```

## Capture public routes

```bash
npm run browser:review
```

## Capture against an already-running app

```bash
BROWSER_REVIEW_BASE_URL=http://localhost:3000 \
BROWSER_REVIEW_SKIP_WEBSERVER=1 \
npm run browser:review
```

## Capture admin routes too

```bash
BROWSER_REVIEW_EMAIL=admin@email.com \
BROWSER_REVIEW_PASSWORD='your-password' \
npm run browser:review
```

## Optional headed run

```bash
BROWSER_REVIEW_EMAIL=admin@email.com \
BROWSER_REVIEW_PASSWORD='your-password' \
npm run browser:review:headed
```

## Artifacts

Artifacts are written to:

```text
.artifacts/browser-review/
```

Each project has:

- `home.png`
- `admin-login.png`
- `admin-dashboard.png` when auth is configured
- `admin-logs.png` when auth is configured
- matching `.json` files with simple layout metrics

## Notes

- The pipeline starts the Next dev server automatically unless one is already running.
- By default the review server uses port `3100` so it does not fight your usual local `3000` dev server.
- If you already have the app running, set `BROWSER_REVIEW_SKIP_WEBSERVER=1` and point `BROWSER_REVIEW_BASE_URL` at that instance.
- Auth-gated pages are skipped unless `BROWSER_REVIEW_EMAIL` and `BROWSER_REVIEW_PASSWORD` are set.
- The screenshots are intended for visual review by either a human or a follow-up assistant pass.
