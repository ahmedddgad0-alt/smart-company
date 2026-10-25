/* Smart Company — interactive sci-fi office room. Uses Three.js when online; existing room actions remain DOM buttons. */
(() => {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
  const initialized = new WeakSet();

  async function buildRoom(room) {
    if (!room || initialized.has(room)) return;
    initialized.add(room);
    room.classList.add('scifi-room');

    const sceneHost = room.querySelector('.office-room-scene');
    if (!sceneHost || sceneHost.querySelector('.scifi-room-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'scifi-room-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    sceneHost.prepend(canvas);

    try {
      const THREE = await import(THREE_URL);
      if (!sceneHost.isConnected) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#050b19');
      scene.fog = new THREE.FogExp2('#050b19', 0.045);

      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
      camera.position.set(0, 4.5, 12.8);
      camera.lookAt(0, 1.7, 0);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      scene.add(new THREE.HemisphereLight(0x8ddcff, 0x080b22, 2.0));
      const cyanLight = new THREE.PointLight(0x00d9ff, 22, 24); cyanLight.position.set(-4, 5, 2); scene.add(cyanLight);
      const violetLight = new THREE.PointLight(0x7755ff, 20, 22); violetLight.position.set(4, 4, -2); scene.add(violetLight);

      const mat = (color, emissive = color, intensity = 1, transparent = false, opacity = 1) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, metalness: 0.45, roughness: 0.32, transparent, opacity, side: THREE.DoubleSide });
      const dark = mat(0x091326, 0x07152b, 0.7);
      const cyan = mat(0x11bde5, 0x00d9ff, 2.4);
      const blue = mat(0x174a9b, 0x176cff, 1.7);
      const violet = mat(0x4d2b91, 0x8d55ff, 2.0);
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a2341, emissive: 0x005a88, emissiveIntensity: 0.6, metalness: 0.35, roughness: 0.16, transparent: true, opacity: 0.48, transmission: 0.12 });

      // Floor and room shell
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 19), mat(0x071020, 0x071a2b, 0.45));
      floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.position.z = -1.5; scene.add(floor);
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), dark); backWall.position.set(0, 4.5, -7); scene.add(backWall);
      const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), dark); leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-10, 4.5, 0); scene.add(leftWall);
      const rightWall = leftWall.clone(); rightWall.rotation.y = -Math.PI / 2; rightWall.position.x = 10; scene.add(rightWall);

      // Neon floor grid
      const grid = new THREE.GridHelper(22, 30, 0x00d9ff, 0x123b69); grid.position.set(0, 0.025, -1.5); grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
      function line(points, material, radius = 0.025) {
        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), radius, 5, false), material);
        scene.add(mesh); return mesh;
      }
      // Architectural light strips
      line([[-9.5, 0.08, 6], [-9.5, 0.08, -6.5], [9.5, 0.08, -6.5], [9.5, 0.08, 6]], cyan, 0.035);
      line([[-9, 7.8, -6.8], [9, 7.8, -6.8]], violet, 0.035);
      for (let x of [-8, -4, 0, 4, 8]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.13, 7.2, 0.13), glass); pillar.position.set(x, 3.6, -6.8); scene.add(pillar);
        line([[x - 0.18, 0.1, -6.5], [x - 0.18, 7.2, -6.5]], x % 2 === 0 ? cyan : violet, 0.018);
      }

      // Main holographic wall display
      const display = new THREE.Group(); scene.add(display); display.position.set(0, 3.8, -6.55);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.65, 0.12), glass); display.add(screen);
      const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(7.65, 2.8, 0.18)), cyan); display.add(frame);
      // Animated data bars and mini charts
      for (let i = 0; i < 15; i++) {
        const h = 0.25 + Math.abs(Math.sin(i * 1.7)) * 1.25;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.19, h, 0.04), i % 4 === 0 ? violet : cyan);
        bar.position.set(-3.15 + i * 0.45, -0.72 + h / 2, 0.1); display.add(bar);
      }
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28 + i * 0.09, 0.018, 5, 60), i % 2 ? violet : cyan);
        ring.position.set(-2.55 + i * 1.68, 0.63, 0.12); display.add(ring);
      }
      line([[-3.4, 4.0, -6.37], [-2.8, 4.25, -6.37], [-2.15, 3.95, -6.37], [-1.4, 4.4, -6.37], [-0.6, 4.15, -6.37]], cyan, 0.022);

      // Floating hologram pedestals representing the room's live features
      const stations = [];
      function station(x, z, color, kind) {
        const group = new THREE.Group(); scene.add(group); group.position.set(x, 0.1, z); group.userData.kind = kind;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.3, 0.16, 6), dark); base.position.y = 0.12; group.add(base);
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 8, 64), color); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.23; group.add(baseRing);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.7, 1.65, 6, 1, true), new THREE.MeshBasicMaterial({ color: color.color, transparent: true, opacity: 0.12, side: THREE.DoubleSide })); beam.position.y = 1.1; group.add(beam);
        const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.43, 1), color); orb.position.y = 2.25; group.add(orb);
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.025, 6, 50), color); orbit.position.y = 2.25; orbit.rotation.x = 0.9; group.add(orbit);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.65, 0.06), glass); panel.position.set(0, 3.15, 0); group.add(panel);
        const panelEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 0.7, 0.08)), color); panelEdge.position.copy(panel.position); group.add(panelEdge);
        // Small vertical glyphs inside each holographic panel
        for (let i = 0; i < 5; i++) { const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12 + (i % 3) * 0.1, 0.025), color); glyph.position.set(-0.45 + i * 0.22, 3.13, 0.045); group.add(glyph); }
        stations.push({ group, orb, orbit, beam, phase: Math.random() * 4 });
      }
      station(-4.3, -1.0, cyan, 'locker'); station(4.3, -1.0, violet, 'chat');

      // Floating particles
      const count = 220; const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { positions[i * 3] = (Math.random() - 0.5) * 18; positions[i * 3 + 1] = Math.random() * 7.5 + 0.2; positions[i * 3 + 2] = (Math.random() - 0.5) * 13 - 1.5; }
      const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x5cecff, size: 0.035, transparent: true, opacity: 0.78 })); scene.add(particles);

      let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
      const onMove = event => { const rect = sceneHost.getBoundingClientRect(); targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.85; targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.22; };
      sceneHost.addEventListener('pointermove', onMove, { passive: true });
      sceneHost.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; }, { passive: true });
      const resize = () => { const w = Math.max(1, sceneHost.clientWidth), h = Math.max(1, sceneHost.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      const ro = new ResizeObserver(resize); ro.observe(sceneHost); resize();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const clock = new THREE.Clock();
      function animate() {
        if (!sceneHost.isConnected) { ro.disconnect(); sceneHost.removeEventListener('pointermove', onMove); renderer.dispose(); return; }
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        if (!reducedMotion) {
          currentX += (targetX - currentX) * 0.025; currentY += (targetY - currentY) * 0.025;
          camera.position.x = currentX * 2.2; camera.position.y = 4.5 - currentY * 2.0; camera.lookAt(currentX * 0.7, 1.8, 0);
          display.position.y = 3.8 + Math.sin(t * 0.65) * 0.055;
          stations.forEach((s, i) => { s.orb.position.y = 2.25 + Math.sin(t * 1.25 + s.phase) * 0.13; s.orbit.rotation.z += 0.006; s.group.rotation.y = Math.sin(t * 0.25 + i) * 0.12; s.beam.material.opacity = 0.08 + (Math.sin(t * 2 + s.phase) + 1) * 0.045; });
          particles.rotation.y = t * 0.012;
          cyanLight.position.x = -4 + Math.sin(t * 0.35) * 1.1; violetLight.position.x = 4 + Math.cos(t * 0.3) * 1.1;
        }
        renderer.render(scene, camera);
      }
      animate();
    } catch (error) {
      // Graceful fallback: CSS holographic room stays visible if WebGL/CDN is unavailable.
      canvas.classList.add('scifi-room-canvas-fallback');
      console.warn('Smart Company 3D room fallback active:', error);
    }
  }

  function scan() { document.querySelectorAll('.office-room-scene').forEach(scene => buildRoom(scene.closest('.office-interior') || scene)); }
  const observer = new MutationObserver(scan);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { scan(); observer.observe(document.body, { childList: true, subtree: true }); });
  else { scan(); observer.observe(document.body, { childList: true, subtree: true }); }
})();
