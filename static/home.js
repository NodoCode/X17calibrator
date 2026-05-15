// ─── Home page rendering ─────────────────────────────────────
// Reads `detectors` (from data.js) and paints them as cards inside
// `.calib-list` on index.html. Triggered by shared.js on DOMContentLoaded
// and on pageshow (so the grid refreshes when returning from a detail page).

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
