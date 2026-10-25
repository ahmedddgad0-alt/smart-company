/* Smart Company — navigable first-person holographic space. */
(() => {
  'use strict';
  const nav = document.getElementById('navigation');
  const topbar = document.querySelector('.topbar');
  if (!nav || !topbar || document.getElementById('sc-holo-universe')) return;
  const labels = {
    overview:['مركز القيادة','COMMAND CENTER','◈'], employees:['مصفوفة الفريق','PERSONNEL MATRIX','◎'],
    management:['سلطة الإدارة','CONTROL AUTHORITY','⬡'], departments:['شبكة الأقسام','DEPARTMENT GRID','◇'],
    projects:['مدارات المشاريع','PROJECT ORBIT','◉'], tasks:['تسلسل المهام','TASK SEQUENCE','⌁'],
    'qa-center':['ذكاء الجودة','QUALITY INTELLIGENCE','⟡'], files:['خزنة البيانات','DATA VAULT','▤'], settings:['نواة النظام','SYSTEM CORE','⚙']
  };
  const launcher = document.createElement('button');
  launcher.type='button'; launcher.className='sc-holo-launcher';
  launcher.innerHTML='<span class="sc-launcher-orb">✧</span><span>HOLO SPACE</span>';
  launcher.setAttribute('aria-label','فتح مساحة الفضاء الهولوجرامية'); topbar.appendChild(launcher);

  const universe=document.createElement('section'); universe.id='sc-holo-universe'; universe.className='sc-holo-universe';
  universe.setAttribute('aria-label','فضاء الشركة ثلاثي الأبعاد');
  universe.innerHTML=`
    <div class="sc-space-stars" aria-hidden="true"></div><div class="sc-space-grid" aria-hidden="true"></div><div class="sc-asteroid-field" aria-hidden="true"></div><div class="sc-star-streaks" aria-hidden="true"></div><div class="sc-ship-cockpit" aria-hidden="true"><span class="sc-cockpit-wing sc-cockpit-left"></span><span class="sc-cockpit-wing sc-cockpit-right"></span><span class="sc-cockpit-glass"></span><span class="sc-cockpit-label">FLIGHT DECK · SC-01</span></div>
    <div class="sc-space-header"><span>SMART COMPANY / IMMERSIVE SPACE</span><div class="sc-flight-readout">X <b id="sc-pos-x">000</b> · Y <b id="sc-pos-y">000</b> · Z <b id="sc-pos-z">000</b></div><button type="button" class="sc-space-close" aria-label="الخروج من الفضاء">×</button></div>
    <div class="sc-universe-stage">
      <div class="sc-nebula sc-nebula-a"></div><div class="sc-nebula sc-nebula-b"></div>
      <div class="sc-orbit sc-orbit-a"></div><div class="sc-orbit sc-orbit-b"></div><div class="sc-orbit sc-orbit-c"></div>
      <div class="sc-core"><span class="sc-core-symbol">SC</span><small>COMPANY CORE</small><b>مركز الفضاء</b><span class="sc-core-line"></span><small class="sc-core-hint">تحرّك لاستكشاف الوحدات</small></div><div class="sc-nodes"></div>
    </div>
    <div class="sc-flight-help"><b>تحكّم في الحركة</b><span>W A S D أو الأسهم للحركة</span><span>اسحب في الفضاء لتغيير الاتجاه</span><span>على الهاتف: استخدم عصا الحركة</span></div>
    <div class="sc-touch-pad" aria-label="عصا الحركة الافتراضية"><div class="sc-touch-stick"></div></div>
    <div class="sc-flight-actions"><button type="button" data-move="up">▲</button><button type="button" data-move="down">▼</button><button type="button" class="sc-flight-reset">إعادة التمركز</button></div>
    <div class="sc-space-footer"><span class="sc-flight-message">حرّك المؤشر لاكتشاف واجهات الشركة الهولوجرامية</span><span class="sc-space-status">HOLOGRAPHIC SPACE ONLINE</span></div><div class="sc-cursor-reticle" aria-hidden="true"><span></span></div>
    <div class="sc-jump-flash" aria-hidden="true"><div class="sc-jump-ring"></div><div class="sc-jump-ring"></div><div class="sc-jump-label">TRANSFERRING</div></div>`;
  document.body.appendChild(universe);
  const stage=universe.querySelector('.sc-universe-stage'), stars=universe.querySelector('.sc-space-stars'), grid=universe.querySelector('.sc-space-grid');
  const nodes=universe.querySelector('.sc-nodes');
  const asteroidField=universe.querySelector('.sc-asteroid-field');
  for(let i=0;i<34;i++){const a=document.createElement('i');a.className='sc-asteroid';a.style.setProperty('--ax',`${((i*47)%100)}%`);a.style.setProperty('--ay',`${((i*67)%100)}%`);a.style.setProperty('--az',`${-80-(i*173)%1100}px`);a.style.setProperty('--size',`${2+(i*7)%13}px`);a.style.setProperty('--spin',`${(i%2?1:-1)*(20+(i*19)%100)}deg`);a.style.setProperty('--delay',`${-(i%13)*.7}s`);asteroidField.appendChild(a);}
  const buttons=[...nav.querySelectorAll('button.nav-button[data-section]')];
  buttons.forEach((button,index)=>{
    const key=button.dataset.section, info=labels[key]||[button.textContent.trim(),'WORKSPACE MODULE','◇'];
    const node=document.createElement('button'); node.type='button'; node.className='sc-space-node'; node.dataset.section=key; node.style.setProperty('--node-index',index);
    const laneX=[-30,27,-12,35,-36,12,-24,31,0][index%9];
    const laneY=[-15,-19,18,12,0,24,-25,3,-4][index%9];
    node.style.setProperty('--lane-x',`${laneX}vw`); node.style.setProperty('--lane-y',`${laneY}vh`);
    node.style.setProperty('--node-depth',`${-220-index*145}px`);
    node.innerHTML=`<span class="sc-node-ring"><span>${info[2]}</span></span><span class="sc-node-name">${info[0]}</span><span class="sc-node-code">${info[1]}</span>`;
    node.addEventListener('click',()=>{
      if(button.hidden||button.disabled)return;
      universe.classList.add('is-jumping'); universe.querySelector('.sc-jump-label').textContent=info[1];
      setTimeout(()=>{button.click(); close(); universe.classList.remove('is-jumping');},420);
    }); nodes.appendChild(node);
  });
  function syncNodes(){buttons.forEach(button=>{const n=nodes.querySelector(`[data-section="${CSS.escape(button.dataset.section)}"]`);if(n){n.hidden=button.hidden;n.classList.toggle('is-current',button.classList.contains('active'));}});}
  new MutationObserver(syncNodes).observe(nav,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']}); syncNodes();
  let x=0,y=0,z=0, yaw=0,pitch=0,drag=null; const held=new Set(); let raf=0,last=0;
  let cursorX=0,cursorY=0,targetCursorX=0,targetCursorY=0,lastPointerX=null,lastPointerY=null,hasMoved=false,hideUiTimer=0,depthProgress=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function render(t){if(!universe.isConnected)return; const dt=Math.min(32,t-(last||t));last=t;
    if(universe.classList.contains('is-open')){
      let dx=0,dy=0,dz=0;
      if(held.has('ArrowLeft')||held.has('a'))dx+=1;if(held.has('ArrowRight')||held.has('d'))dx-=1;
      if(held.has('ArrowUp')||held.has('w'))dz+=1;if(held.has('ArrowDown')||held.has('s'))dz-=1;
      if(held.has(' '))dy+=1;if(held.has('Shift'))dy-=1;
      const stick=universe._stick||{x:0,y:0};dx-=stick.x;dz+=stick.y;
      const speed=dt*.19; x+=dx*speed;z+=dz*speed;y+=dy*speed;
      x=clamp(x,-1200,1200);y=clamp(y,-500,500);z=clamp(z,-1200,1200);
      cursorX += (targetCursorX-cursorX)*0.075; cursorY += (targetCursorY-cursorY)*0.075;
      const tx=clamp(pitch+z*.006+cursorY*.045,-24,24),ty=clamp(yaw+x*.006+cursorX*.055,-34,34);
      stage.style.transform=`perspective(1000px) translate3d(${x*.18+cursorX*.11}px,${-y*.18-cursorY*.10}px,${-Math.abs(z)*.08}px) rotateX(${tx}deg) rotateY(${ty}deg)`;
      stars.style.backgroundPosition=`${x*.6+cursorX*.8}px ${z*.6+cursorY*.8}px,${37-x*.35-cursorX*.35}px ${61+z*.4+cursorY*.35}px`;
      grid.style.backgroundPosition=`${x*.25}px ${z*.5}px,${x*.25}px ${z*.5}px`;
      universe.style.setProperty('--camera-x',`${x*.16}px`);universe.style.setProperty('--camera-y',`${-y*.16}px`);
      universe.querySelector('#sc-pos-x').textContent=String(Math.round(x)).padStart(3,'0');universe.querySelector('#sc-pos-y').textContent=String(Math.round(y)).padStart(3,'0');universe.querySelector('#sc-pos-z').textContent=String(Math.round(z)).padStart(3,'0');
    }
    raf=requestAnimationFrame(render);
  }
  function open(){syncNodes();depthProgress=0;hasMoved=false;lastPointerX=lastPointerY=null;nodes.querySelectorAll('.sc-space-node').forEach(n=>n.classList.remove('is-revealed','is-near'));universe.classList.remove('has-explored','ui-awake');universe.classList.add('is-open');document.body.classList.add('sc-holo-open');universe.focus({preventScroll:true}); }
  function close(){universe.classList.remove('is-open','is-jumping');document.body.classList.remove('sc-holo-open');held.clear();universe._stick={x:0,y:0};}
  launcher.addEventListener('click',open); universe.querySelector('.sc-space-close').addEventListener('click',close);
  universe.addEventListener('click',e=>{if(e.target===universe)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&universe.classList.contains('is-open'))close();if(!universe.classList.contains('is-open'))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(k)){e.preventDefault();held.add(k);}});
  document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;held.delete(k);});
  window.addEventListener('blur',()=>held.clear());
  universe.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.pointerType==='touch'&&e.target.closest('.sc-touch-pad'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};universe.setPointerCapture?.(e.pointerId);});
  const reticle=universe.querySelector('.sc-cursor-reticle');
  const help=universe.querySelector('.sc-flight-help'), footer=universe.querySelector('.sc-space-footer'), header=universe.querySelector('.sc-space-header');
  function revealNearPointer(px,py){
    const candidates=[...nodes.querySelectorAll('.sc-space-node:not([hidden])')];
    let nearest=null, nearestDistance=Infinity;
    candidates.forEach((node,index)=>{
      // Each deeper layer appears only after enough vertical exploration.
      const threshold=(index+1)*42;
      if(depthProgress>=threshold) node.classList.add('is-revealed');
      const z=-220-index*145+depthProgress*1.35; node.style.setProperty('--flight-z',`${z}px`);
      const r=node.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
      const d=Math.hypot(px-cx,py-cy);
      if(node.classList.contains('is-revealed') && d<nearestDistance){nearestDistance=d;nearest=node;}
      node.classList.toggle('is-near',node.classList.contains('is-revealed') && d<Math.max(135,Math.min(215,innerWidth*.18)));
    });
    if(nearest && nearestDistance<Math.max(150,innerWidth*.2)) nearest.classList.add('is-near');
    universe.style.setProperty('--sc-depth-progress',String(Math.min(100,Math.round(depthProgress/3.78))));
    universe.style.setProperty('--sc-flight-depth',`${depthProgress}px`);
    const message=universe.querySelector('.sc-flight-message');
    if(message) message.textContent=depthProgress<42?'حرّك الماوس لأعلى لتتقدم بالسفينة داخل الفضاء':depthProgress<250?'أنت تتوغل بين النجوم… إشارات الشركة تظهر أمامك':'اقترب من أي إشارة هولوجرامية لفتح تفاصيلها';
  }
  universe.addEventListener('pointermove',e=>{
    if(!universe.classList.contains('is-open'))return;
    if(e.pointerType!=='touch'){
      const rect=universe.getBoundingClientRect();
      if(reticle){reticle.style.left=`${e.clientX-rect.left}px`;reticle.style.top=`${e.clientY-rect.top}px`;reticle.classList.add('is-visible');}
      if(lastPointerX!==null){const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;targetCursorX=clamp(targetCursorX+dx*.22,-260,260);targetCursorY=clamp(targetCursorY+dy*.22,-190,190);depthProgress=clamp(depthProgress-dy*.9,0,420);}
      lastPointerX=e.clientX;lastPointerY=e.clientY;
      if(depthProgress>8){hasMoved=true;universe.classList.add('has-explored');}
      revealNearPointer(e.clientX,e.clientY);
      clearTimeout(hideUiTimer);universe.classList.add('ui-awake');
      hideUiTimer=setTimeout(()=>universe.classList.remove('ui-awake'),2400);
    }
    if(drag&&drag.id===e.pointerId){yaw=clamp(yaw+(e.clientX-drag.x)*.12,-30,30);pitch=clamp(pitch-(e.clientY-drag.y)*.1,-22,22);drag.x=e.clientX;drag.y=e.clientY;}
    else if(e.pointerType!=='touch'){stage.style.setProperty('--tilt-x',`${(e.clientY/innerHeight-.5)*-3}deg`);stage.style.setProperty('--tilt-y',`${(e.clientX/innerWidth-.5)*4}deg`);}
  });
  ['pointerup','pointercancel'].forEach(type=>universe.addEventListener(type,()=>{drag=null;}));
  const pad=universe.querySelector('.sc-touch-pad'),stick=universe.querySelector('.sc-touch-stick');
  pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);updateStick(e);});
  pad.addEventListener('pointermove',e=>{if(e.buttons||e.pressure)updateStick(e);});
  function updateStick(e){const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width*.32),dy=(e.clientY-cy)/(r.height*.32);dx=clamp(dx,-1,1);dy=clamp(dy,-1,1);universe._stick={x:dx,y:dy};stick.style.transform=`translate(${dx*28}px,${dy*28}px)`;depthProgress=clamp(depthProgress-dy*2.2,0,420);if(depthProgress>8){hasMoved=true;universe.classList.add('has-explored');}revealNearPointer(e.clientX,e.clientY);}
  function resetStick(){universe._stick={x:0,y:0};stick.style.transform='translate(0,0)';} ['pointerup','pointercancel','lostpointercapture'].forEach(type=>pad.addEventListener(type,resetStick));
  universe.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{y+=b.dataset.move==='up'?90:-90;y=clamp(y,-500,500);}));
  universe.querySelector('.sc-flight-reset').addEventListener('click',()=>{x=y=z=yaw=pitch=cursorX=cursorY=targetCursorX=targetCursorY=depthProgress=0;nodes.querySelectorAll('.sc-space-node').forEach(n=>n.classList.remove('is-revealed','is-near'));universe.classList.remove('has-explored');held.clear();resetStick();});
  requestAnimationFrame(render);
  // Enter the immersive space automatically when the company workspace opens.
  setTimeout(()=>{if(document.visibilityState==='visible')open();},850);
})();
