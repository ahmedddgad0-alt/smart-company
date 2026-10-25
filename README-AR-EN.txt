SMART COMPANY — YEAR 3000 (NO INTRO SCREEN)
===========================================

This revision removes the full-screen “أهلاً بك في عام 3000” arrival overlay.
The futuristic visual treatment is applied to the real company workspace: sidebar,
navigation, top bar, cards, form controls, and office-room scene.

Included: hologram.css / hologram.js, office-3d.css / office-3d.js, existing
company.html and company.js, plus the original app/dashboard files and manifest.json.

IMPORTANT:
- Keep the real firebase-config.js and any existing language.js from your project;
  neither was included in the supplied ZIP.
- Merge this into a BACKUP of the original project. Do not remove other original assets.
- 3D office scene imports Three.js from a CDN and therefore needs internet access.
- I checked the JavaScript syntax, but full browser/Firebase testing is still required
  before deploying.
- Cache-busting query strings were added to the visual assets in company.html.


NAVIGATION UPDATE — HOLOGRAPHIC 3D
----------------------------------
The latest version adds nav-hologram-3d.css and nav-hologram-3d.js to company.html.
Section clicks trigger a short holographic portal/ring transition and the actual content
materializes with a 3D perspective animation. Existing section handlers and Firestore
logic remain untouched. The intro/welcome screen is not added.
