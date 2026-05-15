// ─── Accordions ───────────────────────────────────────────────
function toggleCalib(hdr){
  const body=hdr.nextElementSibling;
  const chev=hdr.querySelector('.calib-chevron');
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  chev.classList.toggle('open',!open);
}
function toggleSrc(hdr){
  const body=hdr.nextElementSibling;
  const chev=hdr.querySelector('.calib-chevron');
  const closed=body.classList.contains('closed');
  body.classList.toggle('closed',!closed);
  chev.classList.toggle('open',closed);
}
function toggleHist(hdr){
  const body=hdr.nextElementSibling;
  const chev=hdr.querySelector('.calib-chevron');
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  chev.classList.toggle('open',!open);
}

// Monotonic counter for radio-group `name` attributes — never reused,
// even after delete, so radios from removed sources can't collide.
let srcUid=2;

// Supported isotopes, in the order they should be auto-assigned to new sources.
const ISOTOPES=['¹³⁷Cs','⁶⁰Co','²⁰⁴Bi','²²⁸Th'];

// Text label of an iso-opt (e.g. "¹³⁷Cs"). Trims off the radio's whitespace.
function isoOptIsotope(opt){return opt?opt.textContent.trim():'';}

// Isotopes currently claimed by some source.
function claimedIsotopes(){
  return [...document.querySelectorAll('.src-accordion .iso-opt.selected')]
    .map(isoOptIsotope);
}

// First isotope in ISOTOPES not yet claimed; undefined if all 4 are taken.
function firstAvailableIsotope(){
  const claimed=claimedIsotopes();
  return ISOTOPES.find(i=>!claimed.includes(i));
}

// ─── Add source ───────────────────────────────────────────────
function addSource(){
  const addBtn=document.querySelector('.add-src-btn');
  if(!addBtn) return;
  const iso=firstAvailableIsotope();
  if(!iso){
    alert('All 4 isotopes are already in use — cannot add another source.');
    return;
  }
  const idx=document.querySelectorAll('.src-accordion').length+1;
  addBtn.insertAdjacentHTML('beforebegin', srcAccordionHTML(iso, idx, true));
  refreshSources();
  syncDetectorFromDOM();
}

// ─── Cross-source isotope exclusion ───────────────────────────
// For every iso-opt, mark it `.disabled` if its isotope is selected
// by a DIFFERENT source. Keeps the local selection clickable.
function refreshIsotopeAvailability(){
  document.querySelectorAll('.src-accordion').forEach(acc=>{
    const localSel=acc.querySelector('.iso-opt.selected');
    const localIso=isoOptIsotope(localSel);
    const claimed=claimedIsotopes();
    acc.querySelectorAll('.iso-opt').forEach(opt=>{
      const iso=isoOptIsotope(opt);
      const claimedElsewhere=claimed.includes(iso) && iso!==localIso;
      opt.classList.toggle('disabled',claimedElsewhere);
      const input=opt.querySelector('input');
      if(input) input.disabled=claimedElsewhere;
    });
  });
}

// When a radio changes, update the local .selected class, the source label
// in the accordion header, then refresh cross-source availability. Delegated once.
document.addEventListener('change',(e)=>{
  const input=e.target;
  if(!(input instanceof HTMLInputElement)) return;
  if(input.type!=='radio') return;
  const label=input.closest('.iso-opt');
  if(!label) return;
  const grid=label.parentElement;
  grid.querySelectorAll('.iso-opt').forEach(o=>o.classList.remove('selected'));
  label.classList.add('selected');
  const acc=label.closest('.src-accordion');
  if(acc){
    const srcLabel=acc.querySelector('.src-label');
    if(srcLabel) srcLabel.textContent=isoOptIsotope(label);
  }
  refreshIsotopeAvailability();
  syncDetectorFromDOM();
});

// ─── Delete source (2-click confirm) ──────────────────────────
// First click arms the button (red, "Click again to confirm").
// Second click within 3 s removes the parent .src-accordion.
// Otherwise the button reverts to its initial state.
function deleteSrc(btn){
  if(btn.classList.contains('armed')){
    if(btn._disarmTimer){clearTimeout(btn._disarmTimer);btn._disarmTimer=null;}
    const acc=btn.closest('.src-accordion');
    if(acc){acc.remove();refreshSources();syncDetectorFromDOM();}
    return;
  }
  btn.classList.add('armed');
  btn.dataset.originalHtml=btn.innerHTML;
  btn.innerHTML='<i class="ti ti-alert-triangle" aria-hidden="true"></i> Click again to confirm';
  btn._disarmTimer=setTimeout(()=>{
    btn.classList.remove('armed');
    btn.innerHTML=btn.dataset.originalHtml;
    btn._disarmTimer=null;
  },3000);
}

// ─── Source bookkeeping ───────────────────────────────────────
// Renumber the position badge of each source in DOM order, then refresh
// the "N source(s)" indicator in the top-right of the right panel.
// The source name itself is the isotope and is managed by the radio handler.
function refreshSources(){
  const accs=document.querySelectorAll('.src-accordion');
  accs.forEach((acc,i)=>{
    const numEl=acc.querySelector('.src-num');
    if(numEl) numEl.textContent=i+1;
    refreshSourceStatus(acc);
  });
  updateSourceBadge(accs.length);
  refreshIsotopeAvailability();
}

// Show "No data uploaded" while any upload-zone in the source is empty,
// and hide it once all (NaI + U + D) are filled. Called per-accordion.
function refreshSourceStatus(acc){
  const status=acc.querySelector('.src-status');
  if(!status) return;
  const zones=acc.querySelectorAll('.upload-zone');
  const filled=acc.querySelectorAll('.upload-zone.filled').length;
  const complete=zones.length>0 && filled===zones.length;
  status.style.display=complete?'none':'';
}

function updateSourceBadge(n){
  const badge=document.querySelector('.result-badge');
  if(!badge) return;
  badge.innerHTML='<i class="ti ti-check" aria-hidden="true"></i> '+n+' source'+(n===1?'':'s');
}

// ─── Clock ────────────────────────────────────────────────────
function tick(){
  const n=new Date();
  document.getElementById('clk').textContent=
    String(n.getHours()).padStart(2,'0')+':'+
    String(n.getMinutes()).padStart(2,'0')+':'+
    String(n.getSeconds()).padStart(2,'0');
}

// ─── Fake charts (placeholders — replaced by Plotly.js later) ──
function drawHist(id,peaks,color){
  const c=document.getElementById(id); if(!c)return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--color-background-secondary').trim()||'#f4f4f2';
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // noise baseline
  ctx.fillStyle=color+'33';
  for(let x=0;x<W;x++){
    const noise=Math.random()*8+2;
    ctx.fillRect(x,H-noise,1,noise);
  }
  // peaks
  peaks.forEach(([cx,amp,sig])=>{
    for(let x=0;x<W;x++){
      const y=amp*Math.exp(-0.5*Math.pow((x-cx*W)/sig,2));
      ctx.fillStyle=color+'99';
      ctx.fillRect(x,H-y,1,y);
    }
  });
  // axis line
  ctx.strokeStyle=color+'44'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(0,H-1); ctx.lineTo(W,H-1); ctx.stroke();
}

function drawNaI(id,peaks,color){
  const c=document.getElementById(id); if(!c)return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--color-background-secondary').trim()||'#f4f4f2';
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  let lastNoise=0;
  for(let x=0;x<W;x++){
    lastNoise=Math.random()*5+1;
    ctx.fillStyle=color+'22'; ctx.fillRect(x,H-lastNoise,1,lastNoise);
  }
  peaks.forEach(([cx,amp,sig])=>{
    for(let x=0;x<W;x++){
      const y=amp*Math.exp(-0.5*Math.pow((x-cx*W)/sig,2));
      ctx.fillStyle=color+'66'; ctx.fillRect(x,H-y,1,y);
    }
    // gaussian overlay
    ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.5;
    for(let x=0;x<W;x++){
      const y=amp*Math.exp(-0.5*Math.pow((x-cx*W)/sig,2));
      if(x===0) ctx.moveTo(x,H-y); else ctx.lineTo(x,H-y);
    }
    ctx.stroke();
  });
  ctx.strokeStyle=color+'33'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(0,H-1); ctx.lineTo(W,H-1); ctx.stroke();
}

function drawScatter(id,cx,color){
  const c=document.getElementById(id); if(!c)return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--color-background-secondary').trim()||'#f4f4f2';
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const N=120;
  for(let i=0;i<N;i++){
    const x=Math.random()*W;
    const alpha=0.3+0.7*(1/(1+Math.exp(-(x-cx*W)/20)));
    const y=H*(1-alpha)+Math.random()*18-9;
    ctx.fillStyle=color+'bb';
    ctx.beginPath(); ctx.arc(x,Math.max(4,Math.min(H-4,y)),2,0,Math.PI*2); ctx.fill();
  }
  // erfc fit
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.5;
  for(let x=0;x<W;x++){
    const val=0.3+0.65*(1/(1+Math.exp(-(x-cx*W)/18)));
    const y=H*(1-val);
    if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.strokeStyle=color+'33'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(0,H-1); ctx.lineTo(W,H-1); ctx.stroke();
}

function drawRegression(id){
  const c=document.getElementById(id); if(!c)return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--color-background-secondary').trim()||'#f4f4f2';
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const pad=30;
  // axes
  ctx.strokeStyle='#88878080'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,H-pad); ctx.lineTo(W-pad,H-pad); ctx.stroke();
  // confidence band
  ctx.fillStyle='#1D9E7522';
  ctx.beginPath();
  ctx.moveTo(pad,H-pad);
  for(let x=0;x<=W-2*pad;x++){
    const xn=x/(W-2*pad);
    const y=xn;
    const band=0.03*(1+Math.pow(xn-0.5,2)*4);
    ctx.lineTo(pad+x,(H-pad)-(y+band)*(H-2*pad));
  }
  for(let x=W-2*pad;x>=0;x--){
    const xn=x/(W-2*pad);
    const y=xn;
    const band=0.03*(1+Math.pow(xn-0.5,2)*4);
    ctx.lineTo(pad+x,(H-pad)-(y-band)*(H-2*pad));
  }
  ctx.closePath(); ctx.fill();
  // fit line
  ctx.beginPath(); ctx.strokeStyle='#1D9E75'; ctx.lineWidth=2;
  ctx.moveTo(pad,H-pad);
  ctx.lineTo(W-pad,pad);
  ctx.stroke();
  // points
  const pts=[[0.18,0.16],[0.32,0.30],[0.65,0.63],[0.82,0.80]];
  pts.forEach(([x,y],i)=>{
    const px=pad+x*(W-2*pad), py=(H-pad)-y*(H-2*pad);
    ctx.fillStyle=i<2?'#185FA5':'#854F0B';
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.stroke();
  });
  // legend
  ctx.font='11px monospace';
  ctx.fillStyle='#185FA5'; ctx.fillRect(W-95,14,10,10);
  ctx.fillStyle='#88878099'; ctx.fillText('¹³⁷Cs',W-80,23);
  ctx.fillStyle='#854F0B'; ctx.fillRect(W-95,30,10,10);
  ctx.fillStyle='#88878099'; ctx.fillText('²²⁸Th',W-80,39);
}

// ─── Home page: detector calibrations (data-driven) ──────────
// Single source of truth for the 16 cards on main.html. Persisted to
// localStorage so user edits survive reloads. Will be replaced by a
// fetch('/api/calibrations') once the Flask backend is wired up.

// Bumped after shape change: sources became an array of objects, fit became
// a nested object, detailHref dropped (always detector.html?id=N now).
const STORAGE_KEY='x17-detectors-v2';

const DEFAULT_DETECTORS=[
  {id:0,  status:'ok',  fit:{a:4.42,sigA:0.36,b:4,sigB:3,r2:0.9987,rms:1.8,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²²⁸Th'}]},
  {id:1,  status:'ok',  fit:{a:4.38,sigA:0.29,b:5,sigB:2,r2:0.9985,rms:1.9,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'⁶⁰Co'}]},
  {id:2,  status:'ok',  fit:{a:4.51,sigA:0.41,b:3,sigB:3,r2:0.9978,rms:2.0,points:4}, sources:[{isotope:'²²⁸Th'},{isotope:'⁶⁰Co'}]},
  {id:3,  status:'ok',  fit:{a:4.19,sigA:0.45,b:7,sigB:4,r2:0.9971,rms:2.3,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²⁰⁴Bi'}]},
  {id:4,  status:'ok',  fit:{a:4.11,sigA:0.42,b:6,sigB:4,r2:0.9971,rms:2.3,points:4}, sources:[{isotope:'⁶⁰Co'},{isotope:'¹³⁷Cs'}]},
  {id:5,  status:'ok',  fit:{a:4.27,sigA:0.33,b:5,sigB:3,r2:0.9983,rms:1.9,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²²⁸Th'}]},
  {id:6,  status:'ok',  fit:{a:4.48,sigA:0.31,b:4,sigB:2,r2:0.9988,rms:1.7,points:4}, sources:[{isotope:'⁶⁰Co'},{isotope:'²²⁸Th'}]},
  {id:7,  status:'ok',  fit:{a:4.05,sigA:0.50,b:8,sigB:5,r2:0.9962,rms:2.5,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²⁰⁴Bi'}]},
  {id:8,  status:'ok',  fit:{a:4.33,sigA:0.28,b:3,sigB:2,r2:0.9990,rms:1.6,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'⁶⁰Co'}]},
  {id:9,  status:'ok',  fit:{a:4.21,sigA:0.39,b:6,sigB:3,r2:0.9980,rms:2.0,points:4}, sources:[{isotope:'²²⁸Th'},{isotope:'²⁰⁴Bi'}]},
  {id:10, status:'old', fit:{a:4.46,sigA:0.35,b:4,sigB:3,r2:0.9982,rms:1.9,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²²⁸Th'}]},
  {id:11, status:'old', fit:{a:4.16,sigA:0.44,b:7,sigB:4,r2:0.9969,rms:2.4,points:4}, sources:[{isotope:'⁶⁰Co'},{isotope:'¹³⁷Cs'}]},
  {id:12, status:'old', fit:{a:4.29,sigA:0.37,b:5,sigB:3,r2:0.9979,rms:2.1,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²²⁸Th'}]},
  {id:13, status:'old', fit:{a:4.40,sigA:0.32,b:4,sigB:2,r2:0.9987,rms:1.7,points:4}, sources:[{isotope:'⁶⁰Co'},{isotope:'²⁰⁴Bi'}]},
  {id:14, status:'old', fit:{a:4.08,sigA:0.48,b:8,sigB:5,r2:0.9964,rms:2.5,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'²²⁸Th'}]},
  {id:15, status:'old', fit:{a:4.24,sigA:0.40,b:6,sigB:3,r2:0.9976,rms:2.2,points:4}, sources:[{isotope:'¹³⁷Cs'},{isotope:'⁶⁰Co'},{isotope:'²²⁸Th'}]},
];

// Mutable state. Initialized from localStorage if present, otherwise from defaults.
let detectors=loadDetectors();

function loadDetectors(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){
    console.warn('Could not read detectors from localStorage:',e);
  }
  return structuredClone(DEFAULT_DETECTORS);
}

function saveDetectors(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(detectors));
  }catch(e){
    console.warn('Could not save detectors to localStorage:',e);
  }
}

// Public mutation API — call from anywhere (calibration page, console, future
// backend wiring). After mutating, persists and re-renders the home grid
// if it's currently visible.
function setDetector(id,patch){
  const d=detectors.find(d=>d.id===id);
  if(!d) return false;
  Object.assign(d,patch);
  saveDetectors();
  renderHomeCards();
  return true;
}

// Reset to factory defaults — useful while iterating on the mockup.
// Call from the browser console: resetDetectors()
function resetDetectors(){
  detectors=structuredClone(DEFAULT_DETECTORS);
  saveDetectors();
  renderHomeCards();
}

function renderCard(d){
  const num=String(d.id).padStart(2,'0');
  const dotStyle=d.status==='old'?' style="background:#888780"':'';
  const isotopes=d.sources.map(s=>s.isotope).join(' · ');
  const eq=d.fit
    ? `E(ADC) = (${d.fit.a}±${d.fit.sigA})·ADC + (${d.fit.b}±${d.fit.sigB})`
    : 'Uncalibrated';
  return `
    <div class="calib-card">
      <div class="calib-header" onclick="toggleCalib(this)">
        <div class="calib-dot"${dotStyle}></div>
        <span class="calib-name">Scintillator ${num}</span>
        <span class="calib-eq">${eq}</span>
        <i class="ti ti-chevron-down calib-chevron" aria-hidden="true"></i>
      </div>
      <div class="calib-body">
        <div class="calib-body-inner">
          <a class="see-btn" href="detector.html?id=${d.id}"><i class="ti ti-chart-histogram" aria-hidden="true"></i> See histograms</a>
          <span class="calib-meta">${isotopes}</span>
        </div>
      </div>
    </div>`;
}

function renderHomeCards(){
  const list=document.querySelector('.calib-list');
  if(!list) return;  // not on home page → no-op
  list.innerHTML=detectors.map(renderCard).join('');
}

// ─── Detail page (detector.html?id=N) ─────────────────────────
// Reads `?id=N` from the URL, finds that detector, and populates the
// page from `detectors[id]`. All edits (add/delete/change isotope)
// mutate that detector and persist via saveDetectors().

// Set on detail-page entry. Read by syncDetectorFromDOM() so that
// add/delete/change handlers know which detector to update.
let currentDetectorId=null;

const SOURCE_COLORS=['#185FA5','#854F0B','#4A7B3C','#7C3C5E'];

function renderDetail(){
  const layout=document.querySelector('.new-layout');
  if(!layout) return;  // not on detail page
  const params=new URLSearchParams(location.search);
  const id=parseInt(params.get('id'),10);
  const detector=detectors.find(d=>d.id===id);
  if(!detector){
    // Unknown id → bounce back to home
    location.replace('main.html');
    return;
  }
  currentDetectorId=id;
  renderResultCard(detector);
  renderSourceList(detector);
  renderHistogramRows(detector);
  refreshSources();
  drawDetailCharts(detector);
}

function renderResultCard(d){
  const num=String(d.id).padStart(2,'0');
  const setText=(sel,txt)=>{const el=document.querySelector(sel); if(el) el.textContent=txt;};
  setText('.result-label','Calibration — Scintillator '+num);
  if(d.fit){
    setText('.result-eq',`E(ADC) = (${d.fit.a} ± ${d.fit.sigA})·ADC + (${d.fit.b} ± ${d.fit.sigB})`);
    const vals=document.querySelectorAll('.metric-val');
    if(vals[0]) vals[0].textContent=d.fit.r2;
    if(vals[1]) vals[1].textContent=d.fit.rms+' keV';
    if(vals[2]) vals[2].textContent=d.fit.points;
  }
  updateSourceBadge(d.sources.length);
}

function renderSourceList(d){
  const addBtn=document.querySelector('.add-src-btn');
  if(!addBtn) return;
  // Drop any existing source accordions, then re-insert from data.
  document.querySelectorAll('.src-accordion').forEach(el=>el.remove());
  d.sources.forEach((src,i)=>{
    addBtn.insertAdjacentHTML('beforebegin', srcAccordionHTML(src.isotope, i+1, i===0));
  });
}

// Build a source accordion HTML block. `open` controls the body state
// (only the first source is open by default to keep the panel compact).
function srcAccordionHTML(iso, idx, open){
  srcUid++;
  const radioName='iso'+srcUid;
  const isoOpts=ISOTOPES.map(i=>{
    const sel=i===iso?' selected':'';
    const chk=i===iso?' checked':'';
    return `<label class="iso-opt${sel}"><input type="radio" name="${radioName}"${chk} /> ${i}</label>`;
  }).join('\n              ');
  const bodyCls=open?'src-body':'src-body closed';
  const chevCls=open?'calib-chevron open':'calib-chevron';
  return `
      <div class="src-accordion">
        <div class="src-header" onclick="toggleSrc(this)">
          <div class="src-num">${idx}</div>
          <span class="src-label">${iso}</span>
          <span class="src-status">No data uploaded</span>
          <i class="ti ti-chevron-down ${chevCls}" aria-hidden="true"></i>
        </div>
        <div class="${bodyCls}">
          <div class="field-row">
            <div class="field-label">Isotope</div>
            <div class="iso-grid">
              ${isoOpts}
            </div>
          </div>
          <div class="field-row">
            <div class="field-label">Upload CSV</div>
            <div class="upload-det">NaI</div>
            <div class="upload-zone"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
            <div class="upload-det" style="margin-top:8px">Up (U)</div>
            <div class="upload-zone"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
            <div class="upload-det" style="margin-top:6px">Down (D)</div>
            <div class="upload-zone"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
          </div>
          <button class="delete-src-btn" onclick="deleteSrc(this)">
            <i class="ti ti-trash" aria-hidden="true"></i>
            Delete source
          </button>
        </div>
      </div>`;
}

// Regenerate the per-source chart rows inside each histogram section,
// using canvas IDs that match the drawDetailCharts() loop.
function renderHistogramRows(d){
  const sections=[
    {bodySel:'.hist-item:nth-child(1) .hist-body', prefix:'c-raw'},
    {bodySel:'.hist-item:nth-child(2) .hist-body', prefix:'c-nai'},
    {bodySel:'.hist-item:nth-child(3) .hist-body', prefix:'c-ud'},
  ];
  sections.forEach(({bodySel,prefix})=>{
    const body=document.querySelector(bodySel);
    if(!body) return;
    body.innerHTML=d.sources.map((s,i)=>`
          <div class="chart-src-row">
            <span class="chart-src-label">${s.isotope}</span>
            <canvas id="${prefix}-${i+1}" width="420" height="100"></canvas>
          </div>`).join('');
  });
}

function drawDetailCharts(d){
  setTimeout(()=>{
    d.sources.forEach((s,i)=>{
      const color=SOURCE_COLORS[i%SOURCE_COLORS.length];
      drawHist(`c-raw-${i+1}`,[[0.35+i*0.05,65+i*5,18],[0.55+i*0.04,40+i*3,16]],color);
      drawNaI(`c-nai-${i+1}`,[[0.35+i*0.06,70-i*5,18]],color);
      drawScatter(`c-ud-${i+1}`,0.35+i*0.08,color);
    });
    drawRegression('c-reg');
  },50);
}

// ─── Persistence: keep detectors[] in sync with the DOM ──────
// Called after any mutation on the detail page (add / delete / iso change).
// Reads the current state of the source list, writes it to detectors[id], persists.
function syncDetectorFromDOM(){
  if(currentDetectorId===null) return;
  const d=detectors.find(x=>x.id===currentDetectorId);
  if(!d) return;
  d.sources=[...document.querySelectorAll('.src-accordion')].map(acc=>{
    const sel=acc.querySelector('.iso-opt.selected');
    return {isotope:isoOptIsotope(sel)};
  });
  saveDetectors();
  // Result-card badge tracks source count.
  updateSourceBadge(d.sources.length);
}

// ─── Init ─────────────────────────────────────────────────────
// Single entry point. Branches based on which page we're on:
// - main.html (`.calib-list` present) → renderHomeCards()
// - detector.html (`.new-layout` present + ?id=) → renderDetail()
document.addEventListener('DOMContentLoaded',()=>{
  tick(); setInterval(tick,1000);
  renderHomeCards();
  renderDetail();
});

// Refresh the home grid when the user navigates back from a detail page
// (browser back / logo click). Picks up source edits made there.
window.addEventListener('pageshow',()=>{
  detectors=loadDetectors();
  renderHomeCards();
});
