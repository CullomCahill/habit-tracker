'use strict';

// ── Data helpers ──────────────────────────────────────────────────────────────

function loadHabits() {
  try { return JSON.parse(localStorage.getItem('habits')) || []; } catch { return []; }
}

function loadLogs() {
  try { return JSON.parse(localStorage.getItem('logs')) || {}; } catch { return {}; }
}

function saveHabits(h) { localStorage.setItem('habits', JSON.stringify(h)); }
function saveLogs(l)   { localStorage.setItem('logs',   JSON.stringify(l)); }

function getLog(logs, date, habit) {
  return (logs[date] && logs[date][habit] !== undefined) ? logs[date][habit] : null;
}

function setLog(logs, date, habit, value) {
  if (!logs[date]) logs[date] = {};
  logs[date][habit] = value;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayKey() { return dateKey(new Date()); }

function offsetDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = offsetDate(-i);
    days.push({
      key: dateKey(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

// ── State ─────────────────────────────────────────────────────────────────────

let habits    = loadHabits();
let logs      = loadLogs();
let currentHabit = null;
let viewOffset   = 0;   // 0 = today, -1 = yesterday, …, -6

// True when running on the deployed Netlify site (HTTPS)
const IS_PROD = location.protocol === 'https:';

// ── Screen management ─────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function renderSetup() {
  document.getElementById('setup').innerHTML = `
    <div class="header"><h1>Welcome</h1></div>
    <div class="setup-intro">Enter a habit you want to track daily.</div>
    <div class="body">
      <div class="input-group">
        <div>
          <div class="input-label">Habit 1</div>
          <input class="habit-input" id="h1" type="text" placeholder="e.g. Exercise" maxlength="32">
        </div>
      </div>
    </div>
    <div class="nav-strip">
      <button class="nav-btn primary" onclick="saveSetup()">Start Tracking</button>
    </div>
  `;
}

function saveSetup() {
  const vals = [document.getElementById('h1').value.trim()];
  if (!vals[0]) { showToast('Please name your habit'); return; }
  habits = vals;
  saveHabits(habits);
  viewOffset = 0;
  renderHome();
  showScreen('home');
}

// ── Home screen ───────────────────────────────────────────────────────────────

function renderHome() {
  const d         = offsetDate(viewOffset);
  const key       = dateKey(d);
  const isToday   = viewOffset === 0;
  const canBack   = viewOffset > -6;
  const canForward = viewOffset < 0;

  const cards = habits.map(h => {
    const val   = getLog(logs, key, h);
    const cls   = val === true ? 'done' : val === false ? 'skipped' : '';
    const badge = val === true ? 'Done ✓' : val === false ? 'Skipped' : 'Log it';
    return `
      <button class="habit-card ${cls}" onclick="openHabit('${escAttr(h)}')">
        <span class="name">${esc(h)}</span>
        <span class="status-badge">${badge}</span>
      </button>
    `;
  }).join('');

  document.getElementById('home').innerHTML = `
    <div class="header">
      <div class="date-nav">
        <button class="date-arrow ${canBack ? '' : 'disabled'}" onclick="shiftDay(-1)" ${canBack ? '' : 'disabled'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="date-label">
          <h1>${isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'long' })}</h1>
          <div class="subtitle">${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
        </div>
        <button class="date-arrow ${canForward ? '' : 'invisible'}" onclick="shiftDay(1)" ${canForward ? '' : 'disabled'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <button class="icon-btn" onclick="renderManage(); showScreen('manage')" aria-label="Manage habits">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>
    <div class="body">${cards}</div>
    <div class="nav-strip">
      <button class="nav-btn" onclick="renderLog(); showScreen('log')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Weekly Log
      </button>
      <button class="nav-btn" id="notif-btn" onclick="toggleNotifications()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span id="notif-label">Reminders</span>
      </button>
    </div>
  `;
  updateNotifButton();
}

function shiftDay(delta) {
  const next = viewOffset + delta;
  if (next < -6 || next > 0) return;
  viewOffset = next;
  renderHome();
}

// ── Detail screen ─────────────────────────────────────────────────────────────

function openHabit(habit) {
  currentHabit = habit;
  renderDetail();
  showScreen('detail');
}

function renderDetail() {
  const d       = offsetDate(viewOffset);
  const key     = dateKey(d);
  const isToday = viewOffset === 0;
  const val     = getLog(logs, key, currentHabit);
  const alreadyLogged = val !== null;

  const dateLabel = isToday
    ? 'Today · ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const ynSection = alreadyLogged
    ? `<div class="already-logged">
         You logged <strong>${val ? 'Yes ✓' : 'No ✗'}</strong> for this day.<br>
         <small style="opacity:0.6">One entry per day.</small>
       </div>`
    : `<div class="yn-group">
         <div>
           <input class="yn-option" type="radio" name="yn" id="opt-yes" value="yes">
           <label class="yn-label" for="opt-yes"><span class="yn-icon">✓</span>Yes</label>
         </div>
         <div>
           <input class="yn-option" type="radio" name="yn" id="opt-no" value="no">
           <label class="yn-label" for="opt-no"><span class="yn-icon">✗</span>No</label>
         </div>
       </div>
       <div class="save-row">
         <button class="nav-btn primary" onclick="saveHabitLog()">Save</button>
       </div>`;

  document.getElementById('detail').innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="renderHome(); showScreen('home')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div>
        <h1>${esc(currentHabit)}</h1>
        <div class="subtitle">${dateLabel}</div>
      </div>
    </div>
    <div class="body">
      <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">Did you complete this habit?</p>
      ${ynSection}
    </div>
  `;
}

function saveHabitLog() {
  const sel = document.querySelector('input[name="yn"]:checked');
  if (!sel) { showToast('Please select Yes or No'); return; }
  const val = sel.value === 'yes';
  setLog(logs, dateKey(offsetDate(viewOffset)), currentHabit, val);
  saveLogs(logs);
  showToast(val ? 'Marked as done!' : 'Logged — no worries!');
  renderDetail();
}

// ── Log screen ────────────────────────────────────────────────────────────────

function renderLog() {
  const days = getLast7Days();

  const headerCols = days.map(d =>
    `<th class="${d.isToday ? 'today-col' : ''}">${d.label}<br><small>${d.dayNum}</small></th>`
  ).join('');

  const rows = habits.map(h => {
    const cells = days.map(d => {
      const val  = getLog(logs, d.key, h);
      const cls  = val === true ? 'yes' : val === false ? 'no' : 'empty';
      const icon = val === true ? '✓' : val === false ? '✗' : '·';
      return `<td class="${d.isToday ? 'today-col' : ''}"><span class="log-cell ${cls}">${icon}</span></td>`;
    }).join('');
    return `<tr><td class="habit-name">${esc(h)}</td>${cells}</tr>`;
  }).join('');

  document.getElementById('log').innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="renderHome(); showScreen('home')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1>Weekly Log</h1>
    </div>
    <div class="body">
      <div class="log-table-wrap">
        <table class="log-table">
          <thead><tr><th class="habit-col">Habit</th>${headerCols}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="margin-top:16px;display:flex;gap:18px;font-size:0.8rem;color:var(--text-muted);">
        <span><span style="color:var(--yes)">✓</span> Completed</span>
        <span><span style="color:var(--no)">✗</span> Skipped</span>
        <span style="opacity:0.5">· Not logged</span>
      </div>
    </div>
  `;
}

// ── Manage Habits screen ──────────────────────────────────────────────────────

function renderManage() {
  const items = habits.map((h, i) => `
    <div class="manage-item">
      <span class="manage-name">${esc(h)}</span>
      <button class="remove-btn" onclick="removeHabit(${i})" aria-label="Remove ${escAttr(h)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  document.getElementById('manage').innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="renderHome(); showScreen('home')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1>Manage Habits</h1>
    </div>
    <div class="body">
      <div class="manage-list">
        ${items || '<p style="color:var(--text-muted);font-size:0.9rem;">No habits yet — add one below.</p>'}
      </div>
      <div class="add-habit-row">
        <input class="habit-input" id="new-habit-input" type="text" placeholder="New habit name" maxlength="32">
        <button class="nav-btn primary add-habit-btn" onclick="addHabit()">Add</button>
      </div>
    </div>
  `;

  document.getElementById('new-habit-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addHabit();
  });
}

function addHabit() {
  const input = document.getElementById('new-habit-input');
  const name = input.value.trim();
  if (!name) { showToast('Enter a habit name'); return; }
  if (habits.map(h => h.toLowerCase()).includes(name.toLowerCase())) {
    showToast('Habit already exists');
    return;
  }
  habits.push(name);
  saveHabits(habits);
  renderManage();
  showToast(`Added "${name}"`);
}

function removeHabit(index) {
  const name = habits[index];
  habits.splice(index, 1);
  saveHabits(habits);
  renderManage();
  showToast(`Removed "${name}"`);
}

// ── Notifications ─────────────────────────────────────────────────────────────

let notifTimer    = null;
let vapidPublicKey = null;

function notifEnabled() {
  return Notification.permission === 'granted' && localStorage.getItem('notif') === '1';
}

function updateNotifButton() {
  const btn   = document.getElementById('notif-btn');
  const label = document.getElementById('notif-label');
  if (!btn) return;
  if (!('Notification' in window)) { btn.style.display = 'none'; return; }
  const on = notifEnabled();
  btn.classList.toggle('notif-on', on);
  label.textContent = on ? 'Reminders On' : 'Reminders';
}

async function toggleNotifications() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported in this browser');
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('Notifications blocked — enable in browser/phone settings');
    return;
  }

  if (notifEnabled()) {
    // Turn off
    localStorage.setItem('notif', '0');
    clearLocalNotifTimer();
    if (IS_PROD) await unsubscribeFromPush();
    updateNotifButton();
    showToast('Reminders turned off');
    return;
  }

  // Turn on — request permission first
  const perm = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  if (perm !== 'granted') {
    showToast('Permission denied');
    return;
  }

  localStorage.setItem('notif', '1');

  if (IS_PROD && vapidPublicKey) {
    const ok = await subscribeToServerPush();
    if (ok) {
      updateNotifButton();
      showToast('Reminders on — you\'ll get a push at 7 pm daily');
      return;
    }
  }

  // Fallback: local timer (works when app is open)
  scheduleLocalNotif();
  updateNotifButton();
  showToast('Reminders on!');
}

// ── Server push (production) ──────────────────────────────────────────────────

async function loadVapidKey() {
  if (!IS_PROD) return;
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    vapidPublicKey = data.vapidPublicKey || null;
  } catch { vapidPublicKey = null; }
}

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeToServerPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub   = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }
    const res = await fetch('/api/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub),
    });
    return res.ok;
  } catch (err) {
    console.error('Push subscribe failed:', err);
    return false;
  }
}

async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {}
}

// ── Local timer fallback (localhost / dev) ────────────────────────────────────

function scheduleLocalNotif() {
  clearLocalNotifTimer();
  if (!notifEnabled()) return;

  const now  = new Date();
  const fire = new Date();
  fire.setHours(19, 0, 0, 0);
  if (fire <= now) fire.setDate(fire.getDate() + 1);

  notifTimer = setTimeout(fireLocalNotif, fire - now);
}

function clearLocalNotifTimer() {
  if (notifTimer !== null) { clearTimeout(notifTimer); notifTimer = null; }
}

function fireLocalNotif() {
  if (!notifEnabled()) return;
  const key     = todayKey();
  const unlogged = habits.filter(h => getLog(logs, key, h) === null);
  if (unlogged.length > 0) {
    const body = unlogged.length === habits.length
      ? "Don't forget to log your habits today!"
      : `Still to log: ${unlogged.join(', ')}`;
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIF', title: 'Habit Tracker', body, icon: '/icon-192.png' });
    } else {
      new Notification('Habit Tracker', { body, icon: '/icon-192.png' });
    }
  }
  scheduleLocalNotif();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && notifEnabled() && !IS_PROD) scheduleLocalNotif();
});

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Escape helpers ────────────────────────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return s.replace(/'/g, '&#39;').replace(/\\/g, '\\\\');
}

// ── Boot ──────────────────────────────────────────────────────────────────────

async function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  await loadVapidKey();

  if (habits.length === 0) {
    renderSetup();
    showScreen('setup');
  } else {
    renderHome();
    showScreen('home');
    if (notifEnabled() && !IS_PROD) scheduleLocalNotif();
  }
}

init();
