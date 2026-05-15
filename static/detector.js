// ─── Detail page (detector.html?id=N) ─────────────────────────
// Reads `?id=N` from the URL, finds that detector in `detectors`
// (data.js), populates the page, and writes user edits back to the
// data layer via saveDetectors() — see syncDetectorFromDOM() below.

// ─── Isotope helpers ──────────────────────────────────────────
// Monotonic counter for radio-group `name` attributes — never reused,
// even after delete, so radios from removed sources can't collide.
let srcUid=0;

const ISOTOPES=['¹³⁷Cs','⁶⁰Co','²⁰⁴Bi','²²⁸Th'];

// Text label of an iso-opt (e.g. "¹³⁷Cs"). Trims off the radio's whitespace.
function isoOptIsotope(opt){return opt?opt.textContent.trim():'';}

// Isotopes currently claimed by some source on the page.
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
// in the accordion header, refresh cross-source availability, then persist.
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

// ─── Page render ──────────────────────────────────────────────
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
    location.replace('index.html');
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
            <div class="upload-zone" data-kind="nai"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
            <div class="upload-det" style="margin-top:8px">Up (U)</div>
            <div class="upload-zone" data-kind="up"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
            <div class="upload-det" style="margin-top:6px">Down (D)</div>
            <div class="upload-zone" data-kind="down"><i class="ti ti-upload" aria-hidden="true" style="font-size:14px;margin-bottom:2px"></i><div>Drag here or import</div></div>
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

// ─── Upload wiring ────────────────────────────────────────────
// One hidden <input type="file"> shared by all upload zones. Click on a zone
// stores its reference, then triggers the picker; on `change`, the file is
// POSTed to the FastAPI backend and the zone is marked `.filled` on success.
let pendingUploadZone=null;

function ensureFilePicker(){
  let picker=document.getElementById('csv-file-picker');
  if(picker) return picker;
  picker=document.createElement('input');
  picker.type='file';
  picker.id='csv-file-picker';
  picker.accept='.csv,text/csv';
  picker.style.display='none';
  picker.addEventListener('change',handleFileSelected);
  document.body.appendChild(picker);
  return picker;
}

document.addEventListener('click',(e)=>{
  const zone=e.target.closest('.upload-zone');
  if(!zone) return;
  pendingUploadZone=zone;
  const picker=ensureFilePicker();
  picker.value='';  // allow re-selecting the same file
  picker.click();
});

async function handleFileSelected(e){
  const file=e.target.files[0];
  const zone=pendingUploadZone;
  pendingUploadZone=null;
  if(!file || !zone) return;

  const kind=zone.dataset.kind;
  const acc=zone.closest('.src-accordion');
  const accs=[...document.querySelectorAll('.src-accordion')];
  const srcIdx=accs.indexOf(acc);
  if(currentDetectorId===null || srcIdx<0 || !kind){
    alert('Could not determine upload target.');
    return;
  }

  const url=`/api/detectors/${currentDetectorId}/sources/${srcIdx}/upload/${kind}`;
  const fd=new FormData();
  fd.append('file',file);

  zone.innerHTML='<div>Uploading…</div>';
  try{
    const res=await fetch(url,{method:'POST',body:fd});
    const payload=await res.json();
    if(!res.ok) throw new Error(payload.detail || 'upload failed');
    zone.classList.add('filled');
    zone.innerHTML=`<div class="upload-name">${file.name}</div><div>${payload.rows} rows · ${payload.channel_min.toFixed(0)}–${payload.channel_max.toFixed(0)}</div>`;
    refreshSourceStatus(acc);
  }catch(err){
    console.error(err);
    zone.classList.remove('filled');
    zone.innerHTML=`<div style="color:#c44">Failed: ${err.message}</div>`;
  }
}

// ─── Persistence: keep detectors[] in sync with the DOM ───────
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
