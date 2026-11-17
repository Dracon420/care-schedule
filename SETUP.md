# Care Management System — PWA Setup Guide

A standalone app you can install on any phone or tablet and sell/share with anyone. No Google Apps Script required.

---

## What you need

- A free **Google Cloud Console** account (to create an OAuth Client ID)
- A free **Netlify** account (to host the app — 1-click deploy, no coding)
- About 15 minutes

---

## Step 1 — Get a Google OAuth Client ID

This lets the app sign into Google Calendar on the user's behalf.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in
2. Click **Select a project** → **New Project** → name it "Care Management System" → **Create**
3. In the left menu go to **APIs & Services → Library**
4. Search for **Google Calendar API** → click it → click **Enable**
5. In the left menu go to **APIs & Services → OAuth consent screen**
   - Choose **External** → **Create**
   - App name: `Care Management System`
   - User support email: your email
   - Developer contact email: your email
   - Click **Save and Continue** through all the steps (you can skip optional fields)
6. In the left menu go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Care Management System`
   - Under **Authorized JavaScript origins** click **+ Add URI** and add:
     - `http://localhost` (for local testing)
     - Your Netlify URL once you have it (e.g. `https://your-app.netlify.app`)
   - Click **Create**
7. Copy the **Client ID** — it looks like `123456789.apps.googleusercontent.com`

---

## Step 2 — Add your Client ID to the app

1. Open `Index.html` in any text editor (Notepad works fine)
2. Find this line near the top of the `<script>` section:
   ```
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID
4. Save the file

---

## Step 3 — Deploy to Netlify (free)

1. Go to [netlify.com](https://netlify.com) and create a free account
2. From your dashboard click **Add new site → Deploy manually**
3. Drag and drop the entire **"care-schedule"** folder onto the upload area
4. Netlify will give you a URL like `https://your-app.netlify.app`
5. Copy that URL and go back to Google Cloud Console → Credentials → edit your OAuth client → add that URL to **Authorized JavaScript origins** → Save

Your app is now live at that URL!

---

## Step 4 — Install on phone (Android)

1. Open the Netlify URL in **Chrome**
2. Tap the **⋮** menu → **Add to Home screen** → **Add**
3. The app icon appears on your home screen — tap it to open in full-screen mode

## Step 4 — Install on iPhone (iOS)

1. Open the Netlify URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (square with arrow) at the bottom
3. Scroll down and tap **Add to Home Screen** → **Add**

---

## Step 5 — First launch

1. Open the app — the setup wizard launches automatically
2. Enter the patient name, feeding schedule, hydration settings, and medications
3. On the last wizard step, tap **Sign in with Google** to connect Google Calendar
4. Tap **Launch App**
5. Each morning, press **START TODAY'S SCHEDULE** to push the day's events to Google Calendar

---

## How it works

- **Settings** are saved on the device (localStorage) — no server required
- **START button** builds the schedule and pushes events to Google Calendar via the REST API
- **Notifications**: the app schedules a local notification 5 minutes before each event (you'll be prompted to allow notifications on first run)
- **Google Calendar reminders**: each event also has a 5-minute popup reminder in the calendar itself, so you get notified even if the app isn't open
- **Offline**: the app works offline after the first load (service worker caches everything)

---

## Sharing / selling the app

Each person who uses the app needs to:
1. Add your Netlify URL to a bookmark or home screen
2. Sign into their own Google account on first launch

If you want each user to have their own isolated version (e.g. for paid customers), the simplest approach is to let them deploy their own copy to Netlify using these instructions.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Client ID not configured" warning | You haven't replaced `YOUR_GOOGLE_CLIENT_ID` in `Index.html` |
| Sign-in popup blocked | Allow popups for your Netlify URL in browser settings |
| Calendar sync not working | Make sure your Netlify URL is in the Authorized JavaScript Origins in Google Cloud Console |
| Events not appearing in calendar | Check that you picked the right calendar in Settings → Sync tab |
| No notifications | Allow notifications when prompted; on iOS, notifications for web apps require iOS 16.4+ |
