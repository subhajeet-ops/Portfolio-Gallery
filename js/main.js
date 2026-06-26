(function () {

  /* ─────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────── */
  const WORLD_W = 2600;
  const SPEED   = 5.8;

  const FRAME_QUOTES = [
    `"Women will have to lead it from the very front"`,
    `"How's the Josh? High, Sir."`,
    `"Happiness is most genuine when it is unfiltered."`,
    `"Yeh Dil Maange More Sir, Yeh Dil Maange More"`,
    `"The Eyes, They never Lie. And They believe."`
  ];

  /* Room II illustration quotes — order: Crush, You Have You, Olympics, Mumma, Deal */
  const CELESTIAL_QUOTES = [
    `"Even under the sea, some things never change."`,
    `"Even in the darkest of times, you have you."`,
    `"You never win all by yourself."`,
    `"She was the first one to pick up my call."`,
    `"Sometimes trust begins where fear ends."`
  ];

  /* ─────────────────────────────────────────────
     HALLWAY
  ───────────────────────────────────────────── */
  const hall     = document.getElementById('hall');
  const charHall = document.getElementById('char-hall');
  const hallRig  = document.getElementById('hall-rig');
  const hallDog  = document.getElementById('hall-dog');

  let hallX       = hall.clientWidth * 0.45;
  let hallTarget  = hallX;
  let hallCb      = null;
  let hallTicking = false;

  charHall.style.left = hallX + 'px';

  function hallLoop() {
    const dx = hallTarget - hallX;
    if (Math.abs(dx) <= 3) {
      hallX = hallTarget;
      hallRig.classList.remove('walking');
      charHall.style.left = hallX + 'px';
      hallTicking = false;
      if (hallCb) { const f = hallCb; hallCb = null; f(); }
      return;
    }
    hallX += Math.sign(dx) * 5.5;
    hallRig.classList.toggle('flip', dx < 0);
    hallDog.classList.toggle('flip', dx < 0);
    charHall.style.left = hallX + 'px';
    requestAnimationFrame(hallLoop);
  }

  function hallWalkTo(x, cb) {
    hallTarget = Math.max(50, Math.min(hall.clientWidth - 50, x));
    hallCb = cb || null;
    if (!hallTicking) {
      hallTicking = true;
      hallRig.classList.add('walking');
      requestAnimationFrame(hallLoop);
    }
  }

  hall.addEventListener('click', e => {
    if (e.target.closest('.door-wrap')) return;
    hallWalkTo(e.clientX - hall.getBoundingClientRect().left);
  });

  window.addEventListener('mousemove', e => {
    const dogEl = document.querySelector('#char-hall .dog-rig');
    if (!dogEl || !hall.classList.contains('active')) return;
    const r = dogEl.getBoundingClientRect();
    dogEl.classList.toggle('fidget',
      Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 130
    );
  });

  /* locked-door tooltip + door click → walk-to → enter */
  const lockedTip = document.getElementById('locked-tip');
  document.querySelectorAll('.door-wrap').forEach(dw => {
    dw.addEventListener('mouseenter', () => {
      if (!dw.classList.contains('locked')) return;
      const r = dw.getBoundingClientRect();
      lockedTip.style.left = (r.left + r.width / 2) + 'px';
      lockedTip.style.top  = r.top + 'px';
      lockedTip.textContent = dw.dataset.tip || 'Coming soon';
      lockedTip.style.display = 'block';
    });
    dw.addEventListener('mouseleave', () => lockedTip.style.display = 'none');
    dw.addEventListener('click', () => {
      if (dw.classList.contains('locked')) return;
      const r     = dw.getBoundingClientRect();
      const hRect = hall.getBoundingClientRect();
      hallWalkTo(r.left - hRect.left + r.width / 2,
        () => setTimeout(() => enterRoom(dw.dataset.room), 200));
    });
  });

  /* ─────────────────────────────────────────────
     SCENE SWITCHING
  ───────────────────────────────────────────── */
  function enterRoom(id) {
    hall.classList.remove('active');
    document.getElementById(id).classList.add('active');
  }
  function exitToHall() {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    hall.classList.add('active');
  }
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', exitToHall));

  /* ─────────────────────────────────────────────
     SHARED KEY STATE (both rooms read the same keys)
  ───────────────────────────────────────────── */
  const keys = { left: false, right: false };

  window.addEventListener('keydown', e => {
    if (overlayOpen()) return;
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { keys.left  = true; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });
  document.querySelectorAll('.mobile-controls button').forEach(btn => {
    const dir = btn.dataset.mob;
    btn.addEventListener('pointerdown',  () => keys[dir] = true);
    btn.addEventListener('pointerup',    () => keys[dir] = false);
    btn.addEventListener('pointerleave', () => keys[dir] = false);
  });

  /* ─────────────────────────────────────────────
     GENERIC SIDE-SCROLLER  (factory — used by both rooms)
  ───────────────────────────────────────────── */
  function makeRoom(opts) {
    const room  = document.getElementById(opts.roomId);
    const world = document.getElementById(opts.worldId);
    const charR = document.getElementById(opts.charId);
    const rig   = document.getElementById(opts.rigId);
    const dog   = document.getElementById(opts.dogId);
    const hint  = document.getElementById(opts.hintId);

    let playerX = 220;
    let vpW     = window.innerWidth;

    charR.style.position  = 'absolute';
    charR.style.bottom    = opts.charBottom || '17%';
    charR.style.transform = 'translateX(-50%)';

    function getCamera() {
      return Math.max(0, Math.min(WORLD_W - vpW, playerX - vpW * 0.38));
    }
    function render() {
      vpW = window.innerWidth;
      const cam = getCamera();
      world.style.transform = `translateX(-${cam}px)`;
      charR.style.left = (playerX - cam) + 'px';
      if (hint) hint.classList.toggle('show', playerX > WORLD_W - 450);
    }

    /* arm raise on frame hover */
    let nearFrame = false;
    world.querySelectorAll('.frame').forEach(frameEl => {
      frameEl.addEventListener('mouseenter', () => { nearFrame = true;  rig.classList.add('pointing'); });
      frameEl.addEventListener('mouseleave', () => { nearFrame = false; rig.classList.remove('pointing'); });
    });

    /* dog fidget */
    window.addEventListener('mousemove', e => {
      if (!room.classList.contains('active')) return;
      const dogEl = charR.querySelector('.dog-rig');
      if (!dogEl) return;
      const r = dogEl.getBoundingClientRect();
      dogEl.classList.toggle('fidget',
        Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 130
      );
    });

    function frame() {
      if (room.classList.contains('active')) {
        const moving = keys.left || keys.right;
        if (keys.left)  {
          playerX = Math.max(60, playerX - SPEED);
          rig.classList.add('flip');    dog.classList.add('flip');
          // walked back from exit — hide nav
          const navEl = document.getElementById(opts.exitNavId);
          if (navEl) navEl.classList.remove('show');
        }
        if (keys.right) { playerX = Math.min(WORLD_W, playerX + SPEED); rig.classList.remove('flip'); dog.classList.remove('flip'); }
        rig.classList.toggle('walking', moving);
        dog.classList.toggle('walking', moving);
        if (moving && !nearFrame) rig.classList.remove('pointing');
        render();
        if (playerX >= WORLD_W - 200) {
          keys.left = keys.right = false;
          const navEl = document.getElementById(opts.exitNavId);
          if (navEl) navEl.classList.add('show');
        }
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', render);
    render();
    frame();
  }

  makeRoom({ roomId: 'room1', worldId: 'r1world', charId: 'char-room1', rigId: 'r1-rig', dogId: 'r1-dog', hintId: 'exitHint',  exitNavId: 'exitNav1' });
  makeRoom({ roomId: 'room2', worldId: 'r2world', charId: 'char-room2', rigId: 'r2-rig', dogId: 'r2-dog', hintId: 'exitHint2', exitNavId: 'exitNav2', charBottom: '11%' });

  /* ─────────────────────────────────────────────
     EXIT NAV BUTTON HANDLERS
  ───────────────────────────────────────────── */
  function hideAllExitNavs() {
    document.querySelectorAll('.exit-nav').forEach(n => n.classList.remove('show'));
  }

  // Room 1 nav
  document.getElementById('exitNavGallery1').addEventListener('click', () => {
    hideAllExitNavs();
    document.getElementById('room1').querySelector('[data-back]').click();
  });
  document.getElementById('exitNavToRoom2').addEventListener('click', () => {
    hideAllExitNavs();
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    document.getElementById('room2').classList.add('active');
  });

  // Room 2 nav
  document.getElementById('exitNavToRoom1').addEventListener('click', () => {
    hideAllExitNavs();
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    document.getElementById('room1').classList.add('active');
  });
  document.getElementById('exitNavGallery2').addEventListener('click', () => {
    hideAllExitNavs();
    document.getElementById('room2').querySelector('[data-back]').click();
  });
  // Room III button is locked — no handler needed (CSS handles the look)

  /* ─────────────────────────────────────────────
     FRAME OVERLAY
  ───────────────────────────────────────────── */
  const overlay     = document.getElementById('frame-overlay');
  const oImg        = document.getElementById('overlay-img');
  const oCelestial  = document.getElementById('overlay-celestial');
  const oNoteTitle  = document.getElementById('note-title');
  const oNoteQuote  = document.getElementById('note-quote');
  const oNoteBody   = document.getElementById('note-body');

  function overlayOpen() { return overlay.classList.contains('show'); }

  /* Room 1 — image-based frames */
  Array.from(document.querySelectorAll('#r1world .frame')).forEach((f, i) => {
    f.addEventListener('click', () => {
      const imgEl = f.querySelector('img');
      oCelestial.classList.remove('show');
      if (imgEl) { oImg.src = imgEl.src; oImg.style.display = 'block'; }
      oNoteTitle.textContent = f.dataset.title || 'Untitled';
      oNoteQuote.textContent = FRAME_QUOTES[i] || '';
      oNoteBody.textContent  = f.dataset.desc  || '';
      overlay.classList.add('show');
      keys.left = keys.right = false;
    });
  });

  /* Room 2 — image-based frames (same pattern as Room 1) */
  Array.from(document.querySelectorAll('#r2world .r2-frame')).forEach((f, i) => {
    f.addEventListener('click', () => {
      const imgEl = f.querySelector('img');
      oCelestial.classList.remove('show');
      if (imgEl) { oImg.src = imgEl.src; oImg.style.display = 'block'; }
      oNoteTitle.textContent = f.dataset.title || 'Untitled';
      oNoteQuote.textContent = CELESTIAL_QUOTES[i] || '';
      oNoteBody.textContent  = f.dataset.desc  || '';
      overlay.classList.add('show');
      keys.left = keys.right = false;
    });
  });

  function closeOverlay() { overlay.classList.remove('show'); }
  document.getElementById('overlayClose').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

})();

/* ─────────────────────────────────────────────
   ROOM II — Atmospheric celestial FX
   Shooting stars + sparkle bursts (additive)
───────────────────────────────────────────── */
(function () {
  const room2 = document.getElementById('room2');
  if (!room2) return;

  const shootLayer   = room2.querySelector('.r2-shooting-layer');
  const sparkleLayer = room2.querySelector('.r2-sparkle-layer');
  if (!shootLayer || !sparkleLayer) return;

  const rand = (a, b) => a + Math.random() * (b - a);
  const isRoom2Active = () => room2.classList.contains('active');

  /* Shooting stars — every 4-9s while room is visible */
  function spawnShootingStar() {
    if (!isRoom2Active()) return;
    const s = document.createElement('div');
    s.className = 'r2-shooting';
    const top  = rand(2, 28);            // % from top — only upper dome
    const left = rand(-5, 30);           // start near upper-left of dome
    const ang  = rand(12, 28);           // diagonal downward
    s.style.top  = top + '%';
    s.style.left = left + '%';
    s.style.setProperty('--ang', ang + 'deg');
    shootLayer.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
  function shootingLoop() {
    spawnShootingStar();
    setTimeout(shootingLoop, rand(4000, 9000));
  }
  setTimeout(shootingLoop, 2200);

  /* Sparkle bursts — pulse around bright stars */
  const sparkleSpots = [
    { top: 10, left: 12 },
    { top: 18, left: 34 },
    { top:  7, left: 55 },
    { top: 14, left: 78 },
    { top: 22, left: 90 },
    { top: 24, left:  6 },
    { top: 11, left: 38 },
    { top:  6, left: 48 },
  ];
  function spawnSparkle() {
    if (!isRoom2Active()) return;
    const spot = sparkleSpots[(Math.random() * sparkleSpots.length) | 0];
    const sp = document.createElement('div');
    sp.className = 'r2-sparkle';
    sp.style.top  = (spot.top  + rand(-1.2, 1.2)) + '%';
    sp.style.left = (spot.left + rand(-1.2, 1.2)) + '%';
    sparkleLayer.appendChild(sp);
    setTimeout(() => sp.remove(), 1500);
  }
  function sparkleLoop() {
    spawnSparkle();
    setTimeout(sparkleLoop, rand(1400, 3200));
  }
  setTimeout(sparkleLoop, 1500);
})();
