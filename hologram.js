/* SMART COMPANY // ambient holographic environment. Visual-only enhancement. */
(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const body = document.body;
  if (!body) return;
  body.classList.add('holo-ready');

  // Lightweight animated star/data field; automatically scales down on mobile.
  if (!reduceMotion) {
    const canvas = document.createElement('canvas');
    canvas.id = 'holo-stars'; canvas.setAttribute('aria-hidden', 'true');
    body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let width = 0, height = 0, points = [], raf = 0;
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(coarsePointer ? 32 : 66, Math.max(20, Math.floor(width * height / 19000)));
        points = Array.from({length: count}, () => ({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*1.4+.35,p:Math.random()*Math.PI*2}));
      };
      const draw = () => {
        ctx.clearRect(0,0,width,height);
        for (let i=0;i<points.length;i++) {
          const a=points[i]; a.x+=a.vx; a.y+=a.vy; a.p+=.012;
          if(a.x<0||a.x>width) a.vx*=-1; if(a.y<0||a.y>height) a.vy*=-1;
          const alpha=.25+.45*(.5+.5*Math.sin(a.p));
          ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,Math.PI*2); ctx.fillStyle=`rgba(104,231,255,${alpha})`; ctx.fill();
          for(let j=i+1;j<points.length;j++) { const b=points[j], dx=a.x-b.x, dy=a.y-b.y, d=Math.hypot(dx,dy); if(d<105) { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=`rgba(77,177,255,${(1-d/105)*.12})`; ctx.lineWidth=.65; ctx.stroke(); } }
        }
        raf=requestAnimationFrame(draw);
      };
      resize(); draw(); window.addEventListener('resize',resize,{passive:true});
      document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(raf); else if(!reduceMotion) draw(); });
    }
  }

  if (!reduceMotion && !coarsePointer) {
    const light=document.createElement('div'); light.className='holo-pointer-light'; light.setAttribute('aria-hidden','true'); body.appendChild(light);
    let frame=0;
    window.addEventListener('pointermove',event=>{ if(frame) cancelAnimationFrame(frame); frame=requestAnimationFrame(()=>{ light.style.left=`${event.clientX}px`; light.style.top=`${event.clientY}px`; body.classList.add('holo-pointer-active'); }); },{passive:true});
    window.addEventListener('pointerleave',()=>body.classList.remove('holo-pointer-active'));
  }

  const revealTargets=body.querySelectorAll('.hero, .auth-card, .welcome, .panel, .company-card, .module-card, .office-interior, .settings-card, .department-feature-card, .card, .container');
  revealTargets.forEach((el,index)=>{ el.classList.add('holo-reveal'); if(index%4) el.classList.add(`holo-reveal-delay-${index%4}`); });

  if (!reduceMotion && !coarsePointer) {
    body.querySelectorAll('.auth-card, .module-card, .company-card, .settings-card, .department-feature-card, .feature').forEach(el=>{
      el.addEventListener('pointermove',event=>{ const r=el.getBoundingClientRect(); if(!r.width||!r.height)return; const x=(event.clientX-r.left)/r.width-.5, y=(event.clientY-r.top)/r.height-.5; el.style.transform=`perspective(1000px) rotateY(${x*2.4}deg) rotateX(${-y*1.8}deg) translateY(-2px)`; });
      el.addEventListener('pointerleave',()=>{el.style.transform='';});
    });
  }
})();
