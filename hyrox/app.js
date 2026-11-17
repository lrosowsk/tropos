/* Hyrox Prep: plan, log and track Hyrox training, lifting and food.
   Everything is stored on this device (localStorage). Use Settings → Export to back up. */
(() => {
'use strict';

/* =====================================================================
   Utilities
   ===================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const round1 = (n) => Math.round(n * 10) / 10;
const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + (f(x) || 0), 0);

/* ---- dates (local, as YYYY-MM-DD strings) ---- */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => iso(new Date());
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
const mondayOf = (s) => { const d = parseISO(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (s, opts = {}) => {
  const d = parseISO(s);
  const base = `${MON[d.getMonth()]} ${d.getDate()}`;
  if (opts.dow) return `${DOW[d.getDay()]}, ${base}`;
  if (opts.long) return `${DOW_LONG[d.getDay()]}, ${base}`;
  return base;
};
const relDay = (s) => {
  const n = daysBetween(todayISO(), s);
  if (n === 0) return 'Today';
  if (n === -1) return 'Yesterday';
  if (n === 1) return 'Tomorrow';
  return fmtDate(s, { dow: true });
};

/* ---- time ---- */
// "4:05" → 245 s, "1:12:30" → 4350 s, bare number → minutes.
function parseTime(str) {
  if (str == null || str === '') return null;
  const s = String(str).trim();
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => parseFloat(p));
    if (parts.some((p) => !Number.isFinite(p))) return null;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  const n = num(s);
  return n == null ? null : Math.round(n * 60);
}
function fmtTime(sec) {
  if (sec == null || !Number.isFinite(sec)) return '';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
const fmtPace = (secPerKm) => `${fmtTime(secPerKm)}/km`;
const fmtMin = (min) => {
  if (!min) return '0 min';
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h ${m ? m + 'm' : ''}`.trim() : `${m} min`;
};

/* =====================================================================
   State
   ===================================================================== */
const KEY = 'hyroxprep.v1';
const DEFAULT_PROFILE = () => ({
  setup: false,
  raceDate: addDays(todayISO(), 7 * 16),
  planStart: mondayOf(todayISO()),
  division: 'open',
  category: 'men',
  unit: 'kg',
  bodyweight: null,
  days: 5,
  longDay: 6,
  fiveK: '',
  oneRM: { squat: null, bench: null, deadlift: null, ohp: null },
  targets: { cal: null, p: null, c: null, f: null },
  theme: 'auto',
});
let state = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.profile) {
      const p = Object.assign(DEFAULT_PROFILE(), raw.profile);
      p.oneRM = Object.assign(DEFAULT_PROFILE().oneRM, raw.profile.oneRM);
      p.targets = Object.assign(DEFAULT_PROFILE().targets, raw.profile.targets);
      return { profile: p, workouts: raw.workouts || [], food: raw.food || [], weights: raw.weights || [] };
    }
  } catch (e) { /* storage blocked or corrupt */ }
  return { profile: DEFAULT_PROFILE(), workouts: [], food: [], weights: [] };
}
let saveWarned = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { if (!saveWarned) { saveWarned = true; toast('Could not save. Storage is blocked or full; export a backup.'); } }
  planCache = null;
}

const U = () => state.profile.unit;

/* =====================================================================
   Hyrox reference data
   ===================================================================== */
const STATIONS = [
  { id: 'ski', name: 'SkiErg', amt: 1000, unit: 'm', step: 50 },
  { id: 'push', name: 'Sled Push', amt: 50, unit: 'm', step: 12.5 },
  { id: 'pull', name: 'Sled Pull', amt: 50, unit: 'm', step: 12.5 },
  { id: 'bbj', name: 'Burpee Broad Jumps', amt: 80, unit: 'm', step: 10 },
  { id: 'row', name: 'Row', amt: 1000, unit: 'm', step: 50 },
  { id: 'farmers', name: 'Farmers Carry', amt: 200, unit: 'm', step: 25 },
  { id: 'lunges', name: 'Sandbag Lunges', amt: 100, unit: 'm', step: 10 },
  { id: 'wb', name: 'Wall Balls', amt: 100, unit: 'reps', step: 5 },
];
const stationById = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
const stAmt = (st, frac) => {
  const v = Math.max(st.step, Math.round((st.amt * frac) / st.step) * st.step);
  return `${v % 1 ? v.toFixed(1) : v} ${st.unit}`;
};

// Race weights (kg). Sled weights include the sled. Check the current season's rulebook.
const STANDARDS = {
  open: { men: { push: 152, pull: 103, farmers: '2 × 24', lunges: 20, wb: '6 kg, 3.0 m target' }, women: { push: 102, pull: 78, farmers: '2 × 16', lunges: 10, wb: '4 kg, 2.7 m target' } },
  pro: { men: { push: 202, pull: 153, farmers: '2 × 32', lunges: 30, wb: '9 kg, 3.0 m target' }, women: { push: 152, pull: 103, farmers: '2 × 24', lunges: 20, wb: '6 kg, 2.7 m target' } },
};
const standardsFor = (p) => STANDARDS[p.division === 'pro' ? 'pro' : 'open'][p.category === 'women' ? 'women' : 'men'];

const LIFT_REFS = { squat: 'Back Squat', bench: 'Bench Press', deadlift: 'Deadlift', ohp: 'Overhead Press' };
const COMMON_LIFTS = ['Back Squat', 'Front Squat', 'Deadlift', 'Romanian Deadlift', 'Bench Press', 'Incline DB Press', 'Overhead Press',
  'Pull-up', 'Barbell Row', 'Bulgarian Split Squat', 'Walking Lunge', 'Hip Thrust', 'Sled Push', 'Sled Pull', 'Farmers Carry',
  'Wall Balls', 'Box Jump', 'Kettlebell Swing', 'Dumbbell Row', 'Dips', 'Plank'];

const TYPES = {
  run: { name: 'Run', cat: 'run' },
  hyrox: { name: 'Hyrox stations', cat: 'hyrox' },
  sim: { name: 'Simulation', cat: 'hyrox' },
  race: { name: 'Race', cat: 'hyrox' },
  strength: { name: 'Strength', cat: 'strength' },
  erg: { name: 'Erg / cardio', cat: 'other' },
  mobility: { name: 'Mobility', cat: 'other' },
  other: { name: 'Other', cat: 'other' },
};
const CATS = [
  { key: 'run', name: 'Running', color: 'var(--s1)' },
  { key: 'hyrox', name: 'Hyrox', color: 'var(--s2)' },
  { key: 'strength', name: 'Strength', color: 'var(--s3)' },
  { key: 'other', name: 'Other', color: 'var(--s4)' },
];
const PHASES = {
  base: { name: 'Base', color: 'var(--phase-base)', blurb: 'Build the engine: easy volume, station technique, solid strength.' },
  build: { name: 'Build', color: 'var(--phase-build)', blurb: 'Threshold running, compromised runs, heavier strength.' },
  peak: { name: 'Peak', color: 'var(--phase-peak)', blurb: 'Race-specific: race pace, full stations, simulations. Strength maintained.' },
  taper: { name: 'Taper', color: 'var(--phase-taper)', blurb: 'Volume drops, intensity stays. Arrive fresh.' },
};

/* =====================================================================
   Plan generator
   ===================================================================== */
function paces(p) {
  const t = parseTime(p.fiveK);
  if (!t || t < 600 || t > 3600) return null;
  const k = t / 5;
  return { five: k, thr: k + 12, race: k + 35, z2: k + 80 };
}
function paceText(pc, kind) {
  const fallback = { five: '5K effort (RPE 8–9)', thr: 'threshold, comfortably hard (RPE 7–8)', race: 'Hyrox race pace (RPE 7)', z2: 'easy, conversational (RPE 3–4)' }[kind];
  return pc ? `${fmtPace(pc[kind])}` : fallback;
}
function roundWeight(w) {
  const step = U() === 'lb' ? 5 : 2.5;
  return Math.round(w / step) * step;
}
function lift(exercise, sets, reps, pct, ref) {
  const orm = ref ? state.profile.oneRM[ref] : null;
  const weight = orm && pct ? roundWeight(orm * pct) : null;
  return { exercise, sets, reps, pct, weight };
}
function liftLine(l) {
  const load = l.weight ? `${l.weight} ${U()}` : l.pct ? `RPE ${l.pct >= 0.84 ? 8 : 7}` : '';
  const pct = l.weight ? ` <span class="faint">(${Math.round(l.pct * 100)}%)</span>` : '';
  return `<b>${esc(l.exercise)}</b> ${l.sets} × ${l.reps}${load ? ' @ ' + load : ''}${pct}`;
}

const PAIRS = [['ski', 'push'], ['pull', 'bbj'], ['row', 'farmers'], ['lunges', 'wb']];

function buildSession(kind, c) {
  const { phase, p, deload, wk, r } = c;
  const pc = paces(state.profile);
  const st = standardsFor(state.profile);
  const dl = deload ? 0.65 : 1;
  const raceWeek = r === 0;
  const S = (o) => Object.assign({ kind, items: [], lifts: [] }, o);

  switch (kind) {
    case 'rest':
      return S({ type: 'rest', title: 'Rest day', duration: 0, items: ['Off, or 20 min easy walk + mobility (hips, T-spine, calves).'] });

    case 'intervals': {
      if (raceWeek) return S({ type: 'run', title: 'Race-week sharpener', duration: 30, items: ['10 min easy', `4 × 200 m strides, full recovery`, '10 min easy'] });
      if (phase === 'taper') return S({ type: 'run', title: 'Race-pace 1 km repeats', duration: 40, items: ['10 min easy + drills', `4 × 1 km @ ${paceText(pc, 'race')}, 90 s jog`, '10 min easy'] });
      let main, title, dur = 50;
      if (phase === 'base') {
        if (wk % 2 === 0) { const n = Math.round((6 + Math.round(p * 4)) * dl); title = `${n} × 400 m`; main = `${n} × 400 m @ ${paceText(pc, 'five')}, 90 s jog`; dur = 45; }
        else { const m = Math.round((15 + Math.round(p * 10)) * dl); title = `Tempo ${m} min`; main = `${m} min continuous @ ${paceText(pc, 'thr')}`; }
      } else if (phase === 'build') {
        if (wk % 2 === 0) { const n = Math.max(3, Math.round((4 + Math.round(p * 2)) * dl)); title = `${n} × 1 km threshold`; main = `${n} × 1 km @ ${paceText(pc, 'thr')}, 90 s jog`; }
        else { const n = Math.max(2, Math.round((3 + Math.round(p * 1)) * dl)); title = `${n} × 2 km threshold`; main = `${n} × 2 km @ ${paceText(pc, 'thr')}, 2 min jog`; dur = 55; }
      } else {
        if (wk % 2 === 0) { title = '8 × 1 km race pace'; main = `8 × 1 km @ ${paceText(pc, 'race')}, 60 s rest. Practise holding pace when tired.`; dur = 60; }
        else { title = '3 × 2 km threshold'; main = `3 × 2 km @ ${paceText(pc, 'thr')}, 2 min jog`; dur = 55; }
      }
      return S({ type: 'run', title: `Intervals: ${title}`, duration: dur, items: ['10–15 min easy + drills & 4 strides', main, '10 min easy cool-down'] });
    }

    case 'z2': {
      const base = { base: 35 + p * 15, build: 45 + p * 10, peak: 45, taper: 30 }[phase];
      const m = Math.round((base * dl) / 5) * 5;
      const items = [`${m} min @ ${paceText(pc, 'z2')}`];
      if (phase === 'base') items.push('Option: split it 50/50 with Row or SkiErg to spare your legs.');
      items.push('Finish with 6 × 20 s strides.');
      return S({ type: 'run', title: `Easy run ${m} min`, duration: m + 5, items });
    }

    case 'stations': {
      if (raceWeek) return S({ type: 'hyrox', title: 'Station primer', duration: 30, items: ['Easy 10 min jog', '2 rounds, smooth not hard: 250 m SkiErg · 15 m Sled Push · 15 m Sled Pull · 10 Wall Balls', 'Practise transitions and pacing. Leave feeling fresh.'] });
      const pairIdx = wk % 2 === 0 ? [0, 1] : [2, 3];
      const sts = pairIdx.flatMap((i) => PAIRS[i]).map((id) => stationById[id]);
      if (phase === 'taper') {
        return S({ type: 'hyrox', title: 'Crisp compromised runs', duration: 40, items: [`4 rounds: 500 m @ ${paceText(pc, 'race')}, then 50% of:`, ...sts.map((s) => `${s.name}: ${stAmt(s, 0.5)}`), 'Quality over fatigue. Smooth transitions.'] });
      }
      if (phase === 'base') {
        const rounds = deload ? 2 : 3;
        return S({ type: 'hyrox', title: 'Station skills circuit', duration: 50, items: [
          `${rounds} rounds at RPE 6–7, focus on technique:`, '500 m run (easy-moderate)', ...sts.map((s) => `${s.name}: ${stAmt(s, 0.5)}`),
          `Sled at race weight or lighter (race: push ${st.push} kg / pull ${st.pull} kg).`] });
      }
      const frac = phase === 'peak' ? 1 : (0.6 + 0.4 * p) * (deload ? 0.7 : 1);
      const items = [`1 km run @ ${paceText(pc, 'race')} before every station:`, ...sts.map((s) => `1 km run → ${s.name}: ${stAmt(s, frac)}`)];
      if (phase === 'build' && p > 0.5 && !deload) items.push('Feeling good? Rest 4 min and repeat the first two stations.');
      items.push('Note how your run pace drops after each station. That is the gap you are closing.');
      return S({ type: 'hyrox', title: phase === 'peak' ? 'Race-specific station run' : 'Compromised running', duration: 55, items });
    }

    case 'long': {
      if (raceWeek) return S({ type: 'run', title: 'Shakeout', duration: 20, items: ['15–20 min very easy + 4 strides', 'Mobility, lay out kit, carb up.'] });
      const half = wk % 4 < 2 ? STATIONS.slice(0, 4) : STATIONS.slice(4);
      if (phase === 'taper') return S({ type: 'sim', title: 'Race-pace primer', duration: 45, items: [`4 × (1 km @ ${paceText(pc, 'race')} + 50% station)`, ...half.map((s) => `${s.name}: ${stAmt(s, 0.5)}`), 'Stop while it still feels easy.'] });
      if (phase === 'base') {
        if (wk % 2 === 0) { const m = Math.round(((50 + p * 25) * dl) / 5) * 5; return S({ type: 'run', title: `Long run ${m} min`, duration: m, items: [`${m} min @ ${paceText(pc, 'z2')}`, 'Fuel practice: try your race-day breakfast beforehand.'] }); }
        return S({ type: 'hyrox', title: 'Aerobic mixed session', duration: 60, items: [`${deload ? 2 : 3} rounds at RPE 5–6, no stopping:`, '10 min run', '5 min SkiErg or Row (alternate rounds)', '20 Wall Balls + 20 m Sandbag Lunges', '2 min easy walk'] });
      }
      if (phase === 'build') {
        if (wk % 2 === 0 && !deload) return S({ type: 'sim', title: 'Half simulation', duration: 55, items: [`Race order, at race weights, log your splits:`, ...half.map((s) => `1 km run → ${s.name}: ${stAmt(s, 1)}`), 'Target: even run splits. Log total time.'] });
        const m = Math.round(((60 + p * 15) * dl) / 5) * 5;
        return S({ type: 'run', title: `Long run ${m} min`, duration: m, items: [`${m} min easy @ ${paceText(pc, 'z2')}`, deload ? 'Keep it all easy this week.' : `Last 15 min @ ${paceText(pc, 'thr')}`] });
      }
      // peak (r = 2..4)
      if (r === 3 || (c.peakLen < 3 && r === 2)) return S({ type: 'sim', title: 'Full race simulation', duration: 95, items: ['Full Hyrox in race order: 8 × (1 km run + station), race weights.', ...STATIONS.map((s) => `${s.name}: ${stAmt(s, 1)}`), 'Dress rehearsal: race kit, race breakfast, pacing plan. Log every split.'] });
      if (r === 2) return S({ type: 'sim', title: 'Half sim @ race pace', duration: 55, items: [...half.map((s) => `1 km @ ${paceText(pc, 'race')} → ${s.name}: ${stAmt(s, 1)}`), 'Run the transitions like race day.'] });
      return S({ type: 'run', title: 'Long run with race-pace blocks', duration: 70, items: ['20 min easy', `3 × 10 min @ ${paceText(pc, 'race')}, 3 min easy`, '10 min easy'] });
    }

    case 'lower':
    case 'upper':
    case 'full': {
      let sets, reps, pct;
      if (phase === 'base') { sets = 4; reps = 6; pct = 0.70 + 0.05 * p; }
      else if (phase === 'build') { sets = 4; reps = 5; pct = 0.77 + 0.05 * p; }
      else if (phase === 'peak') { sets = 3; reps = 3; pct = 0.85; }
      else if (r === 1) { sets = 3; reps = 3; pct = 0.80; }
      else { sets = 2; reps = 3; pct = 0.70; }
      if (deload) { sets -= 1; pct -= 0.1; }
      const lifts = [], items = [];
      if (kind === 'lower' || kind === 'full') lifts.push(lift('Back Squat', sets, reps, pct, 'squat'));
      if (kind === 'upper' || kind === 'full') lifts.push(lift('Bench Press', sets, reps, pct, 'bench'));
      if (kind === 'lower' && phase !== 'taper') {
        if (phase === 'build' && wk % 2 === 1 && !deload) lifts.push(lift('Deadlift', 3, 4, 0.80 + 0.05 * p, 'deadlift'));
        else lifts.push(lift('Romanian Deadlift', 3, phase === 'peak' ? 6 : 8, 0.55, 'deadlift'));
        lifts.push(phase === 'peak' ? lift('Box Jump', 4, 3) : lift('Bulgarian Split Squat', 3, 10));
        items.push(phase === 'base' ? 'Sled Push heavy: 4 × 20 m, walk back recovery'
          : phase === 'build' ? `Sandbag walking lunges: 3 × 20 m @ race weight (${st.lunges} kg)` : `Sled Push: 3 × 25 m @ race weight (${st.push} kg), fast`);
        items.push('Core: 3 × 45 s plank + 3 × 10 dead bugs');
      }
      if (kind === 'upper' && phase !== 'taper') {
        lifts.push(lift('Overhead Press', 3, phase === 'base' ? 8 : 6, phase === 'base' ? 0.67 : 0.72, 'ohp'));
        lifts.push(lift('Pull-up', 4, phase === 'base' ? 8 : 6));
        lifts.push(lift('Barbell Row', 3, 10));
        items.push(phase === 'base' ? 'Finisher: Wall Balls EMOM 8 min × 12 reps + Farmers Carry 4 × 50 m heavy'
          : phase === 'build' ? `Finisher: Wall Balls 4 × 30 unbroken (${st.wb}) + Farmers 3 × 100 m @ ${st.farmers} kg`
          : `Finisher: 100 Wall Balls for time (log it) + Sled Pull 4 × 25 m @ ${st.pull} kg`);
      }
      if (kind === 'full') {
        lifts.push(lift('Romanian Deadlift', 3, 8, 0.55, 'deadlift'));
        lifts.push(lift('Pull-up', 3, 8));
        items.push(`Finisher: Farmers Carry 4 × 50 m @ ${st.farmers} kg + Wall Balls 3 × 20`);
      }
      const title = { lower: 'Strength: Lower', upper: 'Strength: Upper', full: 'Strength: Full body' }[kind];
      const dur = phase === 'taper' ? 35 : deload ? 45 : 60;
      return S({ type: 'strength', title, duration: dur, lifts, items, note: state.profile.oneRM[kind === 'upper' ? 'bench' : 'squat'] ? '' : 'Add your 1-rep maxes in Settings to get exact weights.' });
    }
  }
  return S({ type: 'other', title: kind, duration: 30 });
}

// Day-of-week (0 = Sun) → session kind
function weekTemplate(days, longDay) {
  const T = {
    6: { 1: 'lower', 2: 'intervals', 3: 'stations', 4: 'upper', 5: 'z2', 6: 'long', 0: 'rest' },
    5: { 1: 'lower', 2: 'intervals', 3: 'stations', 4: 'upper', 5: 'rest', 6: 'long', 0: 'rest' },
    4: { 1: 'full', 2: 'intervals', 3: 'rest', 4: 'stations', 5: 'rest', 6: 'long', 0: 'rest' },
    3: { 1: 'full', 2: 'rest', 3: 'stations', 4: 'rest', 5: 'rest', 6: 'long', 0: 'rest' },
  }[days] || {};
  const t = { ...T };
  if (longDay === 0) { [t[6], t[0]] = [t[0], t[6]]; }
  return t;
}

let planCache = null;
function getPlan() {
  const p = state.profile;
  const sig = JSON.stringify([p.raceDate, p.planStart, p.days, p.longDay, p.fiveK, p.oneRM, p.unit, p.division, p.category, todayISO()]);
  if (planCache && planCache.sig === sig) return planCache;
  const start = mondayOf(p.planStart || todayISO());
  const raceWeek = mondayOf(p.raceDate);
  const N = Math.floor(daysBetween(start, raceWeek) / 7) + 1;
  const weeks = [];
  const byDate = new Map();
  if (N >= 1 && N <= 80) {
    const pre = Math.max(0, N - 5);
    const baseLen = Math.ceil(pre * 0.45);
    const phaseOf = (i) => {
      const r = N - 1 - i;
      if (r <= 1) return 'taper';
      if (r <= 4) return 'peak';
      return i < baseLen ? 'base' : 'build';
    };
    const lens = {}, firsts = {};
    for (let i = 0; i < N; i++) { const ph = phaseOf(i); lens[ph] = (lens[ph] || 0) + 1; if (firsts[ph] == null) firsts[ph] = i; }
    const tpl = weekTemplate(+p.days, +p.longDay);
    for (let i = 0; i < N; i++) {
      const phase = phaseOf(i), r = N - 1 - i;
      const p01 = lens[phase] > 1 ? (i - firsts[phase]) / (lens[phase] - 1) : 1;
      const deload = (phase === 'base' || phase === 'build') && (i + 1) % 4 === 0 && r > 5;
      const ws = addDays(start, i * 7);
      const ctx = { phase, p: p01, deload, wk: i, r, peakLen: lens.peak || 0 };
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(ws, d);
        if (date > p.raceDate) break;
        const dow = parseISO(date).getDay();
        let s;
        const toRace = daysBetween(date, p.raceDate);
        if (toRace === 0) s = { kind: 'race', type: 'race', title: 'RACE DAY', duration: 90, items: ['Warm up 15 min: easy jog, drills, a few strides, 10 wall balls.', 'Go out controlled on run 1. The race starts at the sled.', 'Fuel: carbs 2–3 h before; a gel around station 4 if you use them.', 'Log your splits afterwards. You earned it.'], lifts: [] };
        else if (toRace === 1) s = buildSession('rest', ctx), s.items = ['Rest. 10–15 min shakeout jog if you like.', 'Hydrate, carb-load, prep kit and check-in details.'];
        else if (toRace === 2 && r === 0) s = buildSession('rest', ctx);
        else s = buildSession(tpl[dow] || 'rest', ctx);
        s.key = `${date}#0`;
        s.date = date;
        days.push({ date, sessions: [s] });
        byDate.set(date, [s]);
      }
      weeks.push({ idx: i, start: ws, phase, deload, r, days });
    }
  }
  planCache = { sig, weeks, byDate, N };
  return planCache;
}
function weekOf(date) {
  const plan = getPlan();
  return plan.weeks.find((w) => date >= w.start && date <= addDays(w.start, 6)) || null;
}
const workoutForKey = (key) => state.workouts.find((w) => w.planKey === key);
function sessionStatus(s) {
  if (s.type === 'rest') return 'rest';
  if (workoutForKey(s.key)) return 'done';
  const t = todayISO();
  if (s.date < t) return 'missed';
  if (s.date === t) return 'today';
  return 'upcoming';
}

/* =====================================================================
   Derived data
   ===================================================================== */
const e1rm = (w, r) => (!w || !r ? 0 : r === 1 ? w : w * (1 + Math.min(r, 12) / 30));
function liftHistory() {
  const map = new Map();
  for (const w of state.workouts) {
    for (const l of w.lifts || []) {
      const name = (l.exercise || '').trim();
      if (!name) continue;
      const sets = (l.sets || []).filter((s) => num(s.w) != null && num(s.r));
      if (!sets.length) continue;
      const best = Math.max(...sets.map((s) => e1rm(num(s.w), num(s.r))));
      const top = Math.max(...sets.map((s) => num(s.w)));
      const vol = sum(sets, (s) => num(s.w) * num(s.r));
      if (!map.has(name)) map.set(name, []);
      map.get(name).push({ date: w.date, best, top, vol, sets, workoutId: w.id });
    }
  }
  for (const arr of map.values()) arr.sort((a, b) => a.date.localeCompare(b.date));
  return map;
}
const bestE1rm = (hist, name) => Math.max(0, ...(hist.get(name) || []).map((h) => h.best));

function weekBuckets(n) {
  const thisMon = mondayOf(todayISO());
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) weeks.push(addDays(thisMon, -7 * i));
  return weeks;
}

function foodForDate(d) { return state.food.filter((f) => f.date === d); }
function dayTotals(d) {
  const items = foodForDate(d);
  return { cal: sum(items, (f) => f.cal), p: sum(items, (f) => f.p), c: sum(items, (f) => f.c), f: sum(items, (f) => f.f), n: items.length };
}
function suggestTargets(p) {
  const bwKg = p.bodyweight ? (p.unit === 'lb' ? p.bodyweight / 2.2046 : p.bodyweight) : null;
  if (!bwKg) return null;
  const perKg = { 3: 31, 4: 33, 5: 35, 6: 37 }[p.days] || 34;
  const cal = Math.round((bwKg * perKg) / 50) * 50;
  const prot = Math.round(bwKg * 2);
  const fat = Math.round(bwKg * 0.9);
  const carb = Math.max(0, Math.round((cal - prot * 4 - fat * 9) / 4));
  return { cal, p: prot, c: carb, f: fat };
}
function targets() {
  const t = state.profile.targets;
  const s = suggestTargets(state.profile) || { cal: 2600, p: 160, c: 300, f: 75 };
  return { cal: t.cal || s.cal, p: t.p || s.p, c: t.c || s.c, f: t.f || s.f };
}

/* =====================================================================
   UI plumbing
   ===================================================================== */
let tab = 'today';
const ui = { planWeek: null, foodDate: todayISO(), trainSeg: 'history', progressLift: null, progressStation: 'total' };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function openSheet(title, html, onMount) {
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  $('#sheetBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#sheetBody').scrollTop = 0;
  onMount && onMount($('#sheetBody'));
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheetBackdrop').hidden = true;
  document.body.style.overflow = '';
  hideTip();
}
$('#sheetClose').addEventListener('click', closeSheet);
$('#sheetBackdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

function go(t) {
  tab = t;
  $$('.tabbar button').forEach((b) => { if (b.dataset.tab === t) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
$('#settingsBtn').addEventListener('click', () => go('settings'));

function applyTheme() {
  const t = state.profile.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function renderCountdown() {
  const p = state.profile;
  const el = $('#countdown');
  if (!p.setup) { el.innerHTML = ''; return; }
  const d = daysBetween(todayISO(), p.raceDate);
  el.innerHTML = d > 0 ? `<b>${d}</b> days to race` : d === 0 ? '<b>Race day</b>' : 'Race done · <b>set next</b>';
}

function render() {
  applyTheme();
  renderCountdown();
  const v = $('#view');
  if (!state.profile.setup && tab !== 'settings') { v.innerHTML = viewWelcome(); mountWelcome(v); return; }
  const views = { today: viewToday, plan: viewPlan, log: viewTrain, food: viewFood, progress: viewProgress, settings: viewSettings };
  v.innerHTML = views[tab]();
  mounts[tab] && mounts[tab](v);
}
const mounts = {};

/* =====================================================================
   Session card (shared by Today and Plan)
   ===================================================================== */
function sessionCard(s, { actions = true } = {}) {
  const status = sessionStatus(s);
  const w = workoutForKey(s.key);
  const meta = [];
  if (s.duration) meta.push(`~${fmtMin(s.duration)}`);
  meta.push(TYPES[s.type]?.name || (s.type === 'rest' ? 'Recovery' : s.type));
  const statusBadge = status === 'done' ? '<span class="badge good">✓ Done</span>' : status === 'missed' ? '<span class="badge">Missed</span>' : '';
  let body = '';
  if (s.lifts?.length) body += `<ul>${s.lifts.map((l) => `<li>${liftLine(l)}</li>`).join('')}</ul>`;
  if (s.items?.length) body += `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (s.note) body += `<div class="notes">${esc(s.note)}</div>`;
  let act = '';
  if (actions && s.type !== 'rest') {
    act = w
      ? `<div class="row wrap"><span class="small muted">Logged: ${esc(workoutSummary(w))}</span><span class="spacer"></span><button class="btn sm" data-view-workout="${w.id}">View</button></div>`
      : `<div class="row wrap"><button class="btn primary" data-log-plan="${s.key}">Log workout</button><button class="btn" data-quick-done="${s.key}">Mark done</button></div>`;
  } else if (actions && s.type === 'rest') {
    act = `<button class="btn sm ghost" data-log-new="${s.date}">Log something anyway</button>`;
  }
  return `<article class="session type-${s.type} ${status}">
    <div class="card-head"><h3>${esc(s.title)}</h3>${statusBadge}</div>
    <div class="meta">${meta.map(esc).join(' · ')}</div>
    ${body}${act}
  </article>`;
}
function workoutSummary(w) {
  const bits = [];
  if (w.duration) bits.push(fmtMin(w.duration));
  if (w.distance) bits.push(`${round1(w.distance)} km`);
  if (w.totalTime) bits.push(fmtTime(w.totalTime));
  if (w.lifts?.length) bits.push(`${w.lifts.length} lift${w.lifts.length > 1 ? 's' : ''}`);
  if (w.rpe) bits.push(`RPE ${w.rpe}`);
  return bits.join(' · ') || TYPES[w.type]?.name || '';
}
function bindSessionActions(root) {
  $$('[data-log-plan]', root).forEach((b) => b.addEventListener('click', () => {
    const s = findSession(b.dataset.logPlan);
    s && openWorkoutForm(fromPlan(s));
  }));
  $$('[data-quick-done]', root).forEach((b) => b.addEventListener('click', () => {
    const s = findSession(b.dataset.quickDone);
    if (!s) return;
    const w = fromPlan(s);
    w.id = uid();
    w.lifts = (w.lifts || []).filter((l) => l.sets.every((x) => x.w !== ''));
    state.workouts.push(w);
    save();
    toast('Marked done. Nice work.');
    render();
  }));
  $$('[data-view-workout]', root).forEach((b) => b.addEventListener('click', () => openWorkoutDetail(b.dataset.viewWorkout)));
}
function findSession(key) {
  const date = key.split('#')[0];
  return (getPlan().byDate.get(date) || []).find((s) => s.key === key);
}
function fromPlan(s) {
  return {
    date: s.date, type: s.type === 'race' ? 'race' : s.type, title: s.title, duration: s.duration || null,
    planKey: s.key, rpe: null, notes: '',
    lifts: (s.lifts || []).map((l) => ({ exercise: l.exercise, sets: Array.from({ length: l.sets }, () => ({ w: l.weight ?? '', r: l.reps })) })),
  };
}

/* =====================================================================
   Welcome / setup
   ===================================================================== */
function viewWelcome() {
  const p = state.profile;
  return `
  <div class="hero" style="margin-top:8px">
    <span class="eyebrow">Let's set you up</span>
    <h1>Build your Hyrox plan</h1>
    <p class="muted">A periodised plan to race day: Hyrox-focused, with two days of normal lifting kept in. You can change any of this later in Settings.</p>
  </div>
  <form class="card form" id="setupForm">
    <div class="grid-2">
      <label class="field"><span>Race date</span><input type="date" name="raceDate" value="${p.raceDate}" required></label>
      <label class="field"><span>Training days / week</span>
        <select name="days">${[3, 4, 5, 6].map((d) => `<option value="${d}" ${+p.days === d ? 'selected' : ''}>${d} days</option>`).join('')}</select></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Division</span><select name="division"><option value="open">Open</option><option value="pro">Pro</option><option value="doubles">Doubles / Relay</option></select></label>
      <label class="field"><span>Category</span><select name="category"><option value="men">Men</option><option value="women">Women</option></select></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Units</span><select name="unit"><option value="kg">kg</option><option value="lb">lb</option></select></label>
      <label class="field"><span>Bodyweight</span><input type="number" inputmode="decimal" step="0.1" name="bodyweight" placeholder="e.g. 80"></label>
    </div>
    <label class="field"><span>Recent 5K time</span><input type="text" name="fiveK" placeholder="mm:ss, e.g. 23:30"><small>Sets your run paces. Leave blank to train by effort (RPE).</small></label>
    <div>
      <div class="field"><span>Current 1-rep maxes (optional, for exact lifting weights)</span></div>
      <div class="grid-2" style="margin-top:6px">
        ${Object.entries(LIFT_REFS).map(([k, n]) => `<label class="field"><span>${n}</span><input type="number" inputmode="decimal" step="0.5" name="orm_${k}" placeholder="—"></label>`).join('')}
      </div>
    </div>
    <button class="btn primary block" type="submit">Build my plan</button>
  </form>`;
}
function mountWelcome(v) {
  $('#setupForm', v).addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const p = state.profile;
    p.raceDate = f.get('raceDate');
    if (daysBetween(todayISO(), p.raceDate) < 7) { toast('Pick a race date at least a week away.'); return; }
    p.days = +f.get('days');
    p.division = f.get('division');
    p.category = f.get('category');
    p.unit = f.get('unit');
    p.bodyweight = num(f.get('bodyweight'));
    p.fiveK = f.get('fiveK').trim();
    for (const k of Object.keys(LIFT_REFS)) p.oneRM[k] = num(f.get('orm_' + k));
    p.planStart = mondayOf(todayISO());
    p.setup = true;
    if (p.bodyweight) state.weights.push({ id: uid(), date: todayISO(), w: p.bodyweight });
    save();
    toast('Plan built. Here is today.');
    go('today');
  });
}

/* =====================================================================
   Today
   ===================================================================== */
function viewToday() {
  const t = todayISO();
  const plan = getPlan();
  const wk = weekOf(t);
  const p = state.profile;
  const toRace = daysBetween(t, p.raceDate);
  let html = `<div class="hero">
    <span class="eyebrow">${fmtDate(t, { long: true })}</span>
    <h1>${toRace > 0 ? greeting() : toRace === 0 ? 'Race day. Go get it.' : 'Race complete'}</h1>
    ${wk ? `<div class="row wrap" style="margin-top:6px"><span class="phase-pill"><span class="dot" style="background:${PHASES[wk.phase].color}"></span>${PHASES[wk.phase].name} · Week ${wk.idx + 1} of ${plan.N}</span>${wk.deload ? '<span class="badge warn">Deload week</span>' : ''}</div>` : ''}
  </div>`;

  if (toRace < 0) {
    html += `<div class="callout">Your race date has passed. Set your next race in <a href="#" data-go="settings">Settings</a> to build a new plan. Your logs and progress are kept.</div>`;
  }

  const sessions = plan.byDate.get(t) || [];
  if (sessions.length) html += sessions.map((s) => sessionCard(s)).join('');
  else if (toRace >= 0) html += `<div class="card"><p class="muted">Nothing planned today.</p><button class="btn" data-log-new="${t}">Log a workout</button></div>`;

  const extra = state.workouts.filter((w) => w.date === t && !w.planKey);
  if (extra.length) html += `<div class="card"><h3>Also logged today</h3><div class="list">${extra.map(workoutItem).join('')}</div></div>`;

  // week strip
  if (wk) {
    const done = wk.days.flatMap((d) => d.sessions).filter((s) => s.type !== 'rest');
    const nDone = done.filter((s) => sessionStatus(s) === 'done').length;
    html += `<div class="card">
      <div class="card-head"><h3>This week</h3><span class="small muted num">${nDone}/${done.length} sessions</span></div>
      <div class="grid-7" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">
        ${wk.days.map((d) => {
          const s = d.sessions[0], st = sessionStatus(s);
          const ico = st === 'done' ? '<span class="status-ico done" style="margin:auto">✓</span>' : st === 'rest' ? '<span class="status-ico" style="margin:auto;color:var(--text-3)">–</span>' : st === 'missed' ? '<span class="status-ico missed" style="margin:auto">✕</span>' : `<span class="status-ico next" style="margin:auto;${d.date === t ? 'border-color:var(--accent)' : ''}"></span>`;
          return `<button class="clickable" data-plan-day="${d.date}" style="border:0;background:none;padding:2px;cursor:pointer" aria-label="${fmtDate(d.date, { dow: true })}: ${esc(s.title)}"><div class="small faint" style="font-weight:700">${DOW[parseISO(d.date).getDay()][0]}</div>${ico}<div class="faint" style="font-size:10px;margin-top:2px;line-height:1.1">${esc(shortKind(s))}</div></button>`;
        }).join('')}
      </div>
    </div>`;
  }

  // tomorrow
  const tm = plan.byDate.get(addDays(t, 1));
  if (tm && tm[0]) html += `<div class="card"><div class="card-head"><h3>Tomorrow</h3><span class="small muted">${esc(tm[0].title)}</span></div></div>`;

  // nutrition
  const tot = dayTotals(t), tg = targets();
  html += `<div class="card">
    <div class="card-head"><h3>Food today</h3><button class="btn sm" data-add-food>+ Add food</button></div>
    <div class="ring-row">
      ${meterBlock('Calories', tot.cal, tg.cal, '')}
      ${meterBlock('Protein', tot.p, tg.p, 'g')}
    </div>
  </div>`;

  html += `<div class="grid-2">
    <button class="btn" data-log-new="${t}">+ Log workout</button>
    <button class="btn" data-log-lifts>+ Log lifts</button>
    <button class="btn" data-add-weight>+ Bodyweight</button>
    <button class="btn" data-go="plan">Full plan →</button>
  </div>`;
  return html;
}
const shortKind = (s) => ({ lower: 'Lower', upper: 'Upper', full: 'Lift', intervals: 'Intervals', z2: 'Easy', stations: 'Stations', long: s.type === 'sim' ? 'Sim' : 'Long', rest: 'Rest', race: 'RACE' }[s.kind] || s.kind);
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function meterBlock(label, val, target, unit) {
  const pctv = target ? Math.round((val / target) * 100) : 0;
  return `<div class="macro">
    <div class="k"><span>${label}</span><b>${Math.round(val)}${unit} <span class="faint" style="font-weight:600">/ ${Math.round(target)}${unit}</span></b></div>
    <div class="meter ${pctv > 110 ? 'over' : ''}"><i style="width:${clamp(pctv, 0, 100)}%"></i></div>
  </div>`;
}
mounts.today = (v) => {
  bindSessionActions(v);
  bindCommon(v);
  $$('[data-plan-day]', v).forEach((b) => b.addEventListener('click', () => {
    const s = (getPlan().byDate.get(b.dataset.planDay) || [])[0];
    s && openSessionSheet(s);
  }));
};
function bindCommon(v) {
  $$('[data-go]', v).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); go(b.dataset.go); }));
  $$('[data-add-food]', v).forEach((b) => b.addEventListener('click', () => openFoodForm({ date: tab === 'food' ? ui.foodDate : todayISO() })));
  $$('[data-add-weight]', v).forEach((b) => b.addEventListener('click', openWeightForm));
  $$('[data-log-lifts]', v).forEach((b) => b.addEventListener('click', () => openWorkoutForm({ date: todayISO(), type: 'strength', title: 'Lifting', lifts: [{ exercise: '', sets: [{ w: '', r: '' }] }] })));
  $$('[data-log-new]', v).forEach((b) => b.addEventListener('click', () => openWorkoutForm({ date: b.dataset.logNew })));
}
function openSessionSheet(s) {
  openSheet(fmtDate(s.date, { long: true }), sessionCard(s), (root) => {
    $$('[data-log-plan],[data-quick-done],[data-view-workout],[data-log-new]', root).forEach((b) => b.addEventListener('click', () => closeSheet(), { capture: true }));
    bindSessionActions(root);
    bindCommon(root);
  });
}

/* =====================================================================
   Plan
   ===================================================================== */
function viewPlan() {
  const plan = getPlan();
  if (!plan.weeks.length) return `<div class="callout">No plan yet. Set a future race date in <a href="#" data-go="settings">Settings</a>.</div>`;
  const cur = weekOf(todayISO());
  if (ui.planWeek == null || ui.planWeek >= plan.weeks.length) ui.planWeek = cur ? cur.idx : 0;
  const w = plan.weeks[ui.planWeek];
  const t = todayISO();
  const st = standardsFor(state.profile);
  const sessions = w.days.flatMap((d) => d.sessions).filter((s) => s.type !== 'rest');
  const mins = sum(sessions, (s) => s.duration);
  return `
  <div class="hero"><span class="eyebrow">Race ${fmtDate(state.profile.raceDate, { long: true })}</span><h1>Training plan</h1></div>
  <div class="card">
    <div class="phase-bar" role="list">
      ${plan.weeks.map((x) => `<i role="listitem" data-week="${x.idx}" title="Week ${x.idx + 1}: ${PHASES[x.phase].name}${x.deload ? ' (deload)' : ''}" style="--c:${PHASES[x.phase].color}" class="${x.idx === ui.planWeek ? 'cur' : cur && x.idx < cur.idx ? 'past' : ''}"></i>`).join('')}
    </div>
    <div class="phase-legend">${Object.entries(PHASES).filter(([k]) => plan.weeks.some((x) => x.phase === k)).map(([, ph]) => `<span><i class="dot" style="background:${ph.color}"></i>${ph.name}</span>`).join('')}</div>
  </div>
  <div class="week-nav">
    <button class="icon-btn" data-wk="-1" aria-label="Previous week" ${ui.planWeek === 0 ? 'disabled' : ''}>‹</button>
    <h2>Week ${w.idx + 1} · ${fmtDate(w.start)}–${fmtDate(addDays(w.start, 6))}</h2>
    <button class="icon-btn" data-wk="1" aria-label="Next week" ${ui.planWeek === plan.weeks.length - 1 ? 'disabled' : ''}>›</button>
  </div>
  <div class="callout neutral">
    <div class="row wrap"><span class="phase-pill"><span class="dot" style="background:${PHASES[w.phase].color}"></span>${PHASES[w.phase].name}</span>${w.deload ? '<span class="badge warn">Deload</span>' : ''}${w.r === 0 ? '<span class="badge accent">Race week</span>' : ''}<span class="spacer"></span><span class="small muted num">${sessions.length} sessions · ~${fmtMin(mins)}</span></div>
    <p class="small muted" style="margin-top:6px">${w.deload ? 'Lighter week: fewer sets and reps so you absorb the last three weeks.' : PHASES[w.phase].blurb}</p>
  </div>
  <div>
    ${w.days.map((d) => {
      const s = d.sessions[0], status = sessionStatus(s), dd = parseISO(d.date);
      const ico = status === 'done' ? '<span class="status-ico done">✓</span>' : status === 'missed' ? '<span class="status-ico missed">✕</span>' : status === 'rest' ? '' : '<span class="status-ico next"></span>';
      return `<button class="day type-${s.type} ${d.date === t ? 'today' : ''}" data-day="${d.date}">
        <div class="date"><span>${DOW[dd.getDay()]}</span><b>${dd.getDate()}</b></div>
        <div><div class="title"><span class="dot" style="background:var(--type)"></span>${esc(s.title)}</div><div class="sub">${s.type === 'rest' ? 'Recovery' : `~${fmtMin(s.duration)}${s.lifts.length ? ' · ' + s.lifts.slice(0, 2).map((l) => l.exercise).join(', ') : ''}`}</div></div>
        ${ico}
      </button>`;
    }).join('')}
  </div>
  <div class="card">
    <h3>Race standards · ${state.profile.division === 'pro' ? 'Pro' : 'Open'} ${state.profile.category === 'women' ? 'Women' : 'Men'}</h3>
    <dl class="kv">
      ${STATIONS.map((s) => `<dt>${s.name}</dt><dd>${stAmt(s, 1)}${s.id === 'push' ? ` · ${st.push} kg` : s.id === 'pull' ? ` · ${st.pull} kg` : s.id === 'farmers' ? ` · ${st.farmers} kg` : s.id === 'lunges' ? ` · ${st.lunges} kg` : s.id === 'wb' ? ` · ${st.wb}` : ''}</dd>`).join('')}
      <dt>Running</dt><dd>8 × 1 km</dd>
    </dl>
    <p class="small faint">Sled weights include the sled. ${state.profile.division === 'doubles' ? 'Doubles and relay use the Open weights for your category. ' : ''}Check the current season's rulebook for changes.</p>
  </div>`;
}
mounts.plan = (v) => {
  bindCommon(v);
  $$('[data-wk]', v).forEach((b) => b.addEventListener('click', () => { ui.planWeek += +b.dataset.wk; render(); }));
  $$('[data-week]', v).forEach((b) => b.addEventListener('click', () => { ui.planWeek = +b.dataset.week; render(); }));
  $$('[data-day]', v).forEach((b) => b.addEventListener('click', () => {
    const s = (getPlan().byDate.get(b.dataset.day) || [])[0];
    s && openSessionSheet(s);
  }));
};

/* =====================================================================
   Train: history / lifts / body
   ===================================================================== */
function workoutItem(w) {
  const t = TYPES[w.type] || TYPES.other;
  const color = CATS.find((c) => c.key === t.cat).color;
  return `<div class="item clickable" data-workout="${w.id}">
    <span class="dot" style="background:${color}"></span>
    <div class="main"><div class="t">${esc(w.title || t.name)}</div><div class="s">${relDay(w.date)} · ${esc(workoutSummary(w))}</div></div>
    ${w.planKey ? '<span class="badge good">Plan</span>' : ''}
  </div>`;
}
function viewTrain() {
  const seg = ui.trainSeg;
  let html = `<div class="row"><h1>Train</h1><span class="spacer"></span>
    <button class="btn primary sm" data-log-new="${todayISO()}">+ Workout</button></div>
  <div class="seg" role="group">
    ${[['history', 'Workouts'], ['lifts', 'Lifts'], ['body', 'Body']].map(([k, n]) => `<button data-seg="${k}" aria-pressed="${seg === k}">${n}</button>`).join('')}
  </div>`;
  if (seg === 'history') {
    const ws = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
    html += ws.length ? `<div class="card"><div class="list">${ws.slice(0, 200).map(workoutItem).join('')}</div></div>` : `<div class="card empty">No workouts yet. Log today's session from the Today tab, or tap “+ Workout”.</div>`;
  } else if (seg === 'lifts') {
    const hist = liftHistory();
    const names = [...hist.keys()].sort((a, b) => hist.get(b).at(-1).date.localeCompare(hist.get(a).at(-1).date));
    html += `<button class="btn block" data-log-lifts>+ Log lifts</button>`;
    html += names.length ? `<div class="card"><div class="list">${names.map((n) => {
      const h = hist.get(n), last = h.at(-1), best = bestE1rm(hist, n);
      const lastTop = last.sets.reduce((a, s) => (num(s.w) > num(a.w) ? s : a), last.sets[0]);
      return `<div class="item clickable" data-lift="${esc(n)}">
        <div class="main"><div class="t">${esc(n)}</div><div class="s">Last ${relDay(last.date)}: ${num(lastTop.w)} ${U()} × ${num(lastTop.r)} · ${h.length} session${h.length > 1 ? 's' : ''}</div></div>
        <div class="r">${best ? Math.round(best) : '–'} <span class="faint small">${U()} e1RM</span></div>
      </div>`;
    }).join('')}</div></div>` : `<div class="card empty">No lifts logged yet. Strength days in your plan pre-fill the exercises and weights for you.</div>`;
  } else {
    const ws = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
    html += `<button class="btn block" data-add-weight>+ Log bodyweight</button>`;
    if (ws.length >= 2) html += `<div class="card"><div class="card-head"><h3>Bodyweight</h3><span class="small muted num">${ws.at(-1).w} ${U()}</span></div><div class="chart" data-chart="weight"></div></div>`;
    html += ws.length ? `<div class="card"><div class="list">${[...ws].reverse().map((x) => `<div class="item"><div class="main"><div class="t num">${x.w} ${U()}</div><div class="s">${fmtDate(x.date, { dow: true })}</div></div><button class="link" data-del-weight="${x.id}" aria-label="Delete">✕</button></div>`).join('')}</div></div>` : `<div class="card empty">Log your weight a couple of times a week, same time of day, to see the trend.</div>`;
  }
  return html;
}
mounts.log = (v) => {
  bindCommon(v);
  $$('[data-seg]', v).forEach((b) => b.addEventListener('click', () => { ui.trainSeg = b.dataset.seg; render(); }));
  $$('[data-workout]', v).forEach((b) => b.addEventListener('click', () => openWorkoutDetail(b.dataset.workout)));
  $$('[data-lift]', v).forEach((b) => b.addEventListener('click', () => openLiftDetail(b.dataset.lift)));
  $$('[data-del-weight]', v).forEach((b) => b.addEventListener('click', () => {
    if (!confirm('Delete this bodyweight entry?')) return;
    state.weights = state.weights.filter((x) => x.id !== b.dataset.delWeight); save(); render();
  }));
  const wc = $('[data-chart="weight"]', v);
  if (wc) drawWeightChart(wc);
};

function drawWeightChart(el) {
  const ws = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  lineChart(el, { points: ws.map((x) => ({ x: x.date, y: x.w })), yFmt: (y) => `${round1(y)} ${U()}`, color: 'var(--s1)', name: 'Bodyweight', mark: 'latest' });
}

function openLiftDetail(name) {
  const h = liftHistory().get(name) || [];
  const best = Math.max(...h.map((x) => x.best));
  openSheet(name, `
    <div class="grid-2">
      <div class="stat"><div class="label">Best e1RM</div><div class="value">${Math.round(best)}<small>${U()}</small></div></div>
      <div class="stat"><div class="label">Heaviest set</div><div class="value">${Math.max(...h.map((x) => x.top))}<small>${U()}</small></div></div>
    </div>
    ${h.length >= 2 ? `<div class="card" style="margin-top:12px"><h3>Estimated 1RM</h3><div class="chart" data-chart="lift"></div></div>` : ''}
    <div class="card" style="margin-top:12px"><h3>History</h3><div class="list">
      ${[...h].reverse().map((x) => `<div class="item"><div class="main"><div class="t">${fmtDate(x.date, { dow: true })}</div><div class="s num">${x.sets.map((s) => `${num(s.w)}×${num(s.r)}`).join(', ')}</div></div><div class="r">${Math.round(x.best)} <span class="faint small">e1RM</span>${x.best === best ? ' <span class="badge accent">PR</span>' : ''}</div></div>`).join('')}
    </div></div>
    <p class="small faint" style="margin-top:10px">e1RM uses the Epley formula on your best set; sets over 12 reps are capped at 12.</p>`, (root) => {
    const c = $('[data-chart="lift"]', root);
    if (c) lineChart(c, { points: h.map((x) => ({ x: x.date, y: x.best })), yFmt: (y) => `${Math.round(y)} ${U()}`, color: 'var(--s3)', name: 'e1RM' });
  });
}

/* =====================================================================
   Workout form
   ===================================================================== */
function openWorkoutForm(init = {}) {
  const w = Object.assign({ date: todayISO(), type: 'run', title: '', duration: null, distance: null, rpe: null, notes: '', lifts: [], splits: {} }, JSON.parse(JSON.stringify(init)));
  const editing = !!w.id;
  const showDist = (t) => ['run', 'hyrox', 'sim', 'race', 'erg'].includes(t);
  const showSplits = (t) => ['sim', 'race'].includes(t);
  const html = `
  <form class="form" id="wForm">
    <div class="grid-2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${w.date}" required></label>
      <label class="field"><span>Type</span><select name="type">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}" ${w.type === k ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Title</span><input type="text" name="title" value="${esc(w.title)}" placeholder="e.g. 5 × 1 km threshold"></label>
    <div class="grid-2">
      <label class="field"><span>Duration (min)</span><input type="number" inputmode="decimal" name="duration" value="${w.duration ?? ''}" min="0" step="1"></label>
      <label class="field" data-show="dist"><span>Distance (km)</span><input type="number" inputmode="decimal" name="distance" value="${w.distance ?? ''}" min="0" step="0.01"><small>Running distance</small></label>
    </div>
    <label class="field"><span>Effort (RPE): <span class="rpe-out" id="rpeOut">${w.rpe || '–'}</span></span><input type="range" name="rpe" min="1" max="10" step="1" value="${w.rpe || 6}" data-touched="${w.rpe ? 1 : 0}"></label>
    <div data-show="splits" class="card" style="padding:12px">
      <h3>Hyrox splits</h3>
      <label class="field"><span>Total time</span><input type="text" name="totalTime" value="${w.totalTime ? fmtTime(w.totalTime) : ''}" placeholder="h:mm:ss, e.g. 1:18:40"></label>
      <p class="small faint">Station times (m:ss). Optional; fill in what you have.</p>
      <div class="split-grid">${STATIONS.map((s) => `<label class="field"><span>${s.name}</span><input type="text" inputmode="numeric" name="sp_${s.id}" value="${w.splits?.[s.id] ? fmtTime(w.splits[s.id]) : ''}" placeholder="m:ss"></label>`).join('')}</div>
      <label class="field"><span>Total running (all 8 km)</span><input type="text" name="sp_run" value="${w.splits?.run ? fmtTime(w.splits.run) : ''}" placeholder="m:ss"></label>
    </div>
    <div>
      <div class="card-head"><h3>Lifts</h3><button type="button" class="btn sm" id="addLift">+ Exercise</button></div>
      <div id="liftList" style="margin-top:8px"></div>
    </div>
    <label class="field"><span>Notes</span><textarea name="notes" placeholder="How did it feel? Paces, weights, anything to remember.">${esc(w.notes)}</textarea></label>
    <datalist id="liftNames">${[...new Set([...liftHistory().keys(), ...COMMON_LIFTS])].map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="form-actions">
      ${editing ? '<button type="button" class="btn danger" id="delW">Delete</button>' : ''}
      <button type="submit" class="btn primary">${editing ? 'Save changes' : 'Save workout'}</button>
    </div>
  </form>`;
  openSheet(editing ? 'Edit workout' : w.planKey ? 'Log planned workout' : 'Log workout', html, (root) => {
    const form = $('#wForm', root);
    const lifts = w.lifts.length ? w.lifts : [];
    const sync = () => {
      const t = form.type.value;
      $('[data-show="dist"]', form).classList.toggle('hidden', !showDist(t));
      $('[data-show="splits"]', form).classList.toggle('hidden', !showSplits(t));
    };
    form.type.addEventListener('change', () => {
      sync();
      if (form.type.value === 'strength' && !lifts.length) { lifts.push({ exercise: '', sets: [{ w: '', r: '' }] }); drawLifts(); }
    });
    sync();
    form.rpe.addEventListener('input', () => { form.rpe.dataset.touched = 1; $('#rpeOut', form).textContent = form.rpe.value; });

    const readLifts = () => {
      $$('.lift-block', form).forEach((blk, i) => {
        lifts[i].exercise = $('[data-ex]', blk).value;
        lifts[i].sets = $$('.set-row', blk).map((row) => ({ w: $('[data-w]', row).value, r: $('[data-r]', row).value }));
      });
    };
    const drawLifts = () => {
      $('#liftList', form).innerHTML = lifts.length ? lifts.map((l, i) => `
        <div class="lift-block" data-i="${i}">
          <div class="head"><input type="text" data-ex list="liftNames" value="${esc(l.exercise)}" placeholder="Exercise"><button type="button" class="icon-btn" data-rm-lift="${i}" aria-label="Remove exercise">✕</button></div>
          <div class="set-head"><span>Set</span><span>${U()}</span><span>Reps</span><span></span></div>
          ${l.sets.map((s, j) => `<div class="set-row"><span class="n">${j + 1}</span><input type="number" inputmode="decimal" step="0.5" data-w value="${esc(s.w)}" placeholder="${U()}"><input type="number" inputmode="numeric" step="1" data-r value="${esc(s.r)}" placeholder="reps"><button type="button" class="icon-btn" data-rm-set="${i}:${j}" aria-label="Remove set">−</button></div>`).join('')}
          <button type="button" class="btn sm ghost" data-add-set="${i}" style="margin-top:6px">+ Set</button>
        </div>`).join('') : '<p class="small faint">Add exercises if you lifted. Strength sessions from your plan come pre-filled.</p>';
      $$('[data-add-set]', form).forEach((b) => b.addEventListener('click', () => { readLifts(); const L = lifts[+b.dataset.addSet]; L.sets.push({ ...(L.sets.at(-1) || { w: '', r: '' }) }); drawLifts(); }));
      $$('[data-rm-set]', form).forEach((b) => b.addEventListener('click', () => { readLifts(); const [i, j] = b.dataset.rmSet.split(':').map(Number); lifts[i].sets.splice(j, 1); if (!lifts[i].sets.length) lifts.splice(i, 1); drawLifts(); }));
      $$('[data-rm-lift]', form).forEach((b) => b.addEventListener('click', () => { readLifts(); lifts.splice(+b.dataset.rmLift, 1); drawLifts(); }));
    };
    drawLifts();
    $('#addLift', form).addEventListener('click', () => { readLifts(); lifts.push({ exercise: '', sets: [{ w: '', r: '' }] }); drawLifts(); $$('[data-ex]', form).at(-1).focus(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      readLifts();
      const hist = liftHistory();
      const t = form.type.value;
      const out = {
        id: w.id || uid(), created: w.created || Date.now(),
        date: form.date.value, type: t, title: form.title.value.trim() || TYPES[t].name,
        duration: num(form.duration.value), distance: showDist(t) ? num(form.distance.value) : null,
        rpe: +form.rpe.dataset.touched ? +form.rpe.value : null, notes: form.notes.value.trim(),
        planKey: w.planKey || null,
        lifts: lifts.map((l) => ({ exercise: l.exercise.trim(), sets: l.sets.filter((s) => s.w !== '' || s.r !== '') })).filter((l) => l.exercise && l.sets.length),
      };
      if (showSplits(t)) {
        out.totalTime = parseTime(form.totalTime.value);
        out.splits = {};
        for (const s of [...STATIONS.map((x) => x.id), 'run']) { const v = parseTime(form['sp_' + s].value); if (v) out.splits[s] = v; }
      }
      const i = state.workouts.findIndex((x) => x.id === out.id);
      if (i >= 0) state.workouts[i] = out; else state.workouts.push(out);
      save();
      // PR check
      const prs = [];
      for (const l of out.lifts) {
        const before = editing ? 0 : bestE1rm(hist, l.exercise);
        const now = Math.max(0, ...l.sets.map((s) => e1rm(num(s.w), num(s.r))));
        if (!editing && before && now > before) prs.push(`${l.exercise} ${Math.round(now)} ${U()}`);
      }
      closeSheet();
      toast(prs.length ? `New PR: ${prs.join(', ')} e1RM` : editing ? 'Workout updated' : 'Workout saved');
      render();
    });
    const del = $('#delW', form);
    del && del.addEventListener('click', () => {
      if (!confirm('Delete this workout?')) return;
      state.workouts = state.workouts.filter((x) => x.id !== w.id); save(); closeSheet(); toast('Workout deleted'); render();
    });
  });
}

function openWorkoutDetail(id) {
  const w = state.workouts.find((x) => x.id === id);
  if (!w) return;
  const rows = [];
  rows.push(['Date', fmtDate(w.date, { long: true })], ['Type', TYPES[w.type]?.name || w.type]);
  if (w.duration) rows.push(['Duration', fmtMin(w.duration)]);
  if (w.distance) rows.push(['Distance', `${round1(w.distance)} km`]);
  if (w.duration && w.distance && w.type === 'run') rows.push(['Avg pace', fmtPace((w.duration * 60) / w.distance)]);
  if (w.rpe) rows.push(['RPE', w.rpe]);
  if (w.totalTime) rows.push(['Total time', fmtTime(w.totalTime)]);
  const splits = w.splits && Object.keys(w.splits).length ? `<div class="card" style="margin-top:12px"><h3>Splits</h3><dl class="kv">${[...STATIONS, { id: 'run', name: 'Running total' }].filter((s) => w.splits[s.id]).map((s) => `<dt>${s.name}</dt><dd>${fmtTime(w.splits[s.id])}</dd>`).join('')}</dl></div>` : '';
  const lifts = w.lifts?.length ? `<div class="card" style="margin-top:12px"><h3>Lifts</h3><div class="list">${w.lifts.map((l) => `<div class="item"><div class="main"><div class="t">${esc(l.exercise)}</div><div class="s num">${l.sets.map((s) => `${s.w || '–'}×${s.r || '–'}`).join(', ')}</div></div></div>`).join('')}</div></div>` : '';
  openSheet(w.title || 'Workout', `
    <dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${splits}${lifts}
    ${w.notes ? `<div class="card" style="margin-top:12px"><h3>Notes</h3><p class="muted" style="white-space:pre-wrap">${esc(w.notes)}</p></div>` : ''}
    <div class="form-actions"><button class="btn" id="editW">Edit</button></div>`, (root) => {
    $('#editW', root).addEventListener('click', () => openWorkoutForm(w));
  });
}

/* =====================================================================
   Bodyweight
   ===================================================================== */
function openWeightForm() {
  const last = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  openSheet('Log bodyweight', `<form class="form" id="bwForm">
    <div class="grid-2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${todayISO()}" required></label>
      <label class="field"><span>Weight (${U()})</span><input type="number" inputmode="decimal" step="0.1" name="w" value="${last ? last.w : state.profile.bodyweight || ''}" required></label>
    </div>
    <div class="form-actions"><button class="btn primary" type="submit">Save</button></div>
  </form>`, (root) => {
    $('#bwForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, w = num(f.w.value);
      if (!w) return;
      state.weights = state.weights.filter((x) => x.date !== f.date.value);
      state.weights.push({ id: uid(), date: f.date.value, w });
      if (f.date.value >= (last?.date || '')) state.profile.bodyweight = w;
      save(); closeSheet(); toast('Bodyweight saved'); render();
    });
  });
}

/* =====================================================================
   Food
   ===================================================================== */
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
function recentFoods() {
  const map = new Map();
  for (const f of [...state.food].sort((a, b) => b.date.localeCompare(a.date))) {
    const k = f.name.toLowerCase();
    const e = map.get(k);
    if (e) e.n++; else map.set(k, { ...f, n: 1 });
  }
  return [...map.values()].sort((a, b) => b.n - a.n).slice(0, 10);
}
function viewFood() {
  const d = ui.foodDate;
  const tot = dayTotals(d), tg = targets();
  const items = foodForDate(d);
  const recents = recentFoods();
  const rem = Math.round(tg.cal - tot.cal);
  return `
  <div class="row"><h1>Food</h1><span class="spacer"></span><button class="btn primary sm" data-add-food>+ Food</button></div>
  <div class="date-nav">
    <button class="icon-btn" data-day="-1" aria-label="Previous day">‹</button>
    <h2>${relDay(d)}${d !== todayISO() && daysBetween(todayISO(), d) !== -1 ? '' : ` <span class="faint small">${fmtDate(d)}</span>`}</h2>
    <button class="icon-btn" data-day="1" aria-label="Next day" ${d >= todayISO() ? 'disabled' : ''}>›</button>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="cal-big"><b>${Math.round(tot.cal)}</b><span class="muted">/ ${tg.cal} kcal</span></div>
      <span class="small ${rem < 0 ? '' : 'muted'} num">${rem >= 0 ? `${rem} left` : `${-rem} over`}</span>
    </div>
    <div class="meter ${tot.cal > tg.cal * 1.1 ? 'over' : ''}"><i style="width:${clamp((tot.cal / tg.cal) * 100, 0, 100)}%"></i></div>
    <div class="macro-grid" style="margin-top:14px">
      ${meterBlock('Protein', tot.p, tg.p, 'g')}${meterBlock('Carbs', tot.c, tg.c, 'g')}${meterBlock('Fat', tot.f, tg.f, 'g')}
    </div>
  </div>
  ${recents.length ? `<div><div class="small muted" style="font-weight:650;margin:0 2px 6px">Quick add</div><div class="chips">${recents.map((f, i) => `<button class="chip" data-quick="${i}">+ ${esc(f.name)} <span class="faint">${Math.round(f.cal)}</span></button>`).join('')}</div></div>` : ''}
  ${MEALS.map((m) => {
    const list = items.filter((f) => (f.meal || 'Snacks') === m);
    return `<div class="card">
      <div class="card-head"><h3>${m}</h3><span class="small muted num">${Math.round(sum(list, (f) => f.cal))} kcal</span></div>
      ${list.length ? `<div class="list">${list.map((f) => `<div class="item clickable" data-food="${f.id}"><div class="main"><div class="t">${esc(f.name)}</div><div class="s num">P ${Math.round(f.p || 0)} · C ${Math.round(f.c || 0)} · F ${Math.round(f.f || 0)}</div></div><div class="r">${Math.round(f.cal || 0)}</div></div>`).join('')}</div>` : ''}
      <button class="btn sm ghost" data-add-meal="${m}">+ Add to ${m.toLowerCase()}</button>
    </div>`;
  }).join('')}
  ${!items.length && foodForDate(addDays(d, -1)).length ? `<button class="btn block" id="copyPrev">Copy everything from the day before</button>` : ''}
  <p class="small faint">Targets: ${tg.cal} kcal · ${tg.p} g protein · ${tg.c} g carbs · ${tg.f} g fat. ${state.profile.targets.cal ? 'Set in Settings.' : 'Suggested from bodyweight and training load; change in Settings.'}</p>`;
}
mounts.food = (v) => {
  bindCommon(v);
  $$('[data-day]', v).forEach((b) => b.addEventListener('click', () => { ui.foodDate = addDays(ui.foodDate, +b.dataset.day); render(); }));
  $$('[data-add-meal]', v).forEach((b) => b.addEventListener('click', () => openFoodForm({ date: ui.foodDate, meal: b.dataset.addMeal })));
  $$('[data-food]', v).forEach((b) => b.addEventListener('click', () => openFoodForm(state.food.find((f) => f.id === b.dataset.food))));
  const rec = recentFoods();
  $$('[data-quick]', v).forEach((b) => b.addEventListener('click', () => {
    const f = rec[+b.dataset.quick];
    state.food.push({ id: uid(), date: ui.foodDate, name: f.name, meal: guessMeal(), cal: f.cal, p: f.p, c: f.c, f: f.f });
    save(); toast(`Added ${f.name}`); render();
  }));
  const cp = $('#copyPrev', v);
  cp && cp.addEventListener('click', () => {
    for (const f of foodForDate(addDays(ui.foodDate, -1))) state.food.push({ ...f, id: uid(), date: ui.foodDate });
    save(); toast('Copied'); render();
  });
};
function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snacks';
}
function openFoodForm(init = {}) {
  const f = Object.assign({ date: todayISO(), meal: guessMeal(), name: '', cal: '', p: '', c: '', f: '' }, init);
  const editing = !!f.id;
  openSheet(editing ? 'Edit food' : 'Add food', `<form class="form" id="fForm">
    <label class="field"><span>Food</span><input type="text" name="name" value="${esc(f.name)}" placeholder="e.g. Chicken, rice & veg" required list="foodNames" autocomplete="off"></label>
    <datalist id="foodNames">${recentFoods().map((x) => `<option value="${esc(x.name)}">`).join('')}</datalist>
    <div class="grid-2">
      <label class="field"><span>Meal</span><select name="meal">${MEALS.map((m) => `<option ${f.meal === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <label class="field"><span>Date</span><input type="date" name="date" value="${f.date}"></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Protein (g)</span><input type="number" inputmode="decimal" step="0.1" name="p" value="${f.p ?? ''}"></label>
      <label class="field"><span>Carbs (g)</span><input type="number" inputmode="decimal" step="0.1" name="c" value="${f.c ?? ''}"></label>
      <label class="field"><span>Fat (g)</span><input type="number" inputmode="decimal" step="0.1" name="f" value="${f.f ?? ''}"></label>
      <label class="field"><span>Calories</span><input type="number" inputmode="decimal" step="1" name="cal" value="${f.cal ?? ''}"><small id="calHint"></small></label>
    </div>
    <label class="field"><span>Servings</span><input type="number" inputmode="decimal" step="0.25" min="0.25" name="qty" value="1"><small>Multiplies the numbers above when saved.</small></label>
    <div class="form-actions">
      ${editing ? '<button type="button" class="btn danger" id="delF">Delete</button>' : ''}
      <button type="submit" class="btn primary">${editing ? 'Save' : 'Add'}</button>
    </div>
  </form>`, (root) => {
    const form = $('#fForm', root);
    const hint = () => {
      const est = (num(form.p.value) || 0) * 4 + (num(form.c.value) || 0) * 4 + (num(form.f.value) || 0) * 9;
      $('#calHint', form).textContent = est ? `From macros: ${Math.round(est)} kcal${form.cal.value ? '' : ' (used if blank)'}` : '';
    };
    ['p', 'c', 'f', 'cal'].forEach((k) => form[k].addEventListener('input', hint));
    hint();
    form.name.addEventListener('change', () => {
      if (editing) return;
      const m = recentFoods().find((x) => x.name.toLowerCase() === form.name.value.trim().toLowerCase());
      if (m) { form.p.value = m.p ?? ''; form.c.value = m.c ?? ''; form.f.value = m.f ?? ''; form.cal.value = m.cal ?? ''; hint(); }
    });
    if (!editing) setTimeout(() => form.name.focus(), 50);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = num(form.qty.value) || 1;
      const p = num(form.p.value) || 0, c = num(form.c.value) || 0, fat = num(form.f.value) || 0;
      const cal = num(form.cal.value) ?? (p * 4 + c * 4 + fat * 9);
      const out = { id: f.id || uid(), date: form.date.value, meal: form.meal.value, name: form.name.value.trim(), cal: Math.round(cal * q), p: round1(p * q), c: round1(c * q), f: round1(fat * q) };
      const i = state.food.findIndex((x) => x.id === out.id);
      if (i >= 0) state.food[i] = out; else state.food.push(out);
      save(); closeSheet(); toast(editing ? 'Updated' : `Added ${out.name}`); render();
    });
    const del = $('#delF', form);
    del && del.addEventListener('click', () => { state.food = state.food.filter((x) => x.id !== f.id); save(); closeSheet(); toast('Deleted'); render(); });
  });
}

/* =====================================================================
   Progress
   ===================================================================== */
function viewProgress() {
  const t = todayISO();
  const last = (n) => state.workouts.filter((w) => daysBetween(w.date, t) < n && w.date <= t);
  const w7 = last(7), w28 = last(28);
  const runKm7 = sum(w7, (w) => w.distance);
  const hrs7 = sum(w7, (w) => w.duration) / 60;
  // adherence: planned non-rest sessions in last 28 days (up to yesterday + today if done)
  const planned = [];
  for (let i = 0; i < 28; i++) { const d = addDays(t, -i); for (const s of getPlan().byDate.get(d) || []) if (s.type !== 'rest' && (d < t || sessionStatus(s) === 'done')) planned.push(s); }
  const adh = planned.length ? Math.round((planned.filter((s) => sessionStatus(s) === 'done').length / planned.length) * 100) : null;
  const sims = state.workouts.filter((w) => (w.type === 'sim' || w.type === 'race') && (w.totalTime || Object.keys(w.splits || {}).length));
  const hist = liftHistory();
  const liftNames = [...hist.keys()].sort((a, b) => hist.get(b).length - hist.get(a).length);
  if (!ui.progressLift || !hist.has(ui.progressLift)) ui.progressLift = liftNames.find((n) => /squat/i.test(n)) || liftNames[0] || null;
  const hasFood = state.food.some((f) => daysBetween(f.date, t) < 14);

  return `
  <h1>Progress</h1>
  <div class="grid-2">
    <div class="stat"><div class="label">Sessions · 28 days</div><div class="value">${w28.length}</div><div class="sub">${w7.length} in the last 7 days</div></div>
    <div class="stat"><div class="label">Plan adherence · 28 days</div><div class="value">${adh == null ? '–' : adh}<small>${adh == null ? '' : '%'}</small></div><div class="sub">${planned.length ? `${planned.filter((s) => sessionStatus(s) === 'done').length} of ${planned.length} planned` : 'No planned sessions yet'}</div></div>
    <div class="stat"><div class="label">Running · 7 days</div><div class="value">${round1(runKm7)}<small>km</small></div></div>
    <div class="stat"><div class="label">Training time · 7 days</div><div class="value">${round1(hrs7)}<small>h</small></div></div>
  </div>

  <div class="card">
    <div class="card-head"><h3>Weekly training time</h3><span class="small faint">12 weeks</span></div>
    <div class="legend">${CATS.map((c) => `<span><i style="background:${c.color}"></i>${c.name}</span>`).join('')}</div>
    <div class="chart" data-chart="weekly"></div>
  </div>

  <div class="card">
    <div class="card-head"><h3>Weekly running distance</h3><span class="small faint">km</span></div>
    <div class="chart" data-chart="km"></div>
  </div>

  <div class="card">
    <div class="card-head"><h3>Hyrox times</h3><span class="small faint">lower is better</span></div>
    ${sims.length ? `
      <select id="stationSel" aria-label="Metric">
        <option value="total" ${ui.progressStation === 'total' ? 'selected' : ''}>Total finish time</option>
        ${[...STATIONS, { id: 'run', name: 'Running total' }].map((s) => `<option value="${s.id}" ${ui.progressStation === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <div class="chart" data-chart="sim"></div>
      ${stationTable(sims)}`
      : `<p class="empty">Log a simulation or race (type “Simulation”) with splits to track your times. Your plan has simulations in the Build and Peak phases.</p>`}
  </div>

  <div class="card">
    <div class="card-head"><h3>Strength</h3><span class="small faint">estimated 1RM</span></div>
    ${liftNames.length ? `
      <select id="liftSel" aria-label="Exercise">${liftNames.map((n) => `<option ${n === ui.progressLift ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <div class="chart" data-chart="lift"></div>
      <details class="table-view"><summary>All-time bests</summary>
        <table class="data"><thead><tr><th>Exercise</th><th class="n">Best e1RM</th><th class="n">Heaviest</th></tr></thead><tbody>
        ${liftNames.map((n) => `<tr><td>${esc(n)}</td><td class="n">${Math.round(bestE1rm(hist, n))} ${U()}</td><td class="n">${Math.max(...hist.get(n).map((x) => x.top))} ${U()}</td></tr>`).join('')}
        </tbody></table></details>`
      : '<p class="empty">Log lifts to see strength trends.</p>'}
  </div>

  <div class="card">
    <div class="card-head"><h3>Bodyweight</h3><button class="btn sm" data-add-weight>+ Log</button></div>
    ${state.weights.length >= 2 ? '<div class="chart" data-chart="weight"></div>' : '<p class="empty">Log bodyweight at least twice to see a trend.</p>'}
  </div>

  <div class="card">
    <div class="card-head"><h3>Calories</h3><span class="small faint">14 days · dashed = target</span></div>
    ${hasFood ? '<div class="chart" data-chart="cal"></div>' : '<p class="empty">Log food to see your intake against your targets.</p>'}
  </div>
  ${hasFood ? `<div class="card"><div class="card-head"><h3>Protein</h3><span class="small faint">14 days · dashed = target</span></div><div class="chart" data-chart="protein"></div></div>` : ''}`;
}
function stationTable(sims) {
  const rows = [...STATIONS, { id: 'run', name: 'Running total' }].map((s) => {
    const vals = sims.filter((w) => w.splits?.[s.id]).sort((a, b) => a.date.localeCompare(b.date));
    if (!vals.length) return '';
    const best = Math.min(...vals.map((w) => w.splits[s.id]));
    return `<tr><td>${s.name}</td><td class="n">${fmtTime(vals.at(-1).splits[s.id])}</td><td class="n">${fmtTime(best)}</td></tr>`;
  }).join('');
  if (!rows) return '';
  return `<details class="table-view"><summary>Station splits: latest vs best</summary><table class="data"><thead><tr><th>Station</th><th class="n">Latest</th><th class="n">Best</th></tr></thead><tbody>${rows}</tbody></table></details>`;
}
mounts.progress = (v) => {
  bindCommon(v);
  const t = todayISO();
  const weeks = weekBuckets(12);
  const wkLabel = (s) => { const d = parseISO(s); return `${d.getDate()}/${d.getMonth() + 1}`; };
  const byWeek = weeks.map((ws) => state.workouts.filter((w) => w.date >= ws && w.date <= addDays(ws, 6)));
  barChart($('[data-chart="weekly"]', v), {
    labels: weeks.map(wkLabel),
    tipLabels: weeks.map((ws) => `Week of ${fmtDate(ws)}`),
    series: CATS.map((c) => ({ key: c.key, name: c.name, color: c.color, values: byWeek.map((ws) => sum(ws.filter((w) => (TYPES[w.type] || TYPES.other).cat === c.key), (w) => w.duration) / 60) })),
    yFmt: (y) => `${round1(y)} h`,
  });
  barChart($('[data-chart="km"]', v), {
    labels: weeks.map(wkLabel), tipLabels: weeks.map((ws) => `Week of ${fmtDate(ws)}`),
    series: [{ key: 'km', name: 'Running', color: 'var(--s1)', values: byWeek.map((ws) => sum(ws, (w) => w.distance)) }],
    yFmt: (y) => `${round1(y)} km`,
  });
  const sc = $('[data-chart="sim"]', v);
  if (sc) {
    const draw = () => {
      const k = ui.progressStation;
      const sims = state.workouts.filter((w) => (w.type === 'sim' || w.type === 'race') && (k === 'total' ? w.totalTime : w.splits?.[k])).sort((a, b) => a.date.localeCompare(b.date));
      if (!sims.length) { sc.innerHTML = '<p class="empty">No times logged for this yet.</p>'; return; }
      lineChart(sc, { points: sims.map((w) => ({ x: w.date, y: k === 'total' ? w.totalTime : w.splits[k], note: w.title })), yFmt: fmtTime, color: 'var(--s2)', name: k === 'total' ? 'Finish time' : (stationById[k]?.name || 'Running'), invert: true });
    };
    draw();
    $('#stationSel', v).addEventListener('change', (e) => { ui.progressStation = e.target.value; draw(); });
  }
  const lc = $('[data-chart="lift"]', v);
  if (lc) {
    const draw = () => {
      const h = liftHistory().get(ui.progressLift) || [];
      lineChart(lc, { points: h.map((x) => ({ x: x.date, y: x.best })), yFmt: (y) => `${Math.round(y)} ${U()}`, color: 'var(--s3)', name: 'e1RM' });
    };
    draw();
    $('#liftSel', v).addEventListener('change', (e) => { ui.progressLift = e.target.value; draw(); });
  }
  const wc = $('[data-chart="weight"]', v);
  if (wc) drawWeightChart(wc);
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const tg = targets();
  const cc = $('[data-chart="cal"]', v);
  if (cc) barChart(cc, { labels: days.map((d) => `${parseISO(d).getDate()}`), tipLabels: days.map((d) => fmtDate(d, { dow: true })), series: [{ key: 'cal', name: 'Calories', color: 'var(--s4)', values: days.map((d) => dayTotals(d).cal) }], target: tg.cal, yFmt: (y) => `${Math.round(y)} kcal` });
  const pc = $('[data-chart="protein"]', v);
  if (pc) barChart(pc, { labels: days.map((d) => `${parseISO(d).getDate()}`), tipLabels: days.map((d) => fmtDate(d, { dow: true })), series: [{ key: 'p', name: 'Protein', color: 'var(--s3)', values: days.map((d) => dayTotals(d).p) }], target: tg.p, yFmt: (y) => `${Math.round(y)} g` });
};

/* =====================================================================
   Charts (hand-rolled SVG, sized to the container, with hover tooltips)
   ===================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';
function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks.at(-1) < max) ticks.push(ticks.at(-1) + step);
  return ticks;
}
function showTip(html, x, y) {
  const tip = $('#tooltip');
  tip.innerHTML = html;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let left = x + 14, top = y - r.height - 12;
  if (left + r.width > innerWidth - 8) left = x - r.width - 14;
  if (left < 8) left = 8;
  if (top < 8) top = y + 16;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}
function hideTip() { $('#tooltip').hidden = true; }
document.addEventListener('scroll', hideTip, { passive: true });

function barChart(el, { labels, tipLabels, series, target, yFmt, height = 190 }) {
  if (!el) return;
  const W = Math.max(260, el.clientWidth || 320), H = height;
  const m = { t: 10, r: 6, b: 22, l: 44 };
  const n = labels.length;
  const totals = labels.map((_, i) => sum(series, (s) => s.values[i]));
  const ticks = niceTicks(Math.max(...totals, target || 0, 0.0001));
  const yMax = ticks.at(-1);
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const bw = iw / n;
  const barW = Math.min(28, Math.max(6, bw * 0.62));
  const y = (v) => m.t + ih - (v / yMax) * ih;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(series.map((s) => s.name).join(', '))} by period">`;
  svg += `<g class="grid">${ticks.map((tk) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(tk)}" y2="${y(tk)}"/>`).join('')}</g>`;
  svg += `<g class="axis">${ticks.map((tk) => `<text x="${m.l - 6}" y="${y(tk) + 4}" text-anchor="end">${esc(yFmt(tk).replace(/ (kcal|g|km|h)$/, ''))}</text>`).join('')}`;
  const every = Math.ceil(n / Math.floor(iw / 34));
  svg += labels.map((l, i) => (n - 1 - i) % every === 0 ? `<text x="${m.l + bw * i + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>` : '').join('') + '</g>';
  // bars: stacked, 2px surface gap between segments, rounded top on the topmost segment only
  for (let i = 0; i < n; i++) {
    const cx = m.l + bw * i + bw / 2;
    let acc = 0;
    const segs = series.map((s) => ({ s, v: s.values[i] || 0 })).filter((x) => x.v > 0);
    segs.forEach((sg, j) => {
      const y0 = y(acc), y1 = y(acc + sg.v);
      acc += sg.v;
      const top = j === segs.length - 1;
      const gap = j > 0 ? 2 : 0;
      const h = Math.max(1, y0 - y1 - gap);
      const yy = y1;
      const r = top ? Math.min(4, barW / 2, h) : 0;
      const x0 = cx - barW / 2;
      const path = r
        ? `M${x0},${yy + h} V${yy + r} Q${x0},${yy} ${x0 + r},${yy} H${x0 + barW - r} Q${x0 + barW},${yy} ${x0 + barW},${yy + r} V${yy + h} Z`
        : `M${x0},${yy + h} V${yy} H${x0 + barW} V${yy + h} Z`;
      svg += `<path d="${path}" fill="${sg.s.color}"/>`;
    });
  }
  if (target) svg += `<line class="target" x1="${m.l}" x2="${W - m.r}" y1="${y(target)}" y2="${y(target)}"/>`;
  svg += labels.map((_, i) => `<rect class="hit" data-i="${i}" x="${m.l + bw * i}" y="${m.t}" width="${bw}" height="${ih}"/>`).join('');
  svg += '</svg>';
  el.innerHTML = svg;
  const tipFor = (i) => {
    const rows = series.filter((s) => series.length === 1 || s.values[i] > 0).map((s) => `<div class="tt-row"><i style="background:${s.color}"></i>${esc(s.name)}<span>${esc(yFmt(s.values[i] || 0))}</span></div>`).join('');
    const tot = series.length > 1 ? `<div class="tt-row" style="margin-top:2px">Total<span>${esc(yFmt(totals[i]))}</span></div>` : '';
    const tg = target ? `<div class="tt-row faint">Target<span>${esc(yFmt(target))}</span></div>` : '';
    return `<b>${esc(tipLabels?.[i] || labels[i])}</b>${rows || '<div>No data</div>'}${tot}${tg}`;
  };
  $$('.hit', el).forEach((h) => {
    const on = (e) => { $$('.hit', el).forEach((x) => x.style.fill = ''); h.style.fill = 'color-mix(in srgb, var(--text) 6%, transparent)'; showTip(tipFor(+h.dataset.i), e.clientX, e.clientY); };
    h.addEventListener('pointermove', on);
    h.addEventListener('pointerdown', on);
    h.addEventListener('pointerleave', () => { h.style.fill = ''; hideTip(); });
  });
}

function lineChart(el, { points, yFmt, color, name, invert = false, height = 190, mark = 'best' }) {
  if (!el) return;
  if (!points.length) { el.innerHTML = '<p class="empty">No data yet.</p>'; return; }
  const W = Math.max(260, el.clientWidth || 320), H = height;
  const m = { t: 14, r: 12, b: 22, l: 52 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const xs = points.map((p) => parseISO(p.x).getTime());
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 864e5 * 3; x1 += 864e5 * 3; }
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const padv = (hi - lo) * 0.15 || Math.max(1, hi * 0.05);
  lo -= padv; hi += padv;
  if (Math.min(...ys) >= 0 && lo < 0) lo = 0;
  const X = (t) => m.l + ((t - x0) / (x1 - x0)) * iw;
  const Y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
  const nt = 4;
  const ticks = Array.from({ length: nt + 1 }, (_, i) => lo + ((hi - lo) * i) / nt);
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} over time">`;
  svg += `<g class="grid">${ticks.map((tk) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(tk)}" y2="${Y(tk)}"/>`).join('')}</g>`;
  svg += `<g class="axis">${ticks.map((tk) => `<text x="${m.l - 6}" y="${Y(tk) + 4}" text-anchor="end">${esc(yFmt(tk).replace(/ (kg|lb)$/, ''))}</text>`).join('')}`;
  // x labels: first, middle, last
  const xl = [x0, (x0 + x1) / 2, x1];
  svg += xl.map((t, i) => { const d = new Date(t); return `<text x="${X(t)}" y="${H - 6}" text-anchor="${['start', 'middle', 'end'][i]}">${MON[d.getMonth()]} ${d.getDate()}</text>`; }).join('') + '</g>';
  const pts = points.map((p, i) => [X(xs[i]), Y(p.y)]);
  if (pts.length > 1) svg += `<path class="line" stroke="${color}" d="M${pts.map((p) => p.join(',')).join(' L')}"/>`;
  // best point marker & label
  const bestIdx = mark === 'latest' ? ys.length - 1 : ys.indexOf(invert ? Math.min(...ys) : Math.max(...ys));
  const showDots = pts.length <= 40;
  pts.forEach(([px, py], i) => { if (showDots || i === bestIdx || i === pts.length - 1) svg += `<circle class="pt" cx="${px}" cy="${py}" r="${i === bestIdx ? 5 : 4}" fill="${color}"/>`; });
  const [bx, by] = pts[bestIdx];
  svg += `<text class="lbl" x="${clamp(bx, m.l + 20, W - m.r - 20)}" y="${by - 10 < m.t ? by + 18 : by - 10}" text-anchor="middle">${mark === 'latest' ? 'Latest' : 'Best'} ${esc(yFmt(ys[bestIdx]))}</text>`;
  svg += `<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="display:none"/>`;
  svg += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/>`;
  svg += '</svg>';
  el.innerHTML = svg;
  const svgEl = $('svg', el), hit = $('.hit', el), xh = $('.xhair', el);
  const move = (e) => {
    const r = svgEl.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    let bi = 0, bd = Infinity;
    pts.forEach(([px], i) => { const d = Math.abs(px - mx); if (d < bd) { bd = d; bi = i; } });
    xh.setAttribute('x1', pts[bi][0]); xh.setAttribute('x2', pts[bi][0]); xh.style.display = '';
    const p = points[bi];
    const prev = bi > 0 ? points[bi - 1].y : null;
    let delta = '';
    if (prev != null) {
      const dv = p.y - prev;
      const better = invert ? dv < 0 : dv > 0;
      delta = dv ? `<div class="faint">${dv > 0 ? '+' : '−'}${esc(yFmt(Math.abs(dv)))} vs previous${better ? ' ✓' : ''}</div>` : '';
    }
    showTip(`<b>${fmtDate(p.x, { dow: true })}</b>${p.note ? `<div class="faint">${esc(p.note)}</div>` : ''}<div class="tt-row"><i style="background:${color}"></i>${esc(name)}<span>${esc(yFmt(p.y))}</span></div>${delta}`, e.clientX, e.clientY);
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', () => { xh.style.display = 'none'; hideTip(); });
}

/* =====================================================================
   Settings
   ===================================================================== */
function viewSettings() {
  const p = state.profile, sg = suggestTargets(p);
  return `
  <h1>Settings</h1>
  <form class="card form" id="profForm">
    <h3>Race & plan</h3>
    <div class="grid-2">
      <label class="field"><span>Race date</span><input type="date" name="raceDate" value="${p.raceDate}"></label>
      <label class="field"><span>Plan started</span><input type="date" name="planStart" value="${p.planStart}"><small>Week 1 begins the Monday of this week</small></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Training days / week</span><select name="days">${[3, 4, 5, 6].map((d) => `<option value="${d}" ${+p.days === d ? 'selected' : ''}>${d} days</option>`).join('')}</select></label>
      <label class="field"><span>Long / sim day</span><select name="longDay"><option value="6" ${+p.longDay === 6 ? 'selected' : ''}>Saturday</option><option value="0" ${+p.longDay === 0 ? 'selected' : ''}>Sunday</option></select></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Division</span><select name="division">${[['open', 'Open'], ['pro', 'Pro'], ['doubles', 'Doubles / Relay']].map(([k, n]) => `<option value="${k}" ${p.division === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="field"><span>Category</span><select name="category"><option value="men" ${p.category === 'men' ? 'selected' : ''}>Men</option><option value="women" ${p.category === 'women' ? 'selected' : ''}>Women</option></select></label>
    </div>
    <label class="field"><span>Recent 5K time</span><input type="text" name="fiveK" value="${esc(p.fiveK)}" placeholder="mm:ss"><small>${paces(p) ? `Paces: threshold ${fmtPace(paces(p).thr)}, race ${fmtPace(paces(p).race)}, easy ${fmtPace(paces(p).z2)}` : 'Blank = train by effort'}</small></label>

    <h3 style="margin-top:20px">Lifting</h3>
    <div class="grid-2">
      <label class="field"><span>Units</span><select name="unit"><option value="kg" ${p.unit === 'kg' ? 'selected' : ''}>kg</option><option value="lb" ${p.unit === 'lb' ? 'selected' : ''}>lb</option></select></label>
      <label class="field"><span>Bodyweight (${p.unit})</span><input type="number" inputmode="decimal" step="0.1" name="bodyweight" value="${p.bodyweight ?? ''}"></label>
    </div>
    <div class="grid-2">
      ${Object.entries(LIFT_REFS).map(([k, n]) => {
        const best = bestE1rm(liftHistory(), n);
        return `<label class="field"><span>${n} 1RM</span><input type="number" inputmode="decimal" step="0.5" name="orm_${k}" value="${p.oneRM[k] ?? ''}">${best ? `<small>Logged best e1RM: ${Math.round(best)}${best > (p.oneRM[k] || 0) ? ` · <a href="#" data-use-orm="${k}:${Math.round(best)}">use it</a>` : ''}</small>` : ''}</label>`;
      }).join('')}
    </div>

    <h3 style="margin-top:20px">Nutrition targets</h3>
    <p class="small muted">${sg ? `Suggested for ${p.bodyweight} ${p.unit} at ${p.days} days/week: ${sg.cal} kcal, ${sg.p} g protein, ${sg.c} g carbs, ${sg.f} g fat. Leave blank to use these.` : 'Add bodyweight for suggested targets.'}</p>
    <div class="grid-2">
      <label class="field"><span>Calories</span><input type="number" name="t_cal" value="${p.targets.cal ?? ''}" placeholder="${sg?.cal ?? ''}"></label>
      <label class="field"><span>Protein (g)</span><input type="number" name="t_p" value="${p.targets.p ?? ''}" placeholder="${sg?.p ?? ''}"></label>
      <label class="field"><span>Carbs (g)</span><input type="number" name="t_c" value="${p.targets.c ?? ''}" placeholder="${sg?.c ?? ''}"></label>
      <label class="field"><span>Fat (g)</span><input type="number" name="t_f" value="${p.targets.f ?? ''}" placeholder="${sg?.f ?? ''}"></label>
    </div>

    <h3 style="margin-top:20px">Appearance</h3>
    <div class="seg" role="group" id="themeSeg">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, n]) => `<button type="button" data-theme-set="${k}" aria-pressed="${p.theme === k}">${n}</button>`).join('')}</div>

    <button class="btn primary block" type="submit" style="margin-top:18px">Save settings</button>
  </form>

  <div class="card">
    <h3>Your data</h3>
    <p class="small muted">Everything is stored only in this browser on this device. Export a backup regularly, and import it to move to another device.</p>
    <div class="row wrap">
      <button class="btn" id="exportBtn">Export backup</button>
      <label class="btn">Import backup<input type="file" id="importFile" accept="application/json,.json" hidden></label>
      <button class="btn danger" id="resetBtn">Erase all</button>
    </div>
    <p class="small faint num">${state.workouts.length} workouts · ${state.food.length} food entries · ${state.weights.length} weigh-ins</p>
  </div>`;
}
mounts.settings = (v) => {
  bindCommon(v);
  const form = $('#profForm', v);
  $$('[data-use-orm]', v).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const [k, val] = a.dataset.useOrm.split(':'); form['orm_' + k].value = val; }));
  $$('[data-theme-set]', v).forEach((b) => b.addEventListener('click', () => { state.profile.theme = b.dataset.themeSet; save(); render(); }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = state.profile;
    const rd = form.raceDate.value;
    if (rd && rd !== p.raceDate && daysBetween(todayISO(), rd) >= 0 && daysBetween(todayISO(), p.raceDate) < 0) p.planStart = mondayOf(todayISO());
    p.raceDate = rd || p.raceDate;
    p.planStart = form.planStart.value || p.planStart;
    if (p.planStart > p.raceDate) p.planStart = mondayOf(todayISO());
    p.days = +form.days.value;
    p.longDay = +form.longDay.value;
    p.division = form.division.value;
    p.category = form.category.value;
    p.fiveK = form.fiveK.value.trim();
    p.unit = form.unit.value;
    p.bodyweight = num(form.bodyweight.value);
    for (const k of Object.keys(LIFT_REFS)) p.oneRM[k] = num(form['orm_' + k].value);
    p.targets = { cal: num(form.t_cal.value), p: num(form.t_p.value), c: num(form.t_c.value), f: num(form.t_f.value) };
    p.setup = true;
    save();
    ui.planWeek = null;
    toast('Settings saved. Plan updated.');
    render();
  });
  $('#exportBtn', v).addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hyrox-prep-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile', v).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.profile || !Array.isArray(data.workouts)) throw new Error('bad');
      if (!confirm('Replace all current data with this backup?')) return;
      localStorage.setItem(KEY, JSON.stringify(data));
      state = load(); planCache = null;
      toast('Backup imported'); render();
    } catch (err) { toast('That file is not a Hyrox Prep backup.'); }
  });
  $('#resetBtn', v).addEventListener('click', () => {
    if (!confirm('Erase all workouts, food, weigh-ins and settings? Export a backup first if unsure.')) return;
    state = { profile: DEFAULT_PROFILE(), workouts: [], food: [], weights: [] };
    save(); toast('All data erased'); go('today');
  });
};

/* =====================================================================
   Boot
   ===================================================================== */
let rz;
let lastW = innerWidth;
addEventListener('resize', () => {
  if (Math.abs(innerWidth - lastW) < 40) return; // ignore mobile URL-bar height jitter
  lastW = innerWidth;
  clearTimeout(rz);
  rz = setTimeout(() => { if (['progress', 'log'].includes(tab)) render(); }, 200);
});
// Re-render when the day rolls over while the app is open
let lastDay = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayISO() !== lastDay) { lastDay = todayISO(); ui.foodDate = lastDay; render(); }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// Expose for debugging/tests
window.__hyrox = { get state() { return state; }, set state(s) { state = s; planCache = null; }, save, render, go, getPlan };
go('today');
})();
