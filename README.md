# Care Management System

A progressive web app (PWA) for managing daily care schedules for medically complex patients — tube feedings, water flushes, and medications. Syncs to Google Calendar, sends local notifications, and installs directly on any phone or tablet with no app store required.

---

## Features

- **Daily schedule builder** — configurable tube feedings, water flushes, and medications with full H:M time controls
- **Google Calendar sync** — pushes every event to the patient's calendar with 5-minute popup reminders
- **Stop & Clear** — removes all pushed calendar events in one tap and resets the schedule
- **Local notifications** — configurable per-task alerts (multiple alerts per event, e.g. 1 hr before + 15 min before)
- **Live clock & next-task card** — shows upcoming event with countdown timer (NOW / X min / Xh Xm)
- **Schedule preview** — collapsible live preview that recalculates every 5 minutes
- **Home screen widget** — separate installable widget page (`widget.html`) showing START / RUNNING + next task
- **Offline support** — service worker caches the app shell; works with no internet after first load
- **Setup wizard** — guided first-run wizard for patient name, feeding schedule, flushes, meds, and calendar connection
- **No server required** — all settings stored in `localStorage`; no backend, no database

---

## Tech Stack

| Layer | Technology |
|---|---|
| App | Vanilla HTML/CSS/JS — single `Index.html` |
| Auth | Google Identity Services (GIS) token client |
| Calendar | Google Calendar REST API v3 |
| Offline | Service Worker (network-first for HTML, cache-first for assets) |
| Hosting | [Netlify](https://netlify.com) (free tier, drag-and-drop deploy) |
| Fonts | Orbitron · Share Tech Mono · Inter (Google Fonts) |

---

## File Structure

```
├── Index.html          # Main app — all UI and logic
├── widget.html         # Compact home screen widget shortcut
├── manifest.json       # PWA manifest for the main app
├── widget-manifest.json# PWA manifest for the widget shortcut
├── sw.js               # Service worker (cache + notifications)
├── icon.svg            # App icon (dark bg, cyan medical cross)
├── SETUP.md            # Full deployment guide
└── README.md           # This file
```

---

## Quick Start

### 1 — Get a Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project
2. Enable the **Google Calendar API**
3. Configure the **OAuth consent screen** (External, fill in app name + email)
4. Create an **OAuth Client ID** → Web application
5. Add your Netlify URL to **Authorized JavaScript Origins**
6. Copy the Client ID (looks like `123456789.apps.googleusercontent.com`)

### 2 — Add your Client ID

Open `Index.html` and replace the placeholder near the top of the `<script>` section:

```js
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

### 3 — Deploy to Netlify

1. Sign in to [netlify.com](https://netlify.com)
2. Dashboard → **Add new site → Deploy manually**
3. Drag and drop this entire folder onto the upload area
4. Copy the generated URL and add it to your Google Cloud OAuth origins

### 4 — Install on phone

**Android (Chrome)**
> Open the Netlify URL → ⋮ menu → **Add to Home Screen**

**iPhone (Safari)**
> Open the Netlify URL → Share button → **Add to Home Screen**

### 5 — Install the widget shortcut

Open `your-netlify-url/widget.html` in Chrome/Safari and add it to your home screen the same way. It installs as a separate **"CareWidget"** icon.

---

## How It Works

### Schedule Builder
`buildSchedule(settings)` generates events starting from the current time:
- **Feedings** — spaced by the configured interval
- **Water flushes** — before feed, after feed, at set times (N times/day or between feeds at the midpoint)
- **Medications** — interval mode (every X hr) or times/day (specific clock times)

### Calendar Sync
On **START**, events are pushed to Google Calendar in batches of 5 using the REST API with a Bearer token from GIS. Each event includes a 5-minute popup reminder. Event IDs are saved to `localStorage` so **Stop & Clear** can delete them later.

### Widget Page (`widget.html`)
Reads `careSystemSchedule_v1` from `localStorage` (same origin as the main app). Shows:
- **START** button → opens `index.html?action=start` and auto-launches the schedule
- **RUNNING** button + next task card when a schedule is active
- Refreshes every 15 seconds and on tab focus

### Service Worker
- **Cache name:** `care-system-v5` — bump this on every deploy to bust stale installs
- **HTML strategy:** network-first (always fetches latest when online, falls back to cache offline)
- **Asset strategy:** cache-first for icons, manifest, fonts
- Google APIs and OAuth endpoints bypass the cache entirely

---

## Settings Reference

| Setting | Description |
|---|---|
| Patient Name | Displayed in the app header |
| Feedings per Day | Number of tube feeding events |
| Time Between Feeds | Hours + minutes between each feeding |
| Volume (mL) | Feed volume per event |
| Rate mL/hr | Pump rate (0 = bolus) |
| Event Duration | How long each calendar event lasts |
| Water Flushes | Enable/disable; add rules (before/after/set-time) |
| Medications | Name, dose, route, interval or specific times |
| Google Calendar | Target calendar for event sync |
| Notifications | Enable toggle + configurable H:M alert offsets per task |

---

## Updating the App

After editing any file:

1. Bump `CACHE_NAME` in `sw.js` (e.g. `v5` → `v6`) so installed phones pick up the new version
2. Re-upload the folder to Netlify → **Deploys → Deploy manually**
3. Open the app on your phone with internet — it fetches the new version automatically

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Client ID not configured" | Replace `YOUR_GOOGLE_CLIENT_ID` in `Index.html` |
| Sign-in popup blocked | Allow popups for your Netlify URL in browser settings |
| Calendar sync not working | Add your Netlify URL to Authorized JavaScript Origins in Google Cloud Console |
| Events not appearing in calendar | Check Settings → Connections → Target Calendar |
| No notifications | Allow notifications when prompted; iOS requires 16.4+ |
| App not updating on phone | Bump `CACHE_NAME` in `sw.js` and redeploy |
| Widget shows wrong state | Make sure both pages are on the same Netlify domain (same localStorage origin) |

---

## License

Personal use. Built for a medically complex patient — adapt freely for your own care management needs.

---

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md). You're free to use, study and change it for personal, hobby, educational and other **noncommercial** purposes. **Commercial use, including selling it or running it as a paid service, isn't allowed** without a separate licence from the author; open an issue to ask.

> This app is a scheduling aid, not a medical device. Always follow the care plan from the patient's medical team.
