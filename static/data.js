// ─── Data layer ───────────────────────────────────────────────
// Single source of truth for the 16 detectors. Persisted to
// localStorage so user edits survive reloads. Will be replaced by
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
// Reassigned by shared.js on `pageshow` so the home grid picks up edits made on
// the detail page (when the user navigates back).
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
  if(typeof renderHomeCards==='function') renderHomeCards();
  return true;
}

// Reset to factory defaults — useful while iterating on the mockup.
// Call from the browser console: resetDetectors()
function resetDetectors(){
  detectors=structuredClone(DEFAULT_DETECTORS);
  saveDetectors();
  if(typeof renderHomeCards==='function') renderHomeCards();
}

// Fetch authoritative state from the FastAPI backend. On success, replaces
// the in-memory `detectors` and refreshes the localStorage cache. On failure
// (server down, offline), returns false and leaves `detectors` untouched so
// the cached/default value keeps working.
async function loadDetectorsFromBackend(){
  try{
    const res=await fetch('/api/calibrations');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    if(!Array.isArray(data)) throw new Error('expected an array');
    detectors=data;
    saveDetectors();
    return true;
  }catch(e){
    console.warn('Backend unreachable, using cached detectors:',e);
    return false;
  }
}
