// ─── PILL DEFINITIONS ──────────────────────────────────────────────────
const DOSE_OPTS     = [0.1, 0.25, 0.5, 1, 2, 2.5, 5, 7.5, 10, 12.5, 15];  // mg
const STRENGTH_OPTS = [1, 5, 10, 15, 20, 50];                               // mg (vial size)
const WATER_OPTS    = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];                      // mL

// State
const state = { dose: null, strength: null, water: null };

// ─── BUILD PILLS ───────────────────────────────────────────────────────
function buildPills(containerId, opts, key, unit) {
  const el = document.getElementById(containerId);
  el.innerHTML = opts.map(v =>
    `<button class="pill" onclick="selectPill('${key}', ${v}, this)">${v}${unit}</button>`
  ).join('');
}

buildPills('dose-pills',     DOSE_OPTS,     'dose',     'mg');
buildPills('strength-pills', STRENGTH_OPTS, 'strength', 'mg');
buildPills('water-pills',    WATER_OPTS,    'water',    'mL');

function selectPill(key, val, btn) {
  // Clear custom input
  const customMap = { dose: 'dose-custom', strength: 'strength-custom', water: 'water-custom' };
  document.getElementById(customMap[key]).value = '';
  // Deactivate siblings
  btn.closest('.pill-row').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  state[key] = val;
  calculate();
}

// ─── REVERSE CALCULATOR ────────────────────────────────────────────────
function calcReverse() {
  const units    = parseFloat(document.getElementById('rev-units').value);
  const strength = parseFloat(document.getElementById('rev-strength').value);
  const water    = parseFloat(document.getElementById('rev-water').value);
  const resEl    = document.getElementById('rev-results');
  if (isNaN(units)||isNaN(strength)||isNaN(water)||units<=0||strength<=0||water<=0) {
    resEl.style.display = 'none'; return;
  }
  const concMgMl = strength / water;
  const volMl    = units * 0.01;
  const doseMg   = volMl * concMgMl;
  const doseMcg  = doseMg * 1000;

  document.getElementById('rev-display-units').textContent  = fmt(units);
  document.getElementById('rev-res-mg').textContent         = fmt(doseMg) + ' mg';
  document.getElementById('rev-res-mcg-sub').textContent    = fmt(doseMcg) + ' mcg';
  document.getElementById('rev-res-mg-stat').textContent    = fmt(doseMg);
  document.getElementById('rev-res-mcg').textContent        = fmt(doseMcg);
  document.getElementById('rev-res-ml').textContent         = fmt(volMl);
  document.getElementById('rev-res-conc').textContent       = fmt(concMgMl);

  resEl.style.display = 'block';
  drawSyringe(units, 'rev-');
}

function selectCustom(key, rawVal) {
  const val = parseFloat(rawVal);
  // Deactivate all pills in that group
  const pillRowMap = { dose: 'dose-pills', strength: 'strength-pills', water: 'water-pills' };
  document.getElementById(pillRowMap[key]).querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  state[key] = isNaN(val) || val <= 0 ? null : val;
  calculate();
}

// ─── CORE CALCULATION ──────────────────────────────────────────────────
function calculate() {
  const { dose, strength, water } = state;
  const resEl = document.getElementById('main-results');

  if (!dose || !strength || !water) { resEl.style.display = 'none'; return; }

  const concMgMl   = strength / water;           // mg/mL
  const volMl      = dose / concMgMl;            // mL needed for one dose
  const units      = volMl * 100;                // U-100: 1 unit = 0.01 mL
  const dosesTotal = Math.floor(strength / dose);

  resEl.style.display = 'block';

  document.getElementById('res-units').textContent = fmt(units) + ' units';
  document.getElementById('res-units-sub').textContent =
    `on a U-100 insulin syringe  (= ${fmt(volMl)} mL)`;
  document.getElementById('res-dose').textContent  = fmt(dose);
  document.getElementById('res-conc').textContent  = fmt(concMgMl);
  document.getElementById('res-vol').textContent   = fmt(volMl);
  document.getElementById('res-doses').textContent = dosesTotal;
  document.getElementById('res-summary').innerHTML =
    `<strong>How to prepare:</strong> Draw ${fmt(water)} mL of BAC water into a syringe and slowly inject it into your ${strength} mg vial. ` +
    `Your solution will be ${fmt(concMgMl)} mg/mL. For a ${fmt(dose)} mg dose, draw to the <strong>${fmt(units)}-unit mark</strong> on your U-100 syringe. ` +
    `Your vial contains approximately <strong>${dosesTotal} doses</strong>.`;

  drawSyringe(units);
}

// ─── SYRINGE GRAPHIC ──────────────────────────────────────────────────
function drawSyringe(targetUnits, prefix) {
  prefix = prefix || '';
  const BARREL_X = 60, BARREL_W = 460;
  const maxUnits = 100;
  const clampedUnits = Math.min(targetUnits, maxUnits);
  const fillW = (clampedUnits / maxUnits) * BARREL_W;
  const arrowColor = prefix === 'rev-' ? '#4ecdc4' : prefix === 'blend-' ? '#f7971e' : '#6c63ff';

  document.getElementById(prefix + 'syringe-fill').setAttribute('width', Math.max(0, fillW));

  const ticksEl  = document.getElementById(prefix + 'syringe-ticks');
  const labelsEl = document.getElementById(prefix + 'syringe-labels');
  ticksEl.innerHTML = '';
  labelsEl.innerHTML = '';

  for (let u = 0; u <= 100; u += 10) {
    const x = BARREL_X + (u / 100) * BARREL_W;
    const tickH = u % 50 === 0 ? 22 : 14;
    ticksEl.innerHTML += `<line x1="${x}" y1="${72 - tickH}" x2="${x}" y2="72"/>`;
    if (u > 0 && u <= 100) {
      labelsEl.innerHTML += `<text x="${x}" y="84">${u}</text>`;
    }
  }

  const arrowX = BARREL_X + (clampedUnits / maxUnits) * BARREL_W;
  ticksEl.innerHTML += `
    <line x1="${arrowX}" y1="14" x2="${arrowX}" y2="28" stroke="${arrowColor}" stroke-width="2.5"/>
    <polygon points="${arrowX-5},14 ${arrowX+5},14 ${arrowX},22" fill="${arrowColor}"/>
  `;

  const overMax = targetUnits > maxUnits;
  document.getElementById(prefix + 'syringe-caption').textContent = overMax
    ? `⚠️ ${fmt(targetUnits)} units exceeds a standard U-100 syringe — you'll need to split into multiple injections.`
    : `Draw to the ${fmt(clampedUnits)}-unit mark (shown by the ▼ arrow above)`;
}

// ─── PEPTIDE PRESETS ──────────────────────────────────────────────────
const PRESETS = [
  // ── Primary / Most Used ──
  { name:"Retatrutide",   full:"Retatrutide (RETA) — Triple Agonist",       type:"GLP-1/GIP/Glucagon",         vial:10, water:10, dose:0.5,  doseRange:"0.5–12 mg/wk",  freq:"Once weekly",        route:"Subcutaneous",          storage:"Refrigerate; use within 28 days",  notes:"Triple agonist (GLP-1, GIP, glucagon). Potent weight-loss peptide in late-stage clinical trials. Start at 0.5 mg/week and titrate slowly every 4 weeks. Stronger effect than tirzepatide — titrate with caution." },
  { name:"GLOW Stack",    full:"BPC-157 + TB-500 + GHK-Cu Blend",           type:"Healing/Skin/Recovery Blend",vial:70, water:10, dose:1.0,  doseRange:"1–2 mg",         freq:"Daily or 2x weekly", route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Combination healing blend. BPC-157 for gut/tendon repair, TB-500 for systemic recovery, GHK-Cu for collagen synthesis and skin regeneration. Large 70 mg vial — adjust water volume to achieve your preferred concentration." },
  { name:"Wolverine Stack",full:"BPC-157 + TB-500 Blend",                   type:"Healing/Recovery Blend",     vial:20, water:4,  dose:1.0,  doseRange:"1 mg",           freq:"Daily or 2x weekly", route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Classic BPC-157 + TB-500 stack for accelerated healing and recovery. 20 mg vial with 4 mL BAC water gives 5 mg/mL — 1 mg dose = 20 units on a U-100 syringe." },
  { name:"Tirzepatide",   full:"Tirzepatide (GIP/GLP-1)",                   type:"GLP-1/GIP / Metabolic",      vial:5,  water:10, dose:2.5,  doseRange:"2.5–15 mg/wk",  freq:"Once weekly",        route:"Subcutaneous",          storage:"Refrigerate; use within 28 days",  notes:"Dual GLP-1/GIP agonist. Titrate every 4 weeks." },
  { name:"PT-141",        full:"PT-141 (Bremelanotide)",                    type:"Sexual Health",               vial:10, water:10, dose:0.5,  doseRange:"0.5–2 mg",       freq:"As needed",          route:"Subcutaneous",          storage:"Refrigerate after reconstitution", notes:"Use 45–90 min before. Start low to assess tolerance. Can cause flushing and nausea." },
  { name:"Melanotan II",  full:"Melanotan II",                               type:"Tanning/Melanocortin",        vial:10, water:10, dose:0.25, doseRange:"0.25–1 mg",      freq:"Daily (loading)",    route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Start at 0.25 mg to assess tolerance. Can cause nausea and facial flushing. Maintenance dose once tanned." },
  { name:"GHK-Cu",        full:"GHK-Cu (Copper Peptide)",                   type:"Skin/Anti-aging/Collagen",    vial:50, water:10, dose:1.0,  doseRange:"1–2 mg",         freq:"Daily or 2x weekly", route:"Subcutaneous or topical",storage:"Refrigerate; use within 4 weeks",  notes:"Copper-binding peptide that stimulates collagen synthesis, wound healing, and skin regeneration. Can also be used topically. Often combined in GLOW Stack." },
  { name:"MOTS-C",        full:"MOTS-C (Mitochondrial-derived Peptide)",    type:"Metabolic/Longevity",         vial:10, water:2,  dose:5.0,  doseRange:"5–10 mg",        freq:"1–3x weekly",        route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Mitochondria-derived peptide that improves insulin sensitivity, metabolic flexibility, and exercise capacity. Often used for longevity and metabolic health protocols." },
  // ── Others ──
  { name:"BPC-157",       full:"Body Protection Compound 157",              type:"Healing/Recovery",            vial:5,  water:2,  dose:0.25, doseRange:"0.25–0.5 mg",   freq:"1–2x daily",         route:"Subcutaneous or IM",    storage:"Refrigerate; use within 4 weeks",  notes:"Often used for gut health, tendon and ligament repair." },
  { name:"TB-500",        full:"Thymosin Beta-4",                           type:"Recovery/Anti-inflammatory",  vial:5,  water:2,  dose:2.0,  doseRange:"2–2.5 mg",       freq:"2x weekly (loading)",route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Systemic recovery peptide. Slightly larger injection volumes typical." },
  { name:"Ipamorelin",    full:"Ipamorelin",                                type:"GH Secretagogue",             vial:2,  water:2,  dose:0.2,  doseRange:"0.2–0.3 mg",    freq:"1–3x daily",         route:"Subcutaneous",          storage:"Refrigerate; use within 4 weeks",  notes:"Selective GH secretagogue with minimal side effects." },
  { name:"Sermorelin",    full:"Sermorelin",                                type:"GHRH Analogue",               vial:3,  water:3,  dose:0.2,  doseRange:"0.2–0.5 mg",    freq:"Once daily (bedtime)",route:"Subcutaneous",         storage:"Refrigerate; use within 30 days",  notes:"Best taken on an empty stomach at bedtime. Stimulates natural GH release." },
  { name:"Tesamorelin",   full:"Tesamorelin",                               type:"GHRH / Visceral Fat",         vial:2,  water:2,  dose:2.0,  doseRange:"2 mg/day",       freq:"Once daily",         route:"Subcutaneous (abdomen)",storage:"Refrigerate; use within 3 weeks",  notes:"FDA-approved for HIV-associated lipodystrophy. Reduces visceral adipose tissue." },
];

function renderPeptidePills() {
  const el = document.getElementById('peptide-pills-list');
  el.innerHTML = PRESETS.map((p, i) =>
    `<button class="peptide-pill" onclick="showPeptide(${i})" id="ppill-${i}">${p.name}</button>`
  ).join('');
}

function showPeptide(idx) {
  document.querySelectorAll('.peptide-pill').forEach((el,i) => el.classList.toggle('active', i===idx));
  const p = PRESETS[idx];
  const concMgMl = (p.vial / p.water).toFixed(2);
  const units = fmt((p.dose / p.vial * p.water) * 100);
  const el = document.getElementById('peptide-detail');
  el.style.display = 'block';
  el.innerHTML = `
    <hr class="divider"/>
    <div style="margin-bottom:14px;">
      <div style="font-size:1.1rem;font-weight:700;">${p.name} <span class="tag tag-blue" style="margin-left:6px;">${p.type}</span></div>
      <div style="font-size:0.82rem;color:var(--text2);margin-top:3px;">${p.full}</div>
    </div>
    <div class="result-stats" style="grid-template-columns:repeat(2,1fr);margin-bottom:14px;">
      <div class="stat-box"><div class="stat-label">Typical Vial Size</div><div class="stat-val" style="font-size:1rem;">${p.vial} mg</div></div>
      <div class="stat-box"><div class="stat-label">BAC Water to Add</div><div class="stat-val" style="font-size:1rem;">${p.water} mL</div></div>
      <div class="stat-box"><div class="stat-label">Concentration</div><div class="stat-val" style="font-size:1rem;">${concMgMl} mg/mL</div></div>
      <div class="stat-box"><div class="stat-label">Typical Dose</div><div class="stat-val" style="font-size:1rem;">${p.doseRange}</div></div>
      <div class="stat-box"><div class="stat-label">Frequency</div><div class="stat-val" style="font-size:0.85rem;line-height:1.2;padding-top:4px;">${p.freq}</div></div>
      <div class="stat-box"><div class="stat-label">Route</div><div class="stat-val" style="font-size:0.85rem;line-height:1.2;padding-top:4px;">${p.route}</div></div>
    </div>
    <div class="info-banner" style="margin-bottom:12px;">🗓 <strong>Storage:</strong> ${p.storage}</div>
    <div class="info-banner" style="margin-bottom:14px;">📝 ${p.notes}</div>
    <button class="btn btn-primary" onclick="loadPresetInCalc(${idx})">💉 Load into Calculator</button>
  `;
}

function loadPresetInCalc(idx) {
  const p = PRESETS[idx];
  // Switch tab
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-calc').classList.add('active');
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  // Clear all pills
  ['dose-pills','strength-pills','water-pills'].forEach(id =>
    document.getElementById(id).querySelectorAll('.pill').forEach(pl => pl.classList.remove('active'))
  );
  ['dose-custom','strength-custom','water-custom'].forEach(id => document.getElementById(id).value = '');
  // Set state
  state.dose = p.dose; state.strength = p.vial; state.water = p.water;
  // Highlight matching pills or fill custom
  setPillOrCustom('dose-pills',     'dose-custom',     DOSE_OPTS,     p.dose,    'dose');
  setPillOrCustom('strength-pills', 'strength-custom', STRENGTH_OPTS, p.vial,    'strength');
  setPillOrCustom('water-pills',    'water-custom',    WATER_OPTS,    p.water,   'water');
  calculate();
  window.scrollTo({top:0, behavior:'smooth'});
}

function setPillOrCustom(pillsId, customId, opts, val, key) {
  const match = opts.find(o => o === val);
  if (match !== undefined) {
    const pills = document.getElementById(pillsId).querySelectorAll('.pill');
    const idx   = opts.indexOf(match);
    if (pills[idx]) pills[idx].classList.add('active');
  } else {
    document.getElementById(customId).value = val;
  }
}

// ─── VIAL TRACKER ─────────────────────────────────────────────────────
let vials = [];
try {
  vials = JSON.parse(localStorage.getItem('peptide-vials-v2') || '[]').map(v => {
    // Migrate old dosesUsed → mgUsed
    if (v.mgUsed === undefined) v.mgUsed = (v.dosesUsed || 0) * v.doseMg;
    return v;
  });
} catch(e){}

function saveVials() { localStorage.setItem('peptide-vials-v2', JSON.stringify(vials)); }

function addVial() {
  const name   = document.getElementById('v-name').value.trim();
  const vialMg = parseFloat(document.getElementById('v-vial-mg').value);
  const waterMl= parseFloat(document.getElementById('v-water-ml').value);
  const doseMg = parseFloat(document.getElementById('v-dose-mg').value);
  const notes  = document.getElementById('v-notes').value.trim();
  if (!name || isNaN(vialMg)||isNaN(waterMl)||isNaN(doseMg)||vialMg<=0||waterMl<=0||doseMg<=0) {
    alert('Please fill in name, vial size, BAC water added, and dose per injection.'); return;
  }
  const concMgMl = vialMg / waterMl;
  vials.push({ id: Date.now(), name, vialMg, waterMl, doseMg, notes, concMgMl, mgUsed: 0, addedAt: new Date().toLocaleDateString() });
  saveVials(); renderVials();
  ['v-name','v-vial-mg','v-water-ml','v-dose-mg','v-notes'].forEach(id => document.getElementById(id).value='');
}

function useDose(id) {
  const v = vials.find(x=>x.id===id);
  if (!v) return;
  const mgRemaining = v.vialMg - v.mgUsed;
  if (mgRemaining < v.doseMg) { alert('Not enough left in this vial for a full dose!'); return; }
  v.mgUsed = parseFloat((v.mgUsed + v.doseMg).toFixed(6));
  saveVials(); renderVials();
}
function resetVial(id) { const v=vials.find(x=>x.id===id); if(v){v.mgUsed=0;saveVials();renderVials();} }
function removeVial(id) { if(!confirm('Remove this vial?')) return; vials=vials.filter(x=>x.id!==id); saveVials(); renderVials(); }

function updateVialDose(id, rawVal) {
  const v = vials.find(x=>x.id===id);
  if (!v) return;
  const newDose = parseFloat(rawVal);
  if (isNaN(newDose) || newDose <= 0) return;
  v.doseMg = newDose;
  saveVials();
  // Update paired units input without full re-render (avoids losing focus)
  const unitsInput = document.getElementById('units-' + id);
  if (unitsInput) unitsInput.value = fmt((newDose / v.concMgMl) * 100);
  renderVials();
}

function updateVialUnits(id, rawVal) {
  const v = vials.find(x=>x.id===id);
  if (!v) return;
  const newUnits = parseFloat(rawVal);
  if (isNaN(newUnits) || newUnits <= 0) return;
  v.doseMg = parseFloat(((newUnits * 0.01) * v.concMgMl).toFixed(6));
  saveVials();
  // Update paired dose input
  const doseInput = document.getElementById('dose-' + id);
  if (doseInput) doseInput.value = fmt(v.doseMg);
  renderVials();
}

function renderVials() {
  const el = document.getElementById('vial-list');
  if (!vials.length) {
    el.innerHTML='<div class="empty-state"><div class="big">💊</div><div>No vials tracked yet.</div></div>'; return;
  }
  el.innerHTML = vials.map(v => {
    const mgRemaining  = Math.max(0, v.vialMg - v.mgUsed);
    const currentUnits = fmt((v.doseMg / v.concMgMl) * 100);
    const dosesRem     = Math.floor(mgRemaining / v.doseMg);
    const dosesTotal   = Math.floor(v.vialMg / v.doseMg);
    const pct          = (mgRemaining / v.vialMg) * 100;
    const bar          = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--accent3)';
    return `
      <div class="vial-item">
        <div class="vial-info">
          <div class="vial-name">${v.name}</div>
          <div class="vial-detail">${v.vialMg}mg vial · ${v.waterMl}mL water · ${fmt(v.concMgMl)}mg/mL · Draw <strong style="color:var(--accent2)">${currentUnits} units</strong> per dose</div>
          ${v.notes ? `<div class="vial-detail" style="font-style:italic;">${v.notes}</div>` : ''}
          <div class="vial-detail">Added: ${v.addedAt} · ${fmt(mgRemaining)} mg remaining</div>
          <div class="vial-dose-edit">
            <label class="vial-dose-label">Dose (mg):</label>
            <input
              type="number" id="dose-${v.id}" class="vial-dose-input"
              value="${fmt(v.doseMg)}" min="0.001" step="0.01"
              onchange="updateVialDose(${v.id}, this.value)"
            />
            <label class="vial-dose-label" style="margin-left:10px;">Units:</label>
            <input
              type="number" id="units-${v.id}" class="vial-dose-input"
              value="${currentUnits}" min="0.1" step="0.5"
              onchange="updateVialUnits(${v.id}, this.value)"
            />
          </div>
        </div>
        <div class="vial-progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%;background:${bar}"></div></div>
          <div class="progress-label">${dosesRem} / ${dosesTotal} doses remaining</div>
        </div>
        <div class="vial-actions">
          <button class="btn-sm" onclick="useDose(${v.id})">✓ Use Dose</button>
          <button class="btn-sm" onclick="resetVial(${v.id})">↺ Reset</button>
          <button class="btn-sm danger" onclick="removeVial(${v.id})">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── TAB SWITCHING ─────────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

// ─── FORMAT HELPER ─────────────────────────────────────────────────────
function fmt(n) {
  if (isNaN(n) || n === null) return '—';
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toPrecision(4)).toString();
}

// ─── CALC MODE TOGGLE ──────────────────────────────────────────────────
function switchCalcMode(mode, btn) {
  document.getElementById('calc-mode-single').style.display = mode === 'single' ? '' : 'none';
  document.getElementById('calc-mode-blend').style.display  = mode === 'blend'  ? '' : 'none';
  document.querySelectorAll('.mode-btn').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
}

// ─── BLEND CALCULATOR ──────────────────────────────────────────────────
const BLENDS = [
  {
    name: 'GLOW',
    peptides: [
      { name: 'GHK-Cu',  mg: 50 },
      { name: 'BPC-157', mg: 10 },
      { name: 'TB-500',  mg: 10 },
    ],
    water: 3.0,
    dose: 2.33,
  },
  {
    name: 'Wolverine Stack',
    peptides: [
      { name: 'BPC-157', mg: 10 },
      { name: 'TB-500',  mg: 10 },
    ],
    water: 3.0,
    dose: 1.0,
  },
];

const blendState = { peptides: [], water: null, dose: null };

function buildBlendPresetPills() {
  const el = document.getElementById('blend-preset-pills');
  const pills = [...BLENDS.map((b, i) =>
    `<button class="blend-preset-pill" onclick="selectBlendPreset(${i})">${b.name}</button>`
  ), `<button class="blend-preset-pill" onclick="selectBlendPreset(-1)">✦ Custom</button>`];
  el.innerHTML = pills.join('');
}

function buildBlendWaterPills() {
  const el = document.getElementById('blend-water-pills');
  el.innerHTML = WATER_OPTS.map((v, i) =>
    `<div class="pill" onclick="blendSetWater(${v}, ${i})">${v} mL</div>`
  ).join('');
}

function selectBlendPreset(idx) {
  document.querySelectorAll('#blend-preset-pills .blend-preset-pill')
    .forEach((el, i) => el.classList.toggle('active', i === idx));

  if (idx < 0) {
    blendState.peptides = [{ name: '', mg: 0 }, { name: '', mg: 0 }];
    blendState.water = null; blendState.dose = null;
    document.getElementById('blend-water-pills').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    document.getElementById('blend-water-custom').value = '';
    document.getElementById('blend-dose-input').value = '';
    document.getElementById('blend-results').style.display = 'none';
  } else {
    const preset = BLENDS[idx];
    blendState.peptides = preset.peptides.map(p => ({ ...p }));
    blendState.water = preset.water;
    blendState.dose  = preset.dose;
    // Set water pill
    document.getElementById('blend-water-pills').querySelectorAll('.pill').forEach((el, i) => {
      el.classList.toggle('active', WATER_OPTS[i] === preset.water);
    });
    document.getElementById('blend-water-custom').value = '';
    document.getElementById('blend-dose-input').value = fmt(preset.dose);
  }
  renderBlendPeptideRows();
  updateBlendTotal();
  calcBlend();
}

function renderBlendPeptideRows() {
  const el = document.getElementById('blend-peptide-rows');
  if (!blendState.peptides.length) { el.innerHTML = ''; return; }
  el.innerHTML = blendState.peptides.map((p, i) => `
    <div class="blend-peptide-row">
      <input class="bp-name" type="text" placeholder="Peptide name" value="${p.name}"
        oninput="updateBlendPeptide(${i},'name',this.value)" />
      <input class="bp-mg" type="number" placeholder="mg" min="0" step="0.1" value="${p.mg || ''}"
        oninput="updateBlendPeptide(${i},'mg',parseFloat(this.value)||0)" />
      <span class="bp-unit">mg</span>
      <button class="bp-remove" onclick="removeBlendPeptide(${i})">✕</button>
    </div>
  `).join('');
}

function updateBlendPeptide(idx, field, val) {
  if (!blendState.peptides[idx]) return;
  blendState.peptides[idx][field] = val;
  updateBlendTotal();
  calcBlend();
}

function addBlendPeptide() {
  blendState.peptides.push({ name: '', mg: 0 });
  // Clear preset active state — now custom
  document.querySelectorAll('#blend-preset-pills .blend-preset-pill').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#blend-preset-pills .blend-preset-pill')
    [BLENDS.length].classList.add('active');
  renderBlendPeptideRows();
  updateBlendTotal();
}

function removeBlendPeptide(idx) {
  blendState.peptides.splice(idx, 1);
  renderBlendPeptideRows();
  updateBlendTotal();
  calcBlend();
}

function updateBlendTotal() {
  const total = blendState.peptides.reduce((s, p) => s + (p.mg || 0), 0);
  document.getElementById('blend-total-bar').innerHTML =
    `Total vial: <strong>${fmt(total)} mg</strong>` +
    (blendState.water ? ` &nbsp;·&nbsp; Concentration: <strong>${fmt(total / blendState.water)} mg/mL</strong>` : '');
}

function blendSetWater(val, pillIdx) {
  blendState.water = isNaN(val) || val <= 0 ? null : val;
  if (pillIdx >= 0) {
    document.getElementById('blend-water-pills').querySelectorAll('.pill')
      .forEach((el, i) => el.classList.toggle('active', i === pillIdx));
    document.getElementById('blend-water-custom').value = '';
  } else {
    document.getElementById('blend-water-pills').querySelectorAll('.pill')
      .forEach(el => el.classList.remove('active'));
  }
  updateBlendTotal();
  calcBlend();
}

function blendSetDose(val) {
  blendState.dose = isNaN(val) || val <= 0 ? null : val;
  calcBlend();
}

function calcBlend() {
  const { peptides, water, dose } = blendState;
  const resEl = document.getElementById('blend-results');
  const validPeptides = peptides.filter(p => p.mg > 0 && p.name.trim());
  if (!validPeptides.length || !water || !dose) { resEl.style.display = 'none'; return; }

  const totalMg   = validPeptides.reduce((s, p) => s + p.mg, 0);
  const totalConc = totalMg / water;
  const volMl     = dose / totalConc;
  const units     = volMl * 100;

  document.getElementById('blend-res-units').textContent    = fmt(units) + ' units';
  document.getElementById('blend-res-units-sub').textContent =
    `on a U-100 insulin syringe  (= ${fmt(volMl)} mL)`;

  // Per-peptide breakdown
  const tbody = document.getElementById('blend-breakdown-body');
  tbody.innerHTML = validPeptides.map(p => {
    const concMgMl = p.mg / water;
    const doseMg   = dose * (p.mg / totalMg);
    const doseMcg  = doseMg * 1000;
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td>${fmt(p.mg)} mg</td>
      <td>${fmt(concMgMl)} mg/mL</td>
      <td>${fmt(doseMg)} mg</td>
      <td>${fmt(doseMcg)} mcg</td>
    </tr>`;
  }).join('') + `<tr>
    <td>Total</td>
    <td>${fmt(totalMg)} mg</td>
    <td>${fmt(totalConc)} mg/mL</td>
    <td>${fmt(dose)} mg</td>
    <td>${fmt(dose * 1000)} mcg</td>
  </tr>`;

  document.getElementById('blend-summary').innerHTML =
    `<strong>How to prepare:</strong> Add ${fmt(water)} mL BAC water to your ${fmt(totalMg)} mg vial. ` +
    `For a ${fmt(dose)} mg combined dose, draw to the <strong>${fmt(units)}-unit mark</strong> on your U-100 syringe.`;

  resEl.style.display = 'block';
  drawSyringe(units, 'blend-');
}

// ─── INIT ──────────────────────────────────────────────────────────────
renderPeptidePills();
renderVials();
buildBlendPresetPills();
buildBlendWaterPills();