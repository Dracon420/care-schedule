/**
 * Daily Care Schedule
 * Google Apps Script — feedings, water flushes, and medications
 */

const SETTINGS_KEY = 'scheduleSettings_v2';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle("Daily Care Schedule")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSettings() {
  const saved = PropertiesService.getUserProperties().getProperty(SETTINGS_KEY);
  if (saved) return JSON.parse(saved);
  return {
    feedCount: 6,
    feedIntervalHours: 3,
    feedVolumeMl: 200,
    feedRateMlHr: 0,
    eventDurationMinutes: 15,
    flushEnabled: false,
    flushVolumeMl: 15,
    flushMinutesBefore: 15,
    flushAfterFeed: false,
    meds: [],
    calendarId: 'primary',
    patientName: '',
    setupComplete: false
  };
}

function saveSettings(settings) {
  PropertiesService.getUserProperties()
    .setProperty(SETTINGS_KEY, JSON.stringify(settings));
  return { ok: true };
}

function getCalendars() {
  const all = CalendarApp.getAllCalendars();
  const list = [{ id: 'primary', name: 'My primary calendar' }];
  all.forEach(c => {
    try {
      if (c.isOwnedByMe()) list.push({ id: c.getId(), name: c.getName() });
    } catch (e) { /* skip unreadable calendars */ }
  });
  const seen = new Set();
  return list.filter(c => seen.has(c.id) ? false : (seen.add(c.id), true));
}

function startDay() {
  const s = getSettings();
  const cal = s.calendarId === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(s.calendarId);

  if (!cal) throw new Error('Calendar not found — open Settings and pick one.');

  const now       = new Date();
  const dayEnd    = new Date(now.getTime() + 24 * 3600 * 1000);
  const durMs     = (s.eventDurationMinutes || 15) * 60 * 1000;
  const created   = [];
  const counts    = { feeds: 0, flushes: 0, meds: 0 };

  const flushOn     = !!(s.flushEnabled);
  const flushVol    = s.flushVolumeMl || 15;
  const flushBefMs  = (s.flushMinutesBefore || 15) * 60 * 1000;
  const flushAfter  = !!(s.flushAfterFeed);
  const feedVol     = s.feedVolumeMl  || 0;
  const feedRate    = s.feedRateMlHr  || 0;

  // ── Feedings + surrounding flushes ──────────────────────────────────────
  for (let i = 0; i < s.feedCount; i++) {
    const feedStart = new Date(now.getTime() + i * s.feedIntervalHours * 3600 * 1000);
    const feedEnd   = new Date(feedStart.getTime() + durMs);

    // Pre-feed flush
    if (flushOn && flushBefMs > 0) {
      const fs = new Date(feedStart.getTime() - flushBefMs);
      if (fs >= now) {
        const fe = new Date(fs.getTime() + durMs);
        cal.createEvent(`💧 Water Flush (${flushVol} mL)`, fs, fe, {
          description: `Pre-feed water flush — ${flushVol} mL\nAuto-scheduled by Daily Care Schedule`
        });
        created.push({
          title: `Water Flush`,
          detail: `${flushVol} mL · before Feeding ${i + 1}`,
          time: fs.toISOString(), type: 'flush'
        });
        counts.flushes++;
      }
    }

    // Feeding
    const feedParts = [];
    if (feedVol  > 0) feedParts.push(`${feedVol} mL`);
    if (feedRate > 0) feedParts.push(`at ${feedRate} mL/hr`);
    const feedDetail = feedParts.join(' · ');

    cal.createEvent(`🍼 Feeding ${i + 1}`, feedStart, feedEnd, {
      description: [feedDetail, "Auto-scheduled by Daily Care Schedule"]
        .filter(Boolean).join('\n')
    });
    created.push({
      title: `Feeding ${i + 1}`,
      detail: feedDetail,
      time: feedStart.toISOString(), type: 'feed'
    });
    counts.feeds++;

    // Post-feed flush
    if (flushOn && flushAfter) {
      const fs = new Date(feedEnd.getTime());
      const fe = new Date(fs.getTime() + durMs);
      cal.createEvent(`💧 Water Flush (${flushVol} mL)`, fs, fe, {
        description: `Post-feed water flush — ${flushVol} mL\nAuto-scheduled by Daily Care Schedule`
      });
      created.push({
        title: `Water Flush`,
        detail: `${flushVol} mL · after Feeding ${i + 1}`,
        time: fs.toISOString(), type: 'flush'
      });
      counts.flushes++;
    }
  }

  // ── Medications ──────────────────────────────────────────────────────────
  (s.meds || []).forEach(med => {
    if (!med.name || !(med.intervalHours > 0)) return;
    const intervalMs = med.intervalHours * 3600 * 1000;
    let t = new Date(now);
    let safety = 0;

    while (t < dayEnd && safety < 48) {
      const end = new Date(t.getTime() + durMs);
      const detailParts = [];
      if (med.dose)  detailParts.push(med.dose);
      if (med.route) detailParts.push(med.route === 'gtube' ? 'via G-Tube' : med.route);

      cal.createEvent(`💊 ${med.name}`, t, end, {
        description: [
          med.dose  ? `Dose: ${med.dose}`   : '',
          med.route ? `Route: ${med.route}` : '',
          "Auto-scheduled by Daily Care Schedule"
        ].filter(Boolean).join('\n')
      });
      created.push({
        title: med.name,
        detail: detailParts.join(' · '),
        time: t.toISOString(), type: 'med'
      });
      counts.meds++;
      t = new Date(t.getTime() + intervalMs);
      safety++;
    }
  });

  created.sort((a, b) => a.time.localeCompare(b.time));
  return { ok: true, count: created.length, events: created, counts };
}
