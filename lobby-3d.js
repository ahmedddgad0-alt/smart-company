/* Smart Company — interactive 3D virtual HQ lobby. Existing app forms/actions remain unchanged. */
(() => {
  const canvas = document.getElementById('virtualLobbyCanvas');
  const host = document.getElementById('virtualLobbyScene');
  const fallback = document.getElementById('lobbyFallback');
  const hint = document.getElementById('lobbyHint');
  if (!canvas || !host) return;

  const navigate = (target) => {
    const ids = { create: 'createCompanySection', companies: 'myCompaniesSection' };
    if (target === 'join') {
      document.getElementById('joinCompanyButton')?.click();
      return;
    }
    const el = document.getElementById(ids[target]);
    if (el) {
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el.classList.remove('lobby-arrival');
      requestAnimationFrame(() => el.classList.add('lobby-arrival'));
      window.setTimeout(() => el.classList.remove('lobby-arrival'), 1500);
    }
  };
  document.querySelectorAll('[data-lobby-target]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.lobbyTarget)));

  const boot = async () => {
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
      if (!host.isConnected) return;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x030814);
      scene.fog = new THREE.FogExp2(0x030814, 0.035);
      const camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
      camera.position.set(0, 3.7, 12.8);
      camera.lookAt(0, 1.9, -1.1);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      scene.add(new THREE.HemisphereLight(0x9deaff, 0x070b20, 2.1));
      const cyanLight = new THREE.PointLight(0x00d9ff, 35, 30); cyanLight.position.set(-5, 5, 2); scene.add(cyanLight);
      const violetLight = new THREE.PointLight(0x8655ff, 30, 28); violetLight.position.set(5, 4, -2); scene.add(violetLight);
      const makeMat = (color, emissive = color, intensity = 1, opacity = 1) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, metalness: .45, roughness: .25, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
      const dark = makeMat(0x091326, 0x07162b, .75);
      const cyan = makeMat(0x00c9ee, 0x00dfff, 2.5);
      const violet = makeMat(0x7651da, 0x8b55ff, 2.3);
      const green = makeMat(0x0c9e9a, 0x28ffd2, 2.0);
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b2946, emissive: 0x005e88, emissiveIntensity: .7, metalness: .35, roughness: .16, transparent: true, opacity: .5, transmission: .12, side: THREE.DoubleSide });

      // Hall shell and luminous floor grid
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 22), makeMat(0x061020, 0x06223b, .6));
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.02, -2); scene.add(floor);
      const grid = new THREE.GridHelper(25, 42, 0x00cfff, 0x123b69); grid.position.set(0, .025, -2); grid.material.transparent = true; grid.material.opacity = .43; scene.add(grid);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(25, 10), dark); back.position.set(0, 5, -8); scene.add(back);
      for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), dark); wall.rotation.y = side * Math.PI / 2; wall.position.set(side * 12, 5, -1.5); scene.add(wall);
        for (let z = -7; z <= 5; z += 3) {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(.12, 8.5, .14), glass); pillar.position.set(side * 11.7, 4.2, z); scene.add(pillar);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(.035, 7.5, .04), side < 0 ? cyan : violet); strip.position.set(side * 11.61, 4.2, z); scene.add(strip);
        }
      }
      const line = (pts, material, radius=.025) => {
        const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 5, false), material); scene.add(mesh); return mesh;
      };
      line([[-11,.08,6],[-11,.08,-7],[11,.08,-7],[11,.08,6]], cyan, .035);
      line([[-10,8.5,-7.6],[10,8.5,-7.6]], violet, .04);
      // Floating central holographic command display
      const display = new THREE.Group(); display.position.set(0, 4.2, -7.45); scene.add(display);
      const displayGlass = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.8, .12), glass); display.add(displayGlass);
      const displayEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.35, 1.95, .15)), cyan); display.add(displayEdge);
      for (let i=0;i<18;i++) { const h=.2+Math.abs(Math.sin(i*1.3))*.8; const bar=new THREE.Mesh(new THREE.BoxGeometry(.12,h,.035),i%5===0?violet:cyan); bar.position.set(-2.65+i*.31,-.45+h/2,.09); display.add(bar); }
      for (let i=0;i<3;i++) { const ring=new THREE.Mesh(new THREE.TorusGeometry(.22+i*.07,.016,6,44),i===1?violet:cyan); ring.position.set(-2.15+i*2.1,.55,.1); display.add(ring); }

      // Portal arches are the interactive waypoints of the virtual headquarters.
      const portals = [];
      const addPortal = (x, color, label, subtitle, target) => {
        const group = new THREE.Group(); group.position.set(x, .08, -2.5); scene.add(group);
        const frame = new THREE.Mesh(new THREE.TorusGeometry(1.1,.065,8,4), color); frame.scale.set(1.12,1.45,1); frame.position.y=1.9; group.add(frame);
        const inner = new THREE.Mesh(new THREE.TorusGeometry(.9,.018,6,64), color); inner.scale.set(1.12,1.45,1); inner.position.y=1.9; group.add(inner);
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.72,2.55), new THREE.MeshBasicMaterial({color:color.color,transparent:true,opacity:.08,side:THREE.DoubleSide})); panel.position.set(0,1.9,-.015); group.add(panel);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(.95,1.12,.13,8), dark); base.position.y=.1; group.add(base);
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(.9,.025,6,48), color); baseRing.rotation.x=Math.PI/2; baseRing.position.y=.18; group.add(baseRing);
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1), color); core.position.set(0,1.9,.12); group.add(core);
        const labelTexture = (() => {
          const c=document.createElement('canvas'); c.width=512; c.height=160; const ctx=c.getContext('2d');
          ctx.clearRect(0,0,512,160); ctx.textAlign='center'; ctx.direction='rtl';
          ctx.font='bold 46px Arial'; ctx.fillStyle='#eaffff'; ctx.shadowColor=label.includes('الانضمام')?'#52ffd0':label.includes('شركاتي')?'#b99aff':'#52efff'; ctx.shadowBlur=18; ctx.fillText(label,256,65);
          ctx.shadowBlur=0; ctx.font='24px Arial'; ctx.fillStyle='#a9cde8'; ctx.fillText(subtitle,256,112);
          const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
        })();
        const labelMesh=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.78),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide})); labelMesh.position.set(0,3.42,.05); group.add(labelMesh);
        const hit = new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.8), new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); hit.position.set(0,2,0); hit.userData.target=target; group.add(hit);
        portals.push({group, core, frame, color, target, hit, phase:Math.random()*6});
      };
      addPortal(-4.4, cyan, 'إنشاء شركة', 'START A NEW COMPANY', 'create');
      addPortal(0, violet, 'شركاتي', 'MY WORKSPACES', 'companies');
      addPortal(4.4, green, 'الانضمام لشركة', 'JOIN A TEAM', 'join');

      // Ambient particles for depth.
      const count=300, positions=new Float32Array(count*3);
      for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*22;positions[i*3+1]=Math.random()*8+.2;positions[i*3+2]=(Math.random()-.5)*16-2;}
      const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(positions,3));
      const particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0x65eaff,size:.035,transparent:true,opacity:.8}));scene.add(particles);

      let targetX=0,targetY=0,currentX=0,currentY=0;
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pointer=new THREE.Vector2(); const raycaster=new THREE.Raycaster(); let hovered=null;
      const onMove=e=>{const r=canvas.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*.8;targetY=((e.clientY-r.top)/r.height-.5)*.25;pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(portals.map(p=>p.hit),false);hovered=hits.length?hits[0].object.userData.target:null;canvas.style.cursor=hovered?'pointer':'grab';if(hovered&&hint)hint.textContent='اضغط للانتقال إلى '+({create:'إنشاء شركة',companies:'شركاتي',join:'الانضمام لشركة'}[hovered]);else if(hint)hint.textContent='اضغط على إحدى البوابات الثلاثية الأبعاد';};
      const onClick=e=>{const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(portals.map(p=>p.hit),false);if(hits.length)navigate(hits[0].object.userData.target);};
      canvas.addEventListener('pointermove',onMove,{passive:true});canvas.addEventListener('click',onClick);
      const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
      const ro=new ResizeObserver(resize);ro.observe(host);resize();const clock=new THREE.Clock();let raf=0;
      const animate=()=>{if(!host.isConnected){cancelAnimationFrame(raf);ro.disconnect();canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('click',onClick);renderer.dispose();pg.dispose();return;}raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();if(!reduced){currentX+=(targetX-currentX)*.025;currentY+=(targetY-currentY)*.025;camera.position.x=currentX*1.5;camera.position.y=3.7-currentY*1.3;camera.lookAt(currentX*.5,1.8,-1.5);display.position.y=4.2+Math.sin(t*.6)*.06;portals.forEach((p,i)=>{p.core.position.y=1.9+Math.sin(t*1.15+p.phase)*.13;p.core.rotation.y+=.008;p.frame.rotation.z=Math.sin(t*.3+i)*.035;p.group.position.y=.08+Math.sin(t*.6+p.phase)*.025;});particles.rotation.y=t*.009;cyanLight.position.x=-5+Math.sin(t*.3)*1.2;violetLight.position.x=5+Math.cos(t*.27)*1.2;}renderer.render(scene,camera);};animate();
    } catch (error) {
      console.warn('Virtual HQ 3D scene unavailable; navigation shortcuts remain active.',error);
      canvas.style.display='none'; if(fallback)fallback.classList.remove('hidden'); if(hint)hint.textContent='استخدم اختصارات الصالة للتنقل';
    }
  };
  boot();
})();
