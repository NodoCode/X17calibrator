// ─── Shared UI helpers used by both home and detail pages ─────

// ─── Accordions ───────────────────────────────────────────────
// Inline `onclick` handlers in HTML reach these via the global scope.
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

// ─── Clock (nav bar) ──────────────────────────────────────────
function tick(){
  const n=new Date();
  document.getElementById('clk').textContent=
    String(n.getHours()).padStart(2,'0')+':'+
    String(n.getMinutes()).padStart(2,'0')+':'+
    String(n.getSeconds()).padStart(2,'0');
}

// ─── Init ─────────────────────────────────────────────────────
// One handler for both pages. Renders immediately from the localStorage
// cache for snappy first paint, then refreshes from the FastAPI backend in
// the background and re-renders if the server returned new data.
function renderActivePage(){
  if(typeof renderHomeCards==='function') renderHomeCards();
  if(typeof renderDetail==='function') renderDetail();
}

document.addEventListener('DOMContentLoaded',async()=>{
  tick(); setInterval(tick,1000);
  renderActivePage();
  const refreshed=await loadDetectorsFromBackend();
  if(refreshed) renderActivePage();
});

// When navigating back from the detail page (browser back / logo click),
// reload detectors from storage so the home grid reflects edits made there.
window.addEventListener('pageshow',()=>{
  detectors=loadDetectors();
  if(typeof renderHomeCards==='function') renderHomeCards();
});
