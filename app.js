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
  srcUid++;
  const idx=document.querySelectorAll('.src-accordion').length+1;
  const radioName='iso'+srcUid;
  // Build the radio grid with `iso` pre-selected; other isotopes claimed
  // elsewhere will be greyed out by refreshIsotopeAvailability() below.
  const isoOpts=ISOTOPES.map(i=>{
    const sel=i===iso?' selected':'';
    const chk=i===iso?' checked':'';
    return `<label class="iso-opt${sel}"><input type="radio" name="${radioName}"${chk} /> ${i}</label>`;
  }).join('\n              ');
  const html=`
      <div class="src-accordion">
        <div class="src-header" onclick="toggleSrc(this)">
          <div class="src-num">${idx}</div>
          <span class="src-label">Source ${idx}</span>
          <span class="src-iso-badge">${iso}</span>
          <i class="ti ti-chevron-down calib-chevron open" aria-hidden="true"></i>
        </div>
        <div class="src-body">
          <div class="field-row">
            <div class="field-label">Name</div>
            <input type="text" class="field-input" value="Source ${idx}" />
          </div>
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
  addBtn.insertAdjacentHTML('beforebegin', html);
  refreshSources();
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

// When a radio changes, update the local .selected class, the badge in the
// accordion header, then refresh cross-source availability. Delegated once.
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
    const badge=acc.querySelector('.src-iso-badge');
    if(badge) badge.textContent=isoOptIsotope(label);
  }
  refreshIsotopeAvailability();
});

// ─── Delete source (2-click confirm) ──────────────────────────
// First click arms the button (red, "Click again to confirm").
// Second click within 3 s removes the parent .src-accordion.
// Otherwise the button reverts to its initial state.
function deleteSrc(btn){
  if(btn.classList.contains('armed')){
    if(btn._disarmTimer){clearTimeout(btn._disarmTimer);btn._disarmTimer=null;}
    const acc=btn.closest('.src-accordion');
    if(acc){acc.remove();refreshSources();}
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
// Renumber visible source labels in DOM order, then refresh the
// "N source(s)" badge in the top-right of the right panel.
function refreshSources(){
  const accs=document.querySelectorAll('.src-accordion');
  accs.forEach((acc,i)=>{
    const num=i+1;
    const numEl=acc.querySelector('.src-num');
    const labelEl=acc.querySelector('.src-label');
    if(numEl) numEl.textContent=num;
    if(labelEl) labelEl.textContent='Source '+num;
    // Only rename the input if it's still a default-looking "Source N";
    // never clobber a value the user has edited.
    const nameInput=acc.querySelector('input.field-input');
    if(nameInput && /^Source \d+$/.test(nameInput.value)){
      nameInput.value='Source '+num;
    }
  });
  updateSourceBadge(accs.length);
  refreshIsotopeAvailability();
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

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  tick(); setInterval(tick,1000);
  refreshSources();

  setTimeout(()=>{
    drawHist('c-raw-1',[[0.35,70,18],[0.36,70,18]],'#185FA5');
    drawHist('c-raw-2',[[0.4,55,22],[0.72,45,16]],'#854F0B');
    drawNaI('c-nai-1',[[0.35,72,18]],'#185FA5');
    drawNaI('c-nai-2',[[0.41,58,20],[0.72,44,15]],'#854F0B');
    drawScatter('c-ud-1',0.35,'#185FA5');
    drawScatter('c-ud-2',0.56,'#854F0B');
    drawRegression('c-reg');
  },200);
});
