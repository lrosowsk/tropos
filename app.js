/* Tropos: storefront logic (catalog, quiz, cart, modal) */
(() => {
  "use strict";

  /* ───────────────────────── Catalog ───────────────────────── */

  const GOALS = {
    strength:  "Strength",
    energy:    "Energy",
    sleep:     "Sleep",
    stress:    "Stress",
    focus:     "Focus",
    heart:     "Heart & longevity",
    recovery:  "Recovery",
    essentials:"Daily essentials",
  };

  const PRODUCTS = [
    {
      id: "foundation", lbl: "50 mcg VITAMIN D3", num: "01", name: "Foundation", kind: "Daily multivitamin", shape: "bottle", color: "#e9e9e7", labelInk: "#1a1a1a",
      purpose: "The nutrients most men run low on, in forms your body actually uses.",
      price: 34, servings: 30, form: "2 capsules", tag: "Bestseller",
      goals: ["essentials", "energy", "heart"],
      key: [["Vitamin D3", "50 mcg"], ["Zinc", "15 mg"], ["Vitamin K2 (MK-7)", "100 mcg"]],
      benefits: ["Supports immune function and energy metabolism*", "Supports healthy testosterone levels already in the normal range*", "Methylated B vitamins for better absorption"],
      facts: [
        ["Vitamin C (as ascorbic acid)", "90 mg", "100%"],
        ["Vitamin D3 (as cholecalciferol)", "50 mcg (2,000 IU)", "250%"],
        ["Vitamin K2 (as menaquinone-7)", "100 mcg", "83%"],
        ["Folate (as L-methylfolate)", "400 mcg DFE", "100%"],
        ["Vitamin B12 (as methylcobalamin)", "250 mcg", "10,417%"],
        ["Iodine (from potassium iodide)", "150 mcg", "100%"],
        ["Zinc (as zinc bisglycinate)", "15 mg", "136%"],
        ["Selenium (as L-selenomethionine)", "70 mcg", "127%"],
        ["Boron (as boron glycinate)", "3 mg", "†"],
      ],
      other: "Hypromellose (capsule), rice hull concentrate.",
      take: "2 capsules daily with a meal that contains some fat.",
      free: ["Vegan", "Gluten free", "Non-GMO"],
      caution: "Contains vitamin K2. If you take blood thinners such as warfarin, speak with your doctor before use.",
    },
    {
      id: "omega", lbl: "1,000 mg EPA", num: "02", name: "Omega", kind: "Fish oil · EPA + DHA", shape: "bottle", color: "#e4e4e2", labelInk: "#1a1a1a",
      purpose: "High-potency omega-3s from small, wild-caught fish. No fishy burps.",
      price: 32, servings: 30, form: "2 softgels",
      goals: ["heart", "recovery", "focus"],
      key: [["EPA", "1,000 mg"], ["DHA", "500 mg"], ["Total omega-3", "1,600 mg"]],
      benefits: ["Supports heart and cardiovascular health*", "Supports brain function and mood*", "Re-esterified triglyceride form for better absorption"],
      facts: [
        ["Calories", "20", ""],
        ["Total fat", "2 g", "3%"],
        ["Fish oil concentrate", "2,000 mg", "†"],
        ["Total omega-3 fatty acids", "1,600 mg", "†"],
        ["  EPA (eicosapentaenoic acid)", "1,000 mg", "†"],
        ["  DHA (docosahexaenoic acid)", "500 mg", "†"],
      ],
      other: "Fish oil (anchovy, sardine), softgel (bovine gelatin, glycerin, water), natural lemon oil, rosemary extract.",
      take: "2 softgels daily with food.",
      free: ["Gluten free", "IFOS 5-star", "Mercury tested"],
      caution: "Contains fish. If you take blood thinners, speak with your doctor before use.",
    },
    {
      id: "creatine", lbl: "5 g CREATINE", num: "03", name: "Creatine", kind: "Micronized monohydrate", shape: "tub", color: "#ebebe9", labelInk: "#1a1a1a",
      purpose: "The most researched supplement in sports nutrition. One scoop, nothing else.",
      price: 29, servings: 60, form: "1 scoop (5 g)", tag: "Most studied",
      goals: ["strength", "recovery", "focus"],
      key: [["Creatine monohydrate", "5 g"], ["Flavor", "None"], ["Servings", "60"]],
      benefits: ["Supports strength and power output during training*", "Supports lean muscle when paired with resistance training*", "Emerging research on cognitive performance*"],
      facts: [["Creatine monohydrate (micronized)", "5 g", "†"]],
      other: "None.",
      take: "1 scoop (5 g) daily in water or any drink. Timing doesn't matter. Consistency does.",
      free: ["Vegan", "Unflavored", "Single ingredient"],
      caution: "Drink plenty of water. If you have kidney disease, speak with your doctor before use.",
    },
    {
      id: "magnesium", lbl: "200 mg MAGNESIUM", num: "04", name: "Magnesium", kind: "Bisglycinate", shape: "bottle", color: "#dededc", labelInk: "#1a1a1a",
      purpose: "The gentle, well-absorbed form of a mineral most men don't get enough of.",
      price: 24, servings: 30, form: "2 capsules",
      goals: ["sleep", "recovery", "stress"],
      key: [["Magnesium (elemental)", "200 mg"], ["Form", "Bisglycinate"], ["Stomach", "Gentle"]],
      benefits: ["Supports muscle relaxation and recovery*", "Supports restful sleep*", "Chelated form, easy on digestion"],
      facts: [["Magnesium (as magnesium bisglycinate chelate)", "200 mg", "48%"]],
      other: "Hypromellose (capsule), rice hull concentrate.",
      take: "2 capsules in the evening, with or without food.",
      free: ["Vegan", "Gluten free", "Non-GMO"],
      caution: "If you have kidney disease, speak with your doctor before use.",
    },
    {
      id: "ashwagandha", lbl: "600 mg ASHWAGANDHA", num: "05", name: "Calm", kind: "Ashwagandha root extract", shape: "bottle", color: "#e2e2e0", labelInk: "#1a1a1a",
      purpose: "A clinically studied adaptogen for staying level when life isn't.",
      price: 28, servings: 30, form: "2 capsules",
      goals: ["stress", "sleep", "strength"],
      key: [["Ashwagandha root extract", "600 mg"], ["Withanolides", "5%"], ["Part used", "Root only"]],
      benefits: ["Supports a healthy response to everyday stress*", "Supports sleep quality*", "Full-spectrum root extract, standardized"],
      facts: [["Ashwagandha root extract (Withania somnifera) standardized to 5% withanolides", "600 mg", "†"]],
      other: "Hypromellose (capsule).",
      take: "2 capsules (600 mg) daily, morning or evening. Cycle 8 weeks on, 2 weeks off.",
      free: ["Vegan", "Gluten free", "Root only"],
      caution: "Not for use with thyroid medication, sedatives, immunosuppressants, or if you have a thyroid or autoimmune condition. Speak with your doctor first.",
    },
    {
      id: "protein", lbl: "25 g PROTEIN", num: "06", name: "Protein", kind: "Grass-fed whey isolate", shape: "tub", color: "#d9d9d7", labelInk: "#1a1a1a",
      purpose: "25 g of clean protein per scoop. Mixes smooth, tastes like real vanilla.",
      price: 54, servings: 30, form: "1 scoop (30 g)",
      goals: ["strength", "recovery"],
      key: [["Protein", "25 g"], ["Sugar", "0 g"], ["Calories", "110"]],
      benefits: ["Supports muscle growth and repair*", "Cold-processed isolate from grass-fed cows", "Sweetened with monk fruit. No sucralose"],
      facts: [
        ["Calories", "110", ""],
        ["Total fat", "0.5 g", "1%"],
        ["Total carbohydrate", "1 g", "<1%"],
        ["  Total sugars", "0 g", ""],
        ["Protein", "25 g", "50%"],
        ["Sodium", "50 mg", "2%"],
        ["Calcium", "120 mg", "9%"],
      ],
      other: "Grass-fed whey protein isolate (milk), natural vanilla flavor, sunflower lecithin, monk fruit extract, sea salt.",
      take: "1 scoop in 8–10 oz of water or milk. Use after training or to top up protein at any meal.",
      free: ["Gluten free", "No added sugar", "Hormone free"],
      caution: "Contains milk.",
    },
    {
      id: "hydrate", lbl: "1,000 mg SODIUM", num: "07", name: "Hydrate", kind: "Electrolyte drink mix", shape: "tub", color: "#e6e6e4", labelInk: "#1a1a1a",
      purpose: "Real electrolyte doses for training, heat and early mornings. Zero sugar.",
      price: 30, servings: 30, form: "1 stick",
      goals: ["energy", "recovery"],
      key: [["Sodium", "1,000 mg"], ["Potassium", "200 mg"], ["Sugar", "0 g"]],
      benefits: ["Replaces what you lose in sweat*", "Supports hydration and muscle function*", "Lightly flavored citrus-salt, no dyes"],
      facts: [
        ["Calories", "5", ""],
        ["Total carbohydrate", "1 g", "<1%"],
        ["Sodium (as sodium chloride, sodium citrate)", "1,000 mg", "43%"],
        ["Potassium (as potassium chloride)", "200 mg", "4%"],
        ["Magnesium (as magnesium malate)", "60 mg", "14%"],
      ],
      other: "Citric acid, natural citrus flavor, stevia leaf extract.",
      take: "1 stick in 16–32 oz of water. Before or during training, or first thing in the morning.",
      free: ["Vegan", "Zero sugar", "No dyes"],
      caution: "High in sodium. If you're on a sodium-restricted diet or have high blood pressure, speak with your doctor first.",
    },
    {
      id: "rest", lbl: "3 g GLYCINE", num: "08", name: "Rest", kind: "Non-habit-forming sleep", shape: "bottle", color: "#dcdcda", labelInk: "#1a1a1a",
      purpose: "Wind down without melatonin. Wake up without the fog.",
      price: 32, servings: 30, form: "3 capsules",
      goals: ["sleep", "stress"],
      key: [["Glycine", "3 g"], ["L-theanine", "200 mg"], ["Apigenin", "50 mg"]],
      benefits: ["Supports falling asleep and sleep quality*", "Melatonin-free: no grogginess or tolerance", "Pairs well with Magnesium"],
      facts: [
        ["Glycine", "3 g", "†"],
        ["L-Theanine", "200 mg", "†"],
        ["Apigenin (from chamomile extract)", "50 mg", "†"],
      ],
      other: "Hypromellose (capsule).",
      take: "3 capsules 30–60 minutes before bed.",
      free: ["Vegan", "Melatonin free", "Gluten free"],
      caution: "Don't combine with sedatives or alcohol. Speak with your doctor if you take medication.",
    },
    {
      id: "focus", lbl: "100 mg CAFFEINE", num: "09", name: "Focus", kind: "Caffeine + L-theanine", shape: "bottle", color: "#d6d6d4", labelInk: "#1a1a1a",
      purpose: "A clean, steady lift. About one cup of coffee, without the crash.",
      price: 30, servings: 30, form: "1 capsule",
      goals: ["focus", "energy"],
      key: [["Natural caffeine", "100 mg"], ["L-theanine", "200 mg"], ["L-tyrosine", "500 mg"]],
      benefits: ["Supports alertness and concentration*", "Theanine smooths out the caffeine edge*", "Caffeine from green coffee beans"],
      facts: [
        ["L-Tyrosine", "500 mg", "†"],
        ["L-Theanine", "200 mg", "†"],
        ["Natural caffeine (from green coffee bean)", "100 mg", "†"],
      ],
      other: "Hypromellose (capsule), rice hull concentrate.",
      take: "1 capsule in the morning or early afternoon. Avoid within 8 hours of bed.",
      free: ["Vegan", "Gluten free", "No sugar"],
      caution: "Contains 100 mg caffeine. Don't combine with other stimulants. Not for use if you're sensitive to caffeine or take MAOIs.",
    },
  ];
  const P = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  // Sample survey answers. Their bundles are generated by the real recommend() logic below.
  const EXAMPLES = [
    { who: "The lifter", tags: ["Trains 5+ days", "Sweats a lot", "Sleeps well"],
      a: { goals: ["strength", "recovery"], age: ["18"], training: ["5"], sleep: ["good"], stress: ["low"], diet: ["omni"], extras: ["sweat"] } },
    { who: "The desk worker", tags: ["Long screen days", "High stress", "Short on sleep"],
      a: { goals: ["focus", "energy", "stress"], age: ["25"], training: ["1"], sleep: ["short"], stress: ["high"], diet: ["omni"], extras: ["indoors"] } },
    { who: "The long game", tags: ["In his 30s", "Rarely eats fish", "Restless nights"],
      a: { goals: ["heart", "essentials", "sleep"], age: ["30"], training: ["1"], sleep: ["ok"], stress: ["mod"], diet: ["nofish"], extras: [] } },
    { who: "The plant-based athlete", tags: ["Vegan", "Trains 3–4 days", "Sweats a lot"],
      a: { goals: ["strength", "energy"], age: ["18"], training: ["3"], sleep: ["ok"], stress: ["mod"], diet: ["vegan"], extras: ["sweat", "caffeine"] } },
  ];
  let exampleBundles = [];

  /* Daily dose options per product. Every option stays within commonly used, safe intakes.
     mult = cost relative to the standard serving (more per day = supply runs out faster). */
  const DOSES = {
    foundation:  { range: "1–2 capsules", std: 1, levels: [["1 capsule", "25 mcg D3 · 7.5 mg zinc", 0.5], ["2 capsules", "50 mcg D3 · 15 mg zinc", 1]] },
    omega:       { range: "2–3 softgels", std: 1, levels: [["1 softgel", "500 mg EPA", 0.5], ["2 softgels", "1,000 mg EPA", 1], ["3 softgels", "1,500 mg EPA", 1.5]] },
    creatine:    { range: "3–5 g", std: 1, levels: [["3 g", "about ⅗ scoop", 0.6], ["5 g", "1 scoop", 1]] },
    magnesium:   { range: "200–300 mg", std: 1, levels: [["1 capsule", "100 mg", 0.5], ["2 capsules", "200 mg", 1], ["3 capsules", "300 mg", 1.5]] },
    ashwagandha: { range: "300–600 mg", std: 1, levels: [["1 capsule", "300 mg", 0.5], ["2 capsules", "600 mg", 1]] },
    protein:     { range: "1–2 scoops", std: 0, levels: [["1 scoop", "25 g protein", 1], ["2 scoops", "50 g protein", 2]] },
    hydrate:     { range: "1–2 sticks", std: 0, levels: [["1 stick", "1,000 mg sodium", 1], ["2 sticks", "2,000 mg sodium", 2]] },
    rest:        { range: "2–3 capsules", std: 1, levels: [["2 capsules", "2 g glycine", 0.67], ["3 capsules", "3 g glycine", 1]] },
    focus:       { range: "100–200 mg caffeine", std: 0, levels: [["1 capsule", "100 mg caffeine", 1], ["2 capsules", "200 mg caffeine", 2]] },
  };
  const doseIdx = (id, i) => { const d = DOSES[id]; return Number.isInteger(i) && i >= 0 && i < d.levels.length ? i : d.std; };
  const doseMult = (id, i) => DOSES[id].levels[doseIdx(id, i)][2];
  const doseText = (id, i) => { const l = DOSES[id].levels[doseIdx(id, i)]; return `${l[0]} · ${l[1]}`; };

  // Personal starting dose from survey answers (falls back to the standard serving)
  function recDose(id, a) {
    if (!a) return DOSES[id].std;
    const ex = a.extras || [], act = a.activity || [], g = a.goals || [];
    const training = +((a.training || [])[0] || 0), sleep = (a.sleep || [])[0], stress = (a.stress || [])[0], diet = (a.diet || [])[0];
    switch (id) {
      case "omega": return g.includes("heart") || diet === "nofish" ? 2 : 1;
      case "magnesium": return sleep === "poor" || ex.includes("alcohol") || ex.includes("sweat") || training >= 5 ? 2 : 1;
      case "ashwagandha": return stress === "high" || stress === "vhigh" ? 1 : 0;
      case "protein": return ex.includes("lowprotein") || (act.includes("lifting") && training >= 5) ? 1 : 0;
      case "hydrate": return ex.includes("sweat") && (training >= 5 || act.includes("cardio")) ? 1 : 0;
      case "rest": return sleep === "poor" ? 1 : 0;
      default: return DOSES[id].std;
    }
  }
  // Segmented dose picker: short labels, a dot on the recommended dose, the amount underneath
  const shortDose = t => t.replace(/ capsules?$/, m => (m.endsWith("s") ? " caps" : " cap")).replace(/ softgels?$/, m => (m.endsWith("s") ? " gels" : " gel"));
  function doseSeg(id, cur, rec, attrs) {
    const lv = DOSES[id].levels;
    return `<div class="dose-pick">
      <div class="seg" role="radiogroup" aria-label="Daily dose for ${esc(P[id].name)}">${lv.map((l, i) =>
        `<button type="button" class="seg-btn ${i === cur ? "on" : ""}" role="radio" aria-checked="${i === cur}" ${attrs} data-val="${i}" title="${esc(l[0])}: ${esc(l[1])}${i === rec ? " (recommended)" : ""}">${esc(shortDose(l[0]))}${i === rec ? `<span class="rec-dot" aria-hidden="true"></span>` : ""}</button>`).join("")}</div>
      <span class="dose-detail">${esc(lv[cur][1])}${cur === rec ? " · recommended for you" : ` · we'd suggest ${esc(shortDose(lv[rec][0]))}`}</span>
    </div>`;
  }

  /* ───────────────────────── Helpers ───────────────────────── */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => "$" + n.toFixed(2).replace(/\.00$/, "");
  const money2 = n => "$" + n.toFixed(2);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bundleBase = (ids, doses = {}) => ids.reduce((t, id) => t + P[id].price * doseMult(id, doses[id]), 0);
  /* Plans: the only source of savings, for single products and bundles alike. */
  const PLANS = [
    { id: "once",    name: "One-time",          months: 1,  off: 0,    note: "1-month supply. No subscription.",
      pitch: "Fine for a trial, but one month is rarely enough. Most supplements need weeks of daily use before you feel a difference." },
    { id: "monthly", name: "Monthly",           months: 1,  off: 0.15, note: "Billed monthly. Skip or cancel any time.",
      pitch: "Flexible, but every month is a new chance to skip. A paused box is usually where the habit breaks." },
    { id: "3",       name: "3 months upfront",  months: 3,  off: 0.20, note: "Billed every 3 months. Shipped monthly.",
      pitch: "12 weeks matches the length of most supplement studies. Enough time to actually see what your bundle does for you." },
    { id: "12",      name: "12 months upfront", months: 12, off: 0.40, note: "Billed yearly. Shipped monthly. Best value.",
      pitch: "Decide once and stop thinking about it. A full year of consistency at your lowest price, locked in." },
  ];
  const MAX_OFF = Math.round(Math.max(...PLANS.map(p => p.off)) * 100);
  const SHIP_FEE = 6.95, FREE_SHIP_MIN = 100;   // free shipping only on subscriptions of $100+/month
  // shipping per delivery for a quote (bundle on the result screen, a product on its page)
  const shipFor = q => (q.plan.id !== "once" && q.perMonth >= FREE_SHIP_MIN ? 0 : SHIP_FEE);
  const PERK = "Free weekly pill organizer with your 2nd delivery";
  const PLAN = Object.fromEntries(PLANS.map(p => [p.id, p]));
  const SUB_PLANS = PLANS.filter(p => p.id !== "once");      // shown as cards; one-time is a quiet link
  const planOf = l => PLAN[l.plan] ? l.plan : (l.sub ? "monthly" : "once");
  // Every number shown for a bundle comes from here
  function quote(ids, doses, planId) {
    const plan = PLAN[planId] || PLAN.monthly;
    const full = bundleBase(ids, doses);                 // all products at full price, 1 month
    const planDisc = full * plan.off;
    const perMonth = full - planDisc;
    return { plan, full, planDisc, perMonth, today: perMonth * plan.months, fullToday: full * plan.months,
             savedPct: full ? Math.round((1 - perMonth / full) * 100) : 0 };
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function factsPanel(p) {
    const rows = p.facts.map(([n, a, dv]) => {
      const indent = n.startsWith("  ");
      return `<tr><td${indent ? ' style="padding-left:14px"' : ""}>${esc(n.trim())}</td><td>${esc(a)}</td><td>${esc(dv)}</td></tr>`;
    }).join("");
    return `<div class="facts">
      <h4 class="facts-title">Supplement Facts</h4>
      <div class="facts-serv">Serving size: ${esc(p.form)}<br>Servings per container: ${p.servings}</div>
      <table>
        <thead><tr><th>Amount per serving</th><th></th><th>% Daily Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="facts-foot">† Daily Value not established.</div>
      <div class="facts-other"><strong>Other ingredients:</strong> ${esc(p.other)}</div>
    </div>`;
  }

  /* ───────────────────────── Cart state ───────────────────────── */
  // line: { key, type: 'product'|'stack'|'bundle', id, items?, qty, sub, freq }
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("tropos-cart") || "[]").filter(l => (l.type === "bundle" ? Array.isArray(l.items) && l.items.length && l.items.every(i => P[i]) : l.type === "product" && P[l.id])); } catch { cart = []; }
  const save = () => { try { localStorage.setItem("tropos-cart", JSON.stringify(cart)); } catch {} };

  function linePricing(l) {
    const q = l.type === "product" ? quote([l.id], {}, planOf(l)) : quote(l.items, l.doses || {}, planOf(l));
    return { full: q.fullToday * l.qty, now: q.today * l.qty, q };
  }

  function addToCart(type, id, { sub = true, qty = 1, silent = false, items, doses, plan } = {}) {
    reserveView = null;
    if (type === "bundle") cart = cart.filter(l => l.type !== "bundle"); // one personal bundle at a time
    plan = plan || (sub ? "monthly" : "once");
    const existing = type !== "bundle" && cart.find(l => l.type === type && l.id === id && planOf(l) === plan);
    if (existing) existing.qty += qty;
    else cart.push({ key: type + ":" + id + ":" + Date.now() + Math.random().toString(36).slice(2, 6), type, id, items, doses: doses || (items ? Object.fromEntries(items.map(i => [i, recDose(i, lastAnswers)])) : undefined), qty, sub: plan !== "once", plan, freq: 30 });
    save();
    renderCart();
    const c = $("#cartCount");
    c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
    if (!silent) toast(`${type === "product" ? P[id].name : "Your bundle"} added · ${PLAN[plan].name}`);
  }

  const cartBundle = () => cart.find(l => l.type === "bundle");
  function addToBundle(id) {
    const b = cartBundle();
    if (!b) return addToCart("bundle", "personal", { items: [id], plan: "monthly" });
    if (!b.items.includes(id)) { b.items.push(id); (b.doses ||= {})[id] = recDose(id, lastAnswers); }
    save(); renderCart();
    toast(`${P[id].name} added to your bundle`);
  }

  let reserveView = null, reserveName = "";   // null | "form" | "done"

  // Netlify Forms: POST url-encoded to the site root. The matching hidden forms live in index.html.
  function postForm(name, fields) {
    const body = new URLSearchParams({ "form-name": name, "bot-field": "", ...fields }).toString();
    return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then(r => { if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; } });
  }
  function orderSummary() {
    return cart.map(l => {
      const plan = PLAN[planOf(l)].name;
      if (l.type === "product") return `${P[l.id].name} x${l.qty} (${plan})`;
      const items = l.items.map(i => `${P[i].name} ${DOSES[i].levels[doseIdx(i, (l.doses || {})[i])][0]}`).join(", ");
      return `Bundle x${l.qty} (${plan}): ${items}`;
    }).join(" | ");
  }

  // Order-level totals: shipping is free only when subscriptions add up to $100+ a month
  function cartTotals() {
    let full = 0, now = 0, anySub = false, subMonthly = 0, maxMonths = 1;
    cart.forEach(l => {
      const pr = linePricing(l); full += pr.full; now += pr.now;
      if (planOf(l) !== "once") { anySub = true; subMonthly += pr.q.perMonth * l.qty; }
      maxMonths = Math.max(maxMonths, pr.q.plan.months);
    });
    const shipPer = cart.length && subMonthly < FREE_SHIP_MIN ? SHIP_FEE : 0;
    const shipToday = shipPer * maxMonths;
    return { full, now, anySub, subMonthly, maxMonths, shipPer, shipToday, total: now + shipToday };
  }

  function renderCart() {
    const count = cart.reduce((n, l) => n + l.qty, 0);
    $("#cartCount").textContent = count;

    const T = cartTotals(), { full, now, anySub } = T;
    const meter = $("#shipMeter");
    if (!cart.length) meter.innerHTML = `Free shipping on subscriptions of ${money(FREE_SHIP_MIN)}+ a month.`;
    else if (!T.shipPer) meter.innerHTML = `<strong>You've unlocked free shipping.</strong><div class="bar"><div style="width:100%"></div></div>`;
    else if (anySub) meter.innerHTML = `Add <strong>${money2(FREE_SHIP_MIN - T.subMonthly)}/mo</strong> to your subscription for free shipping.<div class="bar"><div style="width:${Math.min(100, T.subMonthly / FREE_SHIP_MIN * 100)}%"></div></div>`;
    else meter.innerHTML = `Shipping is ${money2(SHIP_FEE)} on one-time orders. Subscribe to ${money(FREE_SHIP_MIN)}+ a month for free shipping.`;

    const body = $("#cartItems");
    if (!cart.length && reserveView !== "done") reserveView = null;
    if (!cart.length) {
      if (reserveView === "done") {
        body.innerHTML = `<div class="reserve-done"><h4>You're on the list${reserveName ? `, ${esc(reserveName)}` : ""}.</h4>
          <p>Your order is reserved at today's price. We'll email you before anything ships, and you won't be charged until you confirm.</p>
          <a href="#quiz" class="reserve-back" data-close>Back to the site</a></div>`;
      } else {
        body.innerHTML = `<div class="empty"><h4>Your cart is empty</h4><p>Not sure where to start? The 10-question survey builds your bundle for you.</p><a href="#quiz" class="btn btn-primary btn-sm" data-close>Take the survey</a></div>`;
      }
      $("#cartFoot").innerHTML = "";
      return;
    }

    body.innerHTML = cart.map(l => {
      const isP = l.type === "product";
      const item = isP ? P[l.id] : { name: "Your Tropos bundle", items: l.items };
      const pr = linePricing(l);
      const others = isP ? [] : PRODUCTS.filter(p => !l.items.includes(p.id));
      const sub = isP ? `${esc(item.kind)} · ${item.servings}-day supply`
        : `${l.items.length} product${l.items.length > 1 ? "s" : ""}`;
      const bundleEdit = isP ? "" : `<ul class="bundle-items">${l.items.map(i => `<li><span>${esc(P[i].name)}</span>${doseSeg(i, doseIdx(i, (l.doses || {})[i]), recDose(i, lastAnswers), `data-act="bundle-dose" data-id="${i}"`)}<span class="bi-price">${money2(P[i].price * doseMult(i, (l.doses || {})[i]))}</span><button data-act="bundle-remove" data-id="${i}" aria-label="Remove ${esc(P[i].name)} from bundle">✕</button></li>`).join("")}</ul>
          ${others.length ? `<label class="bundle-add">+ <select data-act="bundle-add" aria-label="Add a product to your bundle"><option value="">Add a product to your bundle</option>${others.map(p => `<option value="${p.id}">${esc(p.name)} · ${esc(p.kind)} · ${money(p.price)}</option>`).join("")}</select></label>` : ""}`;
      const lineIds = isP ? [l.id] : l.items, lineDoses = isP ? {} : (l.doses || {});
      return `<div class="line" data-key="${l.key}">
        <div>
          <div class="line-top">
            <div><h4>${esc(item.name)}</h4><div class="line-sub">${sub}</div></div>
            <div class="line-price">${pr.full > pr.now ? `<s>${money2(pr.full)}</s>` : ""}${money2(pr.now)}</div>
          </div>
          ${bundleEdit}
          <label class="plan-select">Plan <select data-act="plan" aria-label="Plan">${[...SUB_PLANS, PLAN.once].map(p => {
              const q = quote(lineIds, lineDoses, p.id);
              return `<option value="${p.id}" ${planOf(l) === p.id ? "selected" : ""}>${p.name} · ${money2(q.perMonth)}${p.id === "once" ? "" : "/mo"}${p.off ? ` · ${Math.round(p.off * 100)}% off` : ""}</option>`;
            }).join("")}</select></label>
          <p class="plan-line">${(() => { const q = pr.q; return q.plan.months > 1
              ? `${money2(q.perMonth)}/mo × ${q.plan.months} months, charged today. ${q.plan.note}`
              : q.plan.id === "once" ? `${money2(q.perMonth)} once. ${q.plan.note}` : `${money2(q.perMonth)} per month. ${q.plan.note}`; })()}</p>
          ${planOf(l) !== "once" ? `<p class="perk-line">+ ${PERK}.</p>` : ""}
          ${pr.q.plan.months === 1 ? (() => { const up = quote(lineIds, lineDoses, "3");
            return `<button class="cart-nudge" data-act="plan-up" data-val="3">Stay consistent: 3 months upfront is ${money2(up.perMonth * l.qty)}/mo, ${money2((pr.q.perMonth - up.perMonth) * l.qty)} less →</button>`; })() : ""}
          <div class="line-controls">
            <div class="qty"><button data-act="dec" aria-label="Decrease">−</button><span>${l.qty}</span><button data-act="inc" aria-label="Increase">+</button></div>
            <button class="line-remove" data-act="remove">Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");

    const summary = `
      <div class="sum-row"><span>Full price</span><span>${money2(full)}</span></div>
      ${full > now ? `<div class="sum-row save"><span>Subscription &amp; prepay savings</span><span>−${money2(full - now)}</span></div>` : ""}
      <div class="sum-row"><span>Shipping${T.shipPer && T.maxMonths > 1 ? ` (${T.maxMonths} deliveries)` : ""}</span><span>${T.shipPer ? money2(T.shipToday) : "Free"}</span></div>
      <div class="sum-row total"><span>Your price at launch</span><span>${money2(T.total)}</span></div>`;
    if (reserveView === "done") {
      $("#cartFoot").innerHTML = `<div class="reserve-done"><h4>You're on the list${reserveName ? `, ${esc(reserveName)}` : ""}.</h4>
        <p>Your order is reserved at the price above. We'll email you before anything ships, and you won't be charged until you confirm.</p>
        <button class="reserve-back" data-reserve-back>Back to cart</button></div>`;
      return;
    }
    if (reserveView === "form") {
      $("#cartFoot").innerHTML = `${summary}
        <form id="reserveForm" class="reserve" novalidate>
          <p class="reserve-lead"><strong>No payment today.</strong> Tropos is launching soon. Reserve this order at today's price and we'll email you before anything ships.</p>
          <label>First name<input name="name" autocomplete="given-name" maxlength="40" value="${esc(firstName())}"></label>
          <label>Email<input name="email" type="email" required autocomplete="email" maxlength="120" placeholder="you@example.com"></label>
          <p class="reserve-error" aria-live="polite"></p>
          <button class="btn btn-primary btn-block" type="submit">Reserve my order</button>
          <button type="button" class="reserve-back" data-reserve-back>← Back to cart</button>
          <p class="fine">We only use your email for Tropos launch updates. Unsubscribe any time.</p>
        </form>`;
      return;
    }
    $("#cartFoot").innerHTML = `${summary}
      <button class="btn btn-primary btn-block" id="checkoutBtn">Reserve my order</button>
      <p class="fine">Launching soon: reserve now, pay nothing today. ${anySub ? "Subscribers get a free pill organizer with their 2nd delivery." : ""}</p>`;
  }

  $("#cartItems").addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.tagName === "SELECT" || btn.closest("select")) return;
    const line = cart.find(l => l.key === btn.closest(".line").dataset.key);
    if (!line) return;
    const act = btn.dataset.act;
    if (act === "inc") line.qty++;
    if (act === "dec") line.qty = Math.max(1, line.qty - 1);
    if (act === "remove") cart = cart.filter(l => l !== line);
    if (act === "sub") line.sub = btn.dataset.val === "1";
    if (act === "plan-up") { line.plan = btn.dataset.val; line.sub = true; }
    if (act === "bundle-dose") (line.doses ||= {})[btn.dataset.id] = +btn.dataset.val;
    if (act === "bundle-remove") {
      line.items = line.items.filter(i => i !== btn.dataset.id);
      if (!line.items.length) cart = cart.filter(l => l !== line);
    }
    save(); renderCart();
  });
  $("#cartItems").addEventListener("change", e => {
    if (e.target.dataset.act === "bundle-add" && e.target.value) {
      const line = cart.find(l => l.key === e.target.closest(".line").dataset.key);
      if (line && !line.items.includes(e.target.value)) { line.items.push(e.target.value); (line.doses ||= {})[e.target.value] = recDose(e.target.value, lastAnswers); save(); renderCart(); }
      return;
    }
    if (e.target.dataset.act === "plan") {
      const line = cart.find(l => l.key === e.target.closest(".line").dataset.key);
      if (line) { line.plan = e.target.value; line.sub = line.plan !== "once"; save(); renderCart(); }
      return;
    }
    if (e.target.dataset.act === "bundle-dose") {
      const line = cart.find(l => l.key === e.target.closest(".line").dataset.key);
      if (line) { (line.doses ||= {})[e.target.dataset.id] = +e.target.value; save(); renderCart(); }
      return;
    }
    if (e.target.dataset.act !== "freq") return;
    const line = cart.find(l => l.key === e.target.closest(".line").dataset.key);
    if (line) { line.freq = +e.target.value; save(); }
  });
  $("#cartFoot").addEventListener("click", e => {
    if (e.target.id === "checkoutBtn") { reserveView = "form"; renderCart(); const em = $("#reserveForm [name=email]"); if (em) em.focus(); return; }
    if (e.target.closest("[data-reserve-back]")) { reserveView = null; renderCart(); }
  });
  $("#cartFoot").addEventListener("input", e => {
    const err = e.target.form && $(".reserve-error", e.target.form);
    if (err) err.textContent = "";
  });
  $("#cartFoot").addEventListener("submit", e => {
    if (e.target.id !== "reserveForm") return;
    e.preventDefault();
    const f = e.target, err = $(".reserve-error", f), btn = $("button[type=submit]", f);
    const name = $("[name=name]", f).value.trim(), email = $("[name=email]", f).value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please enter a valid email address."; $("[name=email]", f).focus(); return; }
    const total = cartTotals().total;
    const a = lastAnswers || {};
    const survey = lastAnswers ? JSON.stringify({ goals: a.goals, age: a.age, training: a.training, activity: a.activity, diet: a.diet }) : "";
    btn.disabled = true; btn.textContent = "Reserving…"; err.textContent = "";
    postForm("waitlist", { name, email, order: orderSummary(), price_at_launch: money2(total), survey })
      .then(() => { reserveName = name; reserveView = "done"; cart = []; save(); renderCart(); })
      .catch(e => {
        btn.disabled = false; btn.textContent = "Reserve my order";
        const code = e && e.status ? ` (error ${e.status})` : " (no response)";
        err.textContent = `That didn't go through${code}. Please try again in a moment.`;
        if (window.console) console.warn("Reservation failed:", e);
      });
  });

  /* Drawer open/close */
  const drawer = $("#cart"), scrim = $("#scrim"), modal = $("#modal");
  function openCart() { drawer.classList.add("open"); scrim.classList.add("show"); drawer.setAttribute("aria-hidden", "false"); document.body.classList.add("locked"); }
  function closeCart() { drawer.classList.remove("open"); scrim.classList.remove("show"); drawer.setAttribute("aria-hidden", "true"); if (!modal.classList.contains("open")) document.body.classList.remove("locked"); }
  $("#cartBtn").addEventListener("click", openCart);
  scrim.addEventListener("click", closeCart);
  drawer.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeCart(); });

  /* ───────────────────────── Shop ───────────────────────── */
  function renderShop() {
    const filters = [["all", "All"], ...Object.entries(GOALS)];
    $("#filters").innerHTML = filters.map(([k, v], i) => `<button class="chip ${i === 0 ? "active" : ""}" data-filter="${k}" role="tab" aria-selected="${i === 0}">${v}</button>`).join("");

    $("#productGrid").innerHTML = PRODUCTS.map(p => `
      <article class="card" data-goals="${p.goals.join(" ")}">
        <div class="card-body">
          <div class="card-top">
            <h3><button class="card-name" data-open="${p.id}">${esc(p.name)}</button></h3>
            <div class="card-price">${money(p.price)}<small>from ${money2(p.price * (1 - MAX_OFF / 100))}/mo prepaid</small></div>
          </div>
          <p class="card-purpose">${esc(p.kind)}</p>
          <ul class="key-doses">${p.key.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join("")}</ul>
          <p class="card-meta">${p.servings} servings · ${esc(p.form)} · ${p.free.slice(0, 2).join(" · ")}</p>
          <div class="card-actions">
            <button class="btn btn-ghost btn-sm" data-open="${p.id}">Label &amp; details</button>
            <button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button>
          </div>
        </div>
      </article>`).join("");
  }

  $("#filters").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$(".chip").forEach(c => { c.classList.toggle("active", c === chip); c.setAttribute("aria-selected", c === chip); });
    const f = chip.dataset.filter;
    $$("#productGrid .card").forEach(card => card.classList.toggle("hide", f !== "all" && !card.dataset.goals.split(" ").includes(f)));
  });

  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart("product", add.dataset.add); return; }
    const open = e.target.closest("[data-open]");
    if (open) openModal(open.dataset.open);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); closeCart(); }
  });

  /* ───────────────────────── Example bundles ───────────────────────── */
  function renderExamples() {
    exampleBundles = EXAMPLES.map(ex => recommend(ex.a).map(x => x.id));
    $("#stackGrid").innerHTML = EXAMPLES.map((ex, i) => {
      const items = exampleBundles[i];
      const base = bundleBase(items), sub = quote(items, {}, "monthly").perMonth;
      return `<article class="stack">
        <div class="stack-top">
          <div><p class="example-label">Example survey result</p><h3>${esc(ex.who)}</h3>
          <p class="stack-tags">${ex.tags.map(t => `<span>${esc(t)}</span>`).join("")}</p></div>
          <span class="save-pill">${items.length} products</span>
        </div>
        <ul class="stack-items">${items.map(id => `<li><span>${P[id].name} · ${esc(P[id].kind)}</span><span>${money(P[id].price)}</span></li>`).join("")}</ul>
        <div class="stack-foot">
          <div class="stack-price"><strong>${money2(sub)}</strong><s>${money(base)}</s><small>per month on a monthly subscription</small></div>
          <a href="#quiz" class="btn btn-primary btn-sm">Build mine →</a>
        </div>
      </article>`;
    }).join("");
  }

  /* ───────────────────────── Product modal ───────────────────────── */
  let modalMode = "sub";
  function openModal(id) {
    const p = P[id];
    if (!p) return;
    const bundle = cartBundle();
    const inBundle = bundle && bundle.items.includes(id);
    modalMode = bundle && !inBundle ? "bundle" : "monthly";
    const bq = bundle ? quote([id], {}, planOf(bundle)) : null;
    const panel = $("#modalPanel");
    const pairs = exampleBundles.filter(b => b.includes(id)).flat().filter((x, i, a) => x !== id && a.indexOf(x) === i).slice(0, 3);
    panel.innerHTML = `
      <button class="icon-btn modal-close" data-close-modal aria-label="Close">✕</button>
      <div class="pd">
        <div class="pd-info">
          <p class="eyebrow">${p.num} · ${esc(p.kind)}</p>
          <h2 id="modalTitle">${esc(p.name)}</h2>
          <p class="pd-purpose">${esc(p.purpose)}</p>
          <div class="pd-badges">${p.free.map(f => `<span>${esc(f)}</span>`).join("")}</div>
          <ul class="pd-benefits">${p.benefits.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          <div class="buy-opts" role="radiogroup" aria-label="Purchase option">
            ${bundle && !inBundle ? `<button class="buy-opt on" data-buy="bundle" role="radio" aria-checked="true"><span><strong>Add to my bundle</strong><small>Joins your bundle on its ${esc(bq.plan.name.toLowerCase())} plan</small></span><span class="p">${bq.planDisc ? `<s>${money(p.price)}</s>` : ""}${money2(bq.perMonth)}${bq.plan.id === "once" ? "" : "/mo"}</span></button>` : ""}
            ${inBundle ? `<p class="in-bundle">✓ Already in your bundle</p>` : ""}
            ${SUB_PLANS.map(pl => { const q = quote([id], {}, pl.id); const on = modalMode === pl.id;
              return `<button class="buy-opt ${on ? "on" : ""}" data-buy="${pl.id}" role="radio" aria-checked="${on}"><span><strong>${pl.name}${pl.off ? ` · save ${Math.round(pl.off * 100)}%` : ""}</strong><small>${pl.months > 1 ? `${money2(q.today)} today · ` : ""}${esc(pl.note)}</small></span><span class="p">${pl.off ? `<s>${money(p.price)}</s>` : ""}${money2(q.perMonth)}${pl.id === "once" ? "" : "/mo"}</span></button>`; }).join("")}
            <button class="once-opt ${modalMode === "once" ? "on" : ""}" data-buy="once" role="radio" aria-checked="${modalMode === "once"}">Or buy once at full price, ${money2(p.price)}</button>
          </div>
          <p class="perk-note">+ Subscribe on any plan and get a free weekly pill organizer with your 2nd delivery. Shipping is ${money2(SHIP_FEE)}, free on subscriptions of ${money(FREE_SHIP_MIN)}+ a month.</p>
          <button class="btn btn-primary btn-block" id="modalAdd">Add to cart</button>
          <div class="pd-tabs">
            <details open><summary>Supplement facts</summary><div class="tab-body">${factsPanel(p)}</div></details>
            <details><summary>How to take</summary><div class="tab-body"><p>${esc(p.take)}</p><p><strong>Typical daily range:</strong> ${esc(DOSES[p.id].range)}. You can set your dose per product in your bundle.</p>${p.caution ? `<div class="caution"><strong>Caution:</strong> ${esc(p.caution)}</div>` : ""}</div></details>
            <details><summary>Testing &amp; sourcing</summary><div class="tab-body"><p>Made in an NSF-certified, cGMP facility. Every batch is tested by an independent ISO 17025-accredited lab for identity, potency, microbes and heavy metals (lead, mercury, cadmium, arsenic).</p><p>Find the lot number on the bottom of your ${p.shape === "tub" ? "tub" : "bottle"} to see that batch's results.</p></div></details>
            ${pairs.length ? `<details><summary>Pairs well with</summary><div class="tab-body"><p>${pairs.map(x => `<a href="#" data-open="${x}" style="text-decoration:underline">${P[x].name}</a>`).join(", ")}</p></div></details>` : ""}
          </div>
        </div>
      </div>`;
    modal.setAttribute("aria-labelledby", "modalTitle");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    panel.scrollTop = 0;
    $("#modalAdd").onclick = () => {
      if (modalMode === "bundle") addToBundle(id);
      else addToCart("product", id, { plan: modalMode });
      closeModal();
    };
    $(".modal-close", panel).focus();
  }
  function closeModal() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!drawer.classList.contains("open")) document.body.classList.remove("locked");
  }
  modal.addEventListener("click", e => {
    if (e.target === modal || e.target.closest("[data-close-modal]")) { closeModal(); return; }
    const opt = e.target.closest("[data-buy]");
    if (opt) {
      modalMode = opt.dataset.buy;
      $$("[data-buy]", modal).forEach(b => { const on = b === opt; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    }
    if (e.target.closest("a[data-open]")) e.preventDefault();
  });

  /* ───────────────────────── Quiz ───────────────────────── */
  const QUESTIONS = [
    { name: "name", type: "text", section: "About you", optional: true, title: "First, what should we call you?", help: "Optional. Just so your bundle feels like yours.", placeholder: "First name" },
    { name: "goals", type: "checkbox", section: "Goals", max: 3, title: "What are you working on{name}?", help: "Pick up to three. We'll prioritize in that order.", cols: 2, options: [
      ["strength", "Build strength & muscle", "Lifting, sport, getting stronger"],
      ["energy", "More daily energy", "Fewer afternoon slumps"],
      ["sleep", "Sleep deeper", "Fall asleep faster, wake up rested"],
      ["stress", "Handle stress better", "Feel calmer and more even"],
      ["focus", "Sharper focus", "Long stretches of deep work"],
      ["heart", "Heart & long-term health", "Playing the long game"],
      ["recovery", "Recover faster", "Less soreness between sessions"],
      ["essentials", "Cover nutritional gaps", "A solid daily baseline"],
    ] },
    { name: "age", type: "radio", section: "About you", title: "How old are you?", help: "Your needs shift through your 20s and 30s. Tropos is for adults 18+.", cols: 4, options: [
      ["18", "18–24"], ["25", "25–29"], ["30", "30–39"], ["40p", "40+"],
    ] },
    { name: "training", type: "radio", section: "Training", title: "How often do you train?", help: "Any structured exercise counts: lifting, running, sport, classes.", cols: 2, options: [
      ["0", "Rarely", "Less than once a week"], ["1", "1–2 days a week", "Staying active"],
      ["3", "3–4 days a week", "Consistent routine"], ["5", "5+ days a week", "Training hard"],
    ] },
    { name: "activity", type: "checkbox", section: "Training", title: "What kind of training do you do?", help: "Select all that apply. Different training burns through different nutrients.", cols: 2, options: [
      ["lifting", "Lifting & strength", "Weights, calisthenics, CrossFit"],
      ["cardio", "Running & endurance", "Running, cycling, rowing, swimming"],
      ["sport", "Team or court sports", "Football, basketball, tennis, BJJ"],
      ["mobility", "Yoga, mobility or walking", "Lower intensity, done often"],
    ] },
    { name: "energy", type: "radio", section: "Energy", title: "When does your energy usually dip{name}?", cols: 2, options: [
      ["morning", "Mornings", "Slow to get going"], ["afternoon", "Mid-afternoon", "The 3 p.m. slump"],
      ["allday", "Pretty much all day", "Running on low most of the time"], ["rarely", "Rarely", "Energy's generally good"],
    ] },
    { name: "sleep", type: "radio", section: "Sleep & stress", title: "How's your sleep, honestly?", cols: 2, options: [
      ["good", "Solid", "Fall asleep easily, wake up rested"], ["ok", "Hit or miss", "Some good nights, some not"],
      ["poor", "Rough", "Trouble falling or staying asleep"], ["short", "Not enough of it", "Schedule cuts it short"],
    ] },
    { name: "stress", type: "radio", section: "Sleep & stress", title: "Day to day, how stressed do you feel?", cols: 4, options: [
      ["low", "Low"], ["mod", "Moderate"], ["high", "High"], ["vhigh", "Very high"],
    ] },
    { name: "diet", type: "radio", section: "Nutrition", title: "Which best describes how you eat?", cols: 2, options: [
      ["omni", "I eat most things", "Meat, fish, dairy"], ["nofish", "Rarely eat fish", "Fewer than 2 servings a week"],
      ["veg", "Vegetarian", "No meat or fish"], ["vegan", "Vegan", "No animal products"],
    ] },
    { name: "extras", type: "checkbox", section: "Lifestyle", title: "Last one{name}. Anything else we should know?", help: "Optional. Select any that apply.", cols: 2, optional: true, options: [
      ["lowprotein", "I don't eat much protein", "Fewer than 3 protein-rich meals a day"],
      ["indoors", "I spend most days indoors", "Limited sun exposure"],
      ["sweat", "I sweat a lot", "Hot climate, long sessions, sauna"],
      ["alcohol", "I drink 5+ times a week", "Beer, wine or spirits"],
      ["caffeine", "I'm sensitive to caffeine", "Or already drink a lot of it"],
      ["meds", "I take prescription medication", "We'll flag anything to check with your doctor"],
    ] },
  ];

  const form = $("#quizForm");
  let step = 0;

  function renderQuiz() {
    form.innerHTML = QUESTIONS.map((q, i) => `
      <fieldset class="quiz-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-labelledby="qt-${i}" style="border:0;margin:0;min-width:0">
        <p class="q-count"><span class="q-section">${esc(q.section)}</span> Question ${i + 1} of ${QUESTIONS.length}</p>
        <h3 class="q-title" id="qt-${i}" data-tpl="${esc(q.title)}">${esc(q.title.replace("{name}", ""))}</h3>
        ${q.help ? `<p class="q-help">${esc(q.help)}</p>` : `<div style="height:20px"></div>`}
        ${q.type === "text"
          ? `<input class="q-text" type="text" id="q-${q.name}" name="${q.name}" placeholder="${esc(q.placeholder || "")}" maxlength="30" autocomplete="given-name">`
          : `<div class="options ${q.cols === 4 ? "cols-4" : q.cols === 3 ? "cols-3" : ""}">
          ${q.options.map(([v, t, s]) => `<div class="opt">
            <input type="${q.type}" id="q-${q.name}-${v}" name="${q.name}" value="${v}">
            <label for="q-${q.name}-${v}"><span class="box"></span><span class="opt-text"><strong>${esc(t)}</strong>${s ? `<small>${esc(s)}</small>` : ""}</span></label>
          </div>`).join("")}
        </div>`}
        <p class="q-error" aria-live="polite"></p>
        <div class="q-nav">
          <button type="button" class="q-back" data-q="back" ${i === 0 ? "disabled" : ""}>← Back</button>
          <button type="button" class="btn btn-primary" data-q="next">${i === QUESTIONS.length - 1 ? "Build my bundle" : "Continue"} <span aria-hidden="true">→</span></button>
        </div>
      </fieldset>`).join("");
    updateBar();
  }

  function updateBar() { $("#quizBar").style.width = `${(step / QUESTIONS.length) * 100}%`; }

  function values(name) {
    const text = $(`input[type="text"][name="${name}"]`, form);
    if (text) { const v = text.value.trim(); return v ? [v] : []; }
    return $$(`input[name="${name}"]:checked`, form).map(i => i.value);
  }
  const firstName = () => (values("name")[0] || "").replace(/\s+/g, " ").slice(0, 30);
  function personalize() {
    const n = firstName();
    $$(".q-title[data-tpl]", form).forEach(h => { h.textContent = h.dataset.tpl.replace("{name}", n ? `, ${n}` : ""); });
  }

  form.addEventListener("change", e => {
    const q = QUESTIONS.find(q => q.name === e.target.name);
    if (q && q.max && values(q.name).length > q.max) {
      e.target.checked = false;
      $(".quiz-step.active .q-error", form).textContent = `Pick up to ${q.max}. Unselect one to swap.`;
      return;
    }
    $(".quiz-step.active .q-error", form).textContent = "";
    // radios auto-advance for a quicker flow
    if (q && q.type === "radio") setTimeout(() => go(1), 220);
  });

  form.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches(".q-text")) { e.preventDefault(); go(1); }
  });

  form.addEventListener("click", e => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    go(b.dataset.q === "next" ? 1 : -1);
  });

  function go(dir) {
    const q = QUESTIONS[step];
    if (dir > 0 && !q.optional && values(q.name).length === 0) {
      $(".quiz-step.active .q-error", form).textContent = "Choose an option to continue.";
      return;
    }
    if (dir > 0 && step === QUESTIONS.length - 1) { showResult(); return; }
    step = Math.max(0, Math.min(QUESTIONS.length - 1, step + dir));
    personalize();
    $$(".quiz-step", form).forEach((el, i) => el.classList.toggle("active", i === step));
    updateBar();
    const t = $(".quiz-step.active .q-text", form); if (t) t.focus({ preventScroll: true });
  }

  function recommend(a) {
    const goals = a.goals;
    const has = g => goals.includes(g);
    const w = g => { const i = goals.indexOf(g); return i < 0 ? 0 : [1.3, 1.15, 1][i]; }; // first pick weighs most
    const ex = a.extras || [];
    const act = a.activity || [];
    const training = +a.training[0];
    const sleep = a.sleep[0], stress = a.stress[0], diet = a.diet[0], age = a.age[0];
    const energy = (a.energy || [])[0];

    const r = {}; // id -> { score, why: [] }
    const add = (id, pts, why) => { (r[id] ||= { score: 0, why: [] }); r[id].score += pts; if (why) r[id].why.push(why); };

    // Foundation: everyone's baseline
    add("foundation", 3 + 3 * w("essentials"), has("essentials") ? "you want to <b>cover nutritional gaps</b>" : "it's the <b>foundation</b> every bundle is built on");
    if (ex.includes("indoors")) add("foundation", 2, "you're <b>mostly indoors</b>, so vitamin D matters more");
    if (diet === "vegan" || diet === "veg") add("foundation", 1, `B12 is hard to get on a <b>${diet === "vegan" ? "vegan" : "vegetarian"}</b> diet`);
    if (age === "40p") add("foundation", 1, "zinc and D3 needs rise <b>after 40</b>");
    if (energy === "allday") add("foundation", 2, "being <b>low on energy all day</b> can point to gaps in D3 and B12");
    if (ex.includes("alcohol")) add("foundation", 1, "regular <b>alcohol</b> depletes B vitamins and zinc");

    // Omega (fish oil: not for vegetarians/vegans)
    if (diet !== "veg" && diet !== "vegan") {
      if (has("heart")) add("omega", 4 * w("heart"), "you're focused on <b>heart &amp; long-term health</b>");
      if (diet === "nofish") add("omega", 3, "you <b>rarely eat fish</b>, the main source of EPA &amp; DHA");
      if (has("focus")) add("omega", 1.5 * w("focus"), "DHA supports <b>brain function</b>");
      if (has("recovery")) add("omega", 1.5 * w("recovery"), "omega-3s support <b>recovery</b>");
      if (age === "40p") add("omega", 1);
      if (act.includes("cardio")) add("omega", 1, "omega-3s support joints under <b>endurance training</b>");
    }

    // Creatine
    if (has("strength")) add("creatine", 4 * w("strength"), "it's the best-studied supplement for <b>strength</b>");
    if (training >= 3) add("creatine", 2, `you train <b>${training === 5 ? "5+" : "3–4"} days a week</b>`);
    if (has("focus")) add("creatine", 1 * w("focus"));
    if (has("recovery")) add("creatine", 1 * w("recovery"));
    if (act.includes("lifting")) add("creatine", 2, "you <b>lift</b>, where creatine has the strongest evidence");
    if (act.includes("sport")) add("creatine", 1, "it supports repeated sprints in <b>sport</b>");

    // Magnesium
    if (has("sleep")) add("magnesium", 2.5 * w("sleep"), "it supports <b>restful sleep</b>");
    if (has("recovery")) add("magnesium", 2.5 * w("recovery"), "it supports <b>muscle recovery</b>");
    if (has("stress")) add("magnesium", 1.5 * w("stress"));
    if (training >= 5 || ex.includes("sweat")) add("magnesium", 1, "you lose more magnesium through <b>sweat</b>");
    if (sleep === "poor" || sleep === "ok") add("magnesium", 1);
    if (act.includes("cardio") || act.includes("sport")) add("magnesium", 1, "<b>endurance and sport</b> raise magnesium needs");
    if (ex.includes("alcohol")) add("magnesium", 1.5, "<b>alcohol</b> depletes magnesium");

    // Ashwagandha (skip if meds: flag instead)
    if (has("stress")) add("ashwagandha", 4 * w("stress"), "you want to <b>handle stress better</b>");
    if (stress === "high" || stress === "vhigh") add("ashwagandha", 2, `your stress is <b>${stress === "vhigh" ? "very high" : "high"}</b>`);
    if (has("sleep")) add("ashwagandha", 1 * w("sleep"));

    // Protein (whey: not for vegans)
    if (diet !== "vegan") {
      if (has("strength")) add("protein", 3 * w("strength"), "hitting your <b>protein target</b> drives muscle growth");
      if (has("recovery")) add("protein", 1.5 * w("recovery"));
      if (training >= 3) add("protein", 1);
      if (act.includes("lifting")) add("protein", 1.5);
      if (ex.includes("lowprotein")) add("protein", 3, "you <b>don't get much protein</b> from food");
    }

    // Hydrate
    if (ex.includes("sweat")) add("hydrate", 3.5, "you <b>sweat a lot</b>");
    if (training >= 5) add("hydrate", 2, "you're <b>training 5+ days</b> a week");
    if (has("energy")) add("hydrate", 1.5 * w("energy"), "mild dehydration is a common cause of <b>low energy</b>");
    if (act.includes("cardio")) add("hydrate", 2, "<b>long cardio sessions</b> drain electrolytes");
    if (act.includes("sport")) add("hydrate", 1);
    if (energy === "afternoon" || energy === "allday") add("hydrate", 1);

    // Rest
    if (has("sleep")) add("rest", 3.5 * w("sleep"), "you want to <b>sleep deeper</b>");
    if (sleep === "poor") add("rest", 2.5, "you said sleep has been <b>rough</b>");
    if (sleep === "ok") add("rest", 1);
    if (ex.includes("alcohol")) add("rest", 0.5);

    // Focus (not for caffeine-sensitive)
    if (!ex.includes("caffeine")) {
      if (has("focus")) add("focus", 3 * w("focus"), "you want <b>sharper focus</b>");
      if (has("energy")) add("focus", 2.5 * w("energy"), "you want <b>steadier energy</b> without the crash");
      if (sleep === "short") add("focus", 0.5);
      if (energy === "morning") add("focus", 1.5, "your <b>mornings start slow</b>");
      if (energy === "afternoon") add("focus", 1.5, "you hit a <b>mid-afternoon slump</b>");
    }

    const ranked = Object.entries(r)
      .map(([id, v]) => ({ id, ...v }))
      .filter(x => x.score >= 3 && x.why.length)
      .sort((a, b) => b.score - a.score);

    // Always keep Foundation, cap at 5, keep ranked order
    let picks = ranked.slice(0, 5);
    if (!picks.find(x => x.id === "foundation")) picks = [...picks.slice(0, 4), ranked.find(x => x.id === "foundation")];
    picks.sort((a, b) => b.score - a.score);
    const top = picks[0].score;
    return picks.map(x => ({ ...x, match: Math.min(99, Math.round(70 + 29 * (x.score / top))) }));
  }

  const LABEL = {
    age: { 18: "Age 18–24", 25: "Age 25–29", 30: "In your 30s", "40p": "40+" },
    training: { 0: "Trains rarely", 1: "Trains 1–2×/week", 3: "Trains 3–4×/week", 5: "Trains 5+×/week" },
    activity: { lifting: "Lifts", cardio: "Endurance", sport: "Plays sport", mobility: "Mobility" },
    energy: { morning: "Slow mornings", afternoon: "Afternoon slump", allday: "Low energy", rarely: "Good energy" },
    sleep: { good: "Sleeps well", ok: "Patchy sleep", poor: "Rough sleep", short: "Short on sleep" },
    stress: { low: "Low stress", mod: "Moderate stress", high: "High stress", vhigh: "Very high stress" },
    diet: { omni: "Eats most things", nofish: "Rarely eats fish", veg: "Vegetarian", vegan: "Vegan" },
  };

  let lastPicks = [];       // current selection on the result screen
  let lastDoses = {};
  let lastPlan = "monthly";
  let lastAnswers = null;
  function showResult() {
    const res = $("#quizResult");
    $("#quizBar").style.width = "100%";
    form.hidden = true;
    res.hidden = false;
    const n = firstName();
    const steps = ["Weighing your goals and training", "Checking diet, caffeine and medication fit", "Matching 9 products to your answers", "Applying your bundle pricing"];
    res.innerHTML = `<div class="building"><div class="spinner" aria-hidden="true"></div>
      <h3>Building ${n ? esc(n) + "'s" : "your"} bundle…</h3>
      <ul>${steps.map((t, i) => `<li style="animation-delay:${i * 0.35}s">${t}</li>`).join("")}</ul></div>`;
    $("#quiz").scrollIntoView({ behavior: "smooth", block: "start" });
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(renderResult, reduce ? 300 : 1800);
  }

  function renderResult() {
    const answers = Object.fromEntries(QUESTIONS.map(q => [q.name, values(q.name)]));
    const picks = recommend(answers);
    lastAnswers = answers;
    lastPicks = picks.map(p => p.id);
    lastDoses = Object.fromEntries(PRODUCTS.map(p => [p.id, recDose(p.id, answers)]));
    const goalNames = answers.goals.map(g => GOALS[g].toLowerCase());
    const goalText = goalNames.length > 1 ? goalNames.slice(0, -1).join(", ") + " and " + goalNames.slice(-1) : goalNames[0];

    const notes = [];
    if (answers.extras.includes("meds")) notes.push("Because you take prescription medication, please check this bundle with your doctor before starting. Each product page lists its cautions.");
    if (answers.diet[0] === "veg" || answers.diet[0] === "vegan") notes.push("Omega is made from fish oil, so we've left it out. A vegan algae omega-3 is coming soon.");
    if (answers.diet[0] === "vegan") notes.push("Protein is whey (dairy), so it's not included in your bundle.");
    if (answers.extras.includes("caffeine")) notes.push("We've left out Focus since you're caffeine-sensitive.");
    if (lastPicks.includes("ashwagandha")) notes.push("Calm (ashwagandha) isn't suitable with thyroid medication or autoimmune conditions.");

    if (answers.extras.includes("lowprotein") && answers.diet[0] === "vegan") notes.push("You said you don't eat much protein. A plant protein is on our roadmap. Until then, aim for legumes, tofu and tempeh at most meals.");
    const n = firstName();
    const profile = [
      LABEL.age[answers.age[0]], LABEL.training[answers.training[0]],
      ...answers.activity.map(x => LABEL.activity[x]), LABEL.energy[answers.energy[0]],
      LABEL.sleep[answers.sleep[0]], LABEL.stress[answers.stress[0]], LABEL.diet[answers.diet[0]],
    ].filter(Boolean);
    const res = $("#quizResult");
    res.innerHTML = `
      <div class="result-head">
        <div>
          <p class="eyebrow">${n ? esc(n) + "'s" : "Your"} personal bundle</p>
          <h3>${n ? esc(n) + ", here are" : "Here are"} ${picks.length} products for ${esc(goalText)}.</h3>
          <p class="profile">${profile.map(t => `<span>${esc(t)}</span>`).join("")}</p>
          <p>Ranked by how closely each matches your answers, with a starting dose set for you. Subscribe to save 15%, or pay upfront to save up to ${MAX_OFF}%.</p>
        </div>
        <button class="q-back" data-restart>↺ Retake survey</button>
      </div>
      <div class="result-list">
        ${picks.map(x => {
          const p = P[x.id];
          const r3 = x.why.slice(0, 3); const why = r3.length > 1 ? r3.slice(0, -1).join(", ") + ", and " + r3[r3.length - 1] : r3[0];
          return `<div class="result-item" data-item="${p.id}">
            <div>
              <span class="match">${x.match}% match</span>
              <h4>${esc(p.name)}<span>${esc(p.kind)}</span></h4>
              <p class="result-why">Because ${why}.</p>
              <div class="dose" data-dose-wrap="${p.id}"><span class="dose-label">Daily dose</span>${doseSeg(p.id, lastDoses[p.id], recDose(p.id, answers), `data-dose="${p.id}"`)}
                <span class="dose-range">Typical range ${esc(DOSES[p.id].range)}</span></div>
              <button class="q-back" style="padding:4px 0 0;font-size:13px;text-decoration:underline" data-open="${p.id}">View label</button>
            </div>
            <div class="result-side"><div class="result-price" data-price="${p.id}">${money2(p.price * doseMult(p.id, lastDoses[p.id]))}</div>
              <button class="pick-toggle" data-toggle-item="${p.id}" aria-pressed="true">Remove</button></div>
          </div>`;
        }).join("")}
      </div>
      <div class="add-more">
        <h4>Customize your bundle</h4>
        <p>Add anything else you'd like. Your plan's savings apply to everything in your bundle. Doses start at what we'd recommend for you, and you can change them in your cart.</p>
        <div class="add-grid">
          ${PRODUCTS.filter(p => !lastPicks.includes(p.id)).map(p => {
            const warn = fitWarning(p.id, answers);
            return `<div class="add-card" data-item="${p.id}">
              <div class="add-info"><strong>${esc(p.name)}</strong><span>${esc(p.kind)} · ${esc(doseText(p.id, lastDoses[p.id]))}</span>${warn ? `<em>${esc(warn)}</em>` : ""}</div>
              <div class="result-side"><div class="result-price">${money2(p.price * doseMult(p.id, lastDoses[p.id]))}</div>
                <button class="pick-toggle" data-toggle-item="${p.id}" aria-pressed="false">+ Add</button></div>
            </div>`;
          }).join("")}
        </div>
      </div>
      <div class="result-foot" id="resultFoot"></div>
      ${notes.length ? `<div class="result-note">${notes.map(esc).join("<br>")}</div>` : ""}
      <p class="result-note" style="background:none;padding:14px 0 0">These recommendations are general guidance, not medical advice.</p>`;
    updateResultFoot();
  }

  // Products the survey excluded for a reason: warn rather than hide
  function fitWarning(id, a) {
    const diet = a.diet[0], ex = a.extras || [];
    if (id === "omega" && (diet === "veg" || diet === "vegan")) return "Contains fish oil";
    if (id === "protein" && diet === "vegan") return "Contains dairy (whey)";
    if (id === "focus" && ex.includes("caffeine")) return "Contains 100 mg caffeine";
    if (id === "ashwagandha" && ex.includes("meds")) return "Check with your doctor first";
    return "";
  }

  function updateResultFoot() {
    const foot = $("#resultFoot");
    if (!foot) return;
    $$("#quizResult [data-item]").forEach(el => {
      const on = lastPicks.includes(el.dataset.item);
      el.classList.toggle("is-off", !on);
      const b = $("[data-toggle-item]", el);
      b.setAttribute("aria-pressed", on); b.textContent = on ? (el.classList.contains("add-card") ? "✓ Added" : "Remove") : (el.classList.contains("add-card") ? "+ Add" : "Add back");
      el.classList.toggle("is-added", on && el.classList.contains("add-card"));
    });
    const n = lastPicks.length;
    if (!n) {
      foot.innerHTML = `<div class="result-total"><strong>Empty bundle</strong><br><span class="muted">Add at least one product to continue.</span></div>
        <div class="result-actions"><button class="btn btn-primary" disabled>Add bundle to cart →</button></div>`;
      return;
    }
    const q = quote(lastPicks, lastDoses, lastPlan), ship = shipFor(q);
    foot.innerHTML = `
      <div class="plans">
        <h4>Choose your plan</h4>
        <div class="plan-grid" role="radiogroup" aria-label="Plan">
          ${SUB_PLANS.map(p => {
            const pq = quote(lastPicks, lastDoses, p.id);
            return `<button class="plan ${p.id === lastPlan ? "on" : ""}" data-plan="${p.id}" role="radio" aria-checked="${p.id === lastPlan}">
              ${p.id === "12" ? `<span class="plan-flag">Best value</span>` : p.id === "monthly" ? `<span class="plan-flag">Most flexible</span>` : ""}
              <strong>${p.name}</strong>
              <span class="plan-price">${money2(pq.perMonth)}<small>${p.id === "once" ? "" : "/mo"}</small></span>
              <span class="plan-today">${p.months > 1 ? `${money2(pq.today)} today` : p.id === "once" ? "1-month supply" : "Billed monthly"}</span>
              <span class="plan-save">${pq.savedPct ? `Save ${pq.savedPct}%` : "Full price"}</span>
              ${p.id !== "once" ? `<span class="plan-perk">+ Free organizer</span>` : ""}
              <span class="plan-perk">${shipFor(pq) ? `+ ${money2(SHIP_FEE)} shipping` : "Free shipping"}</span>
            </button>`;
          }).join("")}
        </div>
        ${(() => { const oq = quote(lastPicks, lastDoses, "once");
          return lastPlan === "once"
            ? `<p class="once-link is-on">One-time purchase selected: ${money2(oq.today)}, no subscription. <button data-plan="monthly">Switch to monthly and save 15%</button></p>`
            : `<p class="once-link">Not ready to subscribe? <button data-plan="once">Buy once at full price (${money2(oq.today)})</button></p>`; })()}
        <p class="plan-note">${esc(q.plan.note)}</p>
        <div class="plan-pitch ${q.plan.months > 1 ? "is-upfront" : ""}"><strong>${q.plan.months > 1 ? "Built for consistency." : "Worth knowing."}</strong> ${esc(q.plan.pitch)}
          ${q.plan.months === 1 ? (() => { const up = quote(lastPicks, lastDoses, "3");
            return `<button class="plan-nudge" data-plan="3">Switch to 3 months upfront: ${money2(q.perMonth - up.perMonth)} less per month →</button>`; })() : ""}
        </div>
        <details class="why-upfront">
          <summary>Why pay upfront?</summary>
          <ul>
            <li><strong>Consistency is what works.</strong> Creatine takes around 3–4 weeks of daily use to fully saturate your muscles, and most studies on ingredients like ashwagandha and omega-3 run 8–12 weeks. Results come from the days you don't skip.</li>
            <li><strong>Decide once.</strong> Paying upfront turns a good intention into a commitment. No monthly "do I really need this?" moment, no running out and forgetting to reorder.</li>
            <li><strong>Your best price, locked in.</strong> Up to ${MAX_OFF}% off for the whole term, still shipped fresh every month, and you can still change doses or swap products.</li>
          </ul>
        </details>
      </div>
      <div class="breakdown">
        <div class="bd-row"><span>${n} product${n > 1 ? "s" : ""} at full price</span><span>${money2(q.full)}/mo</span></div>
        ${q.planDisc ? `<div class="bd-row save"><span>${q.plan.id === "monthly" ? "Monthly subscription" : q.plan.name} (${Math.round(q.plan.off * 100)}% off)</span><span>−${money2(q.planDisc)}</span></div>` : `<div class="bd-row muted"><span>Subscribe to save 15%, or prepay to save up to ${MAX_OFF}%</span><span></span></div>`}
        ${q.plan.id !== "once" ? `<div class="bd-row save"><span>Weekly pill organizer, with your 2nd delivery</span><span>Free</span></div>` : ""}
        <div class="bd-row strong"><span>Your price per month</span><span>${money2(q.perMonth)}</span></div>
        <div class="bd-row"><span>Shipping${ship ? (q.plan.months > 1 ? ` (${money2(ship)} × ${q.plan.months} deliveries)` : "") : ""}</span><span>${ship ? money2(ship * q.plan.months) : "Free"}</span></div>
        ${ship && q.plan.id !== "once" ? `<div class="bd-row muted"><span>Add ${money2(FREE_SHIP_MIN - q.perMonth)}/mo for free shipping</span><span></span></div>` : ""}
        <div class="bd-row total"><span>Due today${q.plan.months > 1 ? ` (${q.plan.months} months)` : ""}</span><span>${money2(q.today + ship * q.plan.months)}</span></div>
        <p class="bd-foot">${q.savedPct ? `You save ${money2(q.full - q.perMonth)} a month (${q.savedPct}%) compared with paying full price.` : ""}</p>
      </div>
      <div class="result-actions plan-actions">
        <button class="btn btn-primary btn-lg" data-add-picks="1">Add bundle to cart · ${money2(q.today + ship * q.plan.months)} →</button>
      </div>`;
  }

  $("#quizResult").addEventListener("click", e => {
    const b = e.target.closest("[data-dose]");
    if (!b) return;
    const id = b.dataset.dose;
    lastDoses[id] = +b.dataset.val;
    const wrap = $(`[data-dose-wrap="${id}"] .dose-pick`);
    if (wrap) wrap.outerHTML = doseSeg(id, lastDoses[id], recDose(id, lastAnswers), `data-dose="${id}"`);
    const pr = $(`[data-price="${id}"]`); if (pr) pr.textContent = money2(P[id].price * doseMult(id, lastDoses[id]));
    updateResultFoot();
  });

  $("#quizResult").addEventListener("click", e => {
    if (e.target.closest("[data-restart]")) {
      form.reset(); personalize(); form.hidden = false; $("#quizResult").hidden = true; step = 0;
      $$(".quiz-step", form).forEach((el, i) => el.classList.toggle("active", i === 0));
      updateBar();
      return;
    }
    const pl = e.target.closest("[data-plan]");
    if (pl) { lastPlan = pl.dataset.plan; updateResultFoot(); return; }
    const t = e.target.closest("[data-toggle-item]");
    if (t) {
      const id = t.dataset.toggleItem;
      lastPicks = lastPicks.includes(id) ? lastPicks.filter(x => x !== id) : [...lastPicks, id];
      updateResultFoot();
      return;
    }
    const b = e.target.closest("[data-add-picks]");
    if (b && !b.disabled && lastPicks.length) {
      addToCart("bundle", "personal", { sub: lastPlan !== "once", plan: lastPlan, items: [...lastPicks], doses: Object.fromEntries(lastPicks.map(i => [i, lastDoses[i]])), silent: true });
      toast(`Your ${lastPicks.length}-product bundle is in your cart`);
      openCart();
    }
  });

  /* ───────────────────────── Misc ───────────────────────── */
  (() => {
    const ex = [["creatine", 1, "Strength"], ["magnesium", 2, "Sleep"], ["rest", 1, "Sleep"], ["foundation", 1, "Daily essentials"]];
    const q = quote(ex.map(e => e[0]), Object.fromEntries(ex.map(e => [e[0], e[1]])), "monthly");
    $("#heroVisual").innerHTML = `<div class="hd-card">
      <p class="hd-eyebrow">Example survey result</p>
      <h3 class="hd-title">Alex's bundle</h3>
      <p class="hd-tags"><span>Age 25–29</span><span>Lifts 3–4×/week</span><span>Rough sleep</span></p>
      <ul class="hd-list">${ex.map(([id, d, why]) => `<li><span class="hd-num">${P[id].num}</span><span class="hd-name">${esc(P[id].name)}</span><span class="hd-dose">${esc(shortDose(DOSES[id].levels[d][0]))} · ${esc(DOSES[id].levels[d][1])}</span><span class="hd-why">${why}</span></li>`).join("")}</ul>
      <div class="hd-foot"><span><strong>${money2(q.perMonth)}</strong>/mo on monthly</span><span>Built from 10 answers</span></div>
    </div>`;
  })();
  $("#labelDemo").innerHTML = factsPanel(P.foundation);

  const burger = $("#burger"), links = $("#navLinks");
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", e => { if (e.target.tagName === "A") { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } });

  // Floating survey prompt: visible after the hero, hidden while the survey is on screen or done
  const floatCta = $("#floatCta");
  const seen = { hero: true, quiz: false };
  const syncFloat = () => floatCta.classList.toggle("show", !seen.hero && !seen.quiz && $("#quizResult").hidden);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { seen[en.target.dataset.watch] = en.isIntersecting; });
      syncFloat();
    }, { threshold: 0.15 });
    const hero = $(".hero"); hero.dataset.watch = "hero"; io.observe(hero);
    const quiz = $("#quiz"); quiz.dataset.watch = "quiz"; io.observe(quiz);
  }

  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $("#newsForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, email = $("[name=email]", f).value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Please enter a valid email address."); return; }
    postForm("newsletter", { email })
      .then(() => { f.reset(); toast("You're on the list. Thanks!"); })
      .catch(() => toast("That didn't go through. Please try again."));
  });

  renderShop();
  renderExamples();
  renderQuiz();
  renderCart();
})();
