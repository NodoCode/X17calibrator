// ─── Fake charts (placeholders — replaced by Plotly.js later) ─
// Pure Canvas 2D drawing. No dependency on data.js. This whole file
// will be deleted when the Plotly wiring (Step 4 of CONTEXT.md) lands.

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
