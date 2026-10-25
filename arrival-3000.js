
/* Immersive YEAR 3000 entrance for Smart Company. Presentation-only; does not touch auth or business logic. */
(() => {
  if (document.getElementById('scifiArrival')) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('section');
  overlay.className = 'scifi-arrival';
  overlay.id = 'scifiArrival';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'الدخول إلى مقر Smart Company المستقبلي');
  overlay.innerHTML = `
    <div class="scifi-arrival-stars" aria-hidden="true"></div>
    <div class="scifi-arrival-core">
      <div class="scifi-arrival-brand">SMART COMPANY // FUTURE SYSTEMS</div>
      <div class="scifi-arrival-portal" aria-hidden="true">
        <i class="ring"></i><i class="ring"></i><i class="ring"></i><div class="portal-core"></div>
      </div>
      <h2>أهلاً بك في <span>عام 3000</span></h2>
      <p>جارٍ تهيئة المقر الذكي… مزامنة الأنظمة، بناء البيئة ثلاثية الأبعاد، وتجهيز مساحة شركتك.</p>
      <div class="scifi-arrival-status"><i></i><span>NEURAL INTERFACE ONLINE</span><span>•</span><span>HOLOGRAM SYSTEM READY</span></div>
      <div class="scifi-arrival-progress"><span></span></div>
    </div>
    <button class="scifi-arrival-skip" type="button">تخطّي المقدمة ←</button>`;
  document.body.classList.add('scifi-arrival-active');
  document.body.prepend(overlay);

  const stars = overlay.querySelector('.scifi-arrival-stars');
  if (!reduced) {
    for (let i = 0; i < 62; i++) {
      const star = document.createElement('i');
      star.className = 'scifi-arrival-star';
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 100) + '%';
      star.style.setProperty('--dur', (4 + Math.random() * 8) + 's');
      star.style.setProperty('--drift', ((Math.random() * 100) - 50) + 'px');
      star.style.animationDelay = (-Math.random() * 10) + 's';
      stars.appendChild(star);
    }
  }

  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    overlay.classList.add('is-leaving');
    document.body.classList.remove('scifi-arrival-active');
    document.body.classList.add('scifi-arrival-done');
    window.setTimeout(() => overlay.remove(), 1000);
  };
  overlay.querySelector('.scifi-arrival-skip').addEventListener('click', finish);
  window.setTimeout(finish, reduced ? 300 : 4200);
})();
