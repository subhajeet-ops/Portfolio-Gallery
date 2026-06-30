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
      if (!dw.dataset.room) return; // doors without a room (e.g. Coming Soon) handle their own click
      const r     = dw.getBoundingClientRect();
      const hRect = hall.getBoundingClientRect();
      hallWalkTo(r.left - hRect.left + r.width / 2,
        () => setTimeout(() => enterRoom(dw.dataset.room), 200));
    });
    /* keyboard activation — role="button" needs Enter/Space wired manually */
    dw.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dw.click();
      }
    });
  });

  /* 4th door — Coming Soon popup (walks over, then opens overlay instead of a room) */
  const doorComingSoon = document.getElementById('doorComingSoon');
  const comingSoonOverlay = document.getElementById('coming-soon-overlay');
  if (doorComingSoon && comingSoonOverlay) {
    doorComingSoon.addEventListener('click', () => {
      const r     = doorComingSoon.getBoundingClientRect();
      const hRect = hall.getBoundingClientRect();
      hallWalkTo(r.left - hRect.left + r.width / 2,
        () => setTimeout(() => comingSoonOverlay.classList.add('show'), 200));
    });
    const closeBtn = document.getElementById('comingSoonClose');
    if (closeBtn) closeBtn.addEventListener('click', () => comingSoonOverlay.classList.remove('show'));
    comingSoonOverlay.addEventListener('click', e => {
      if (e.target === comingSoonOverlay) comingSoonOverlay.classList.remove('show');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') comingSoonOverlay.classList.remove('show');
    });
  }

  /* Room III — "Coming Soon" button (desktop only), opens the same overlay as Door IV directly */
  const r3ComingSoonBtn = document.getElementById('r3ComingSoonBtn');
  if (r3ComingSoonBtn && comingSoonOverlay) {
    r3ComingSoonBtn.addEventListener('click', () => comingSoonOverlay.classList.add('show'));
  }

  /* Coming Soon frames — tap to enlarge (faded, with a Coming Soon stamp) */
  const csZoomOverlay = document.getElementById('cs-zoom-overlay');
  const csZoomImg     = document.getElementById('cs-zoom-img');
  const csZoomVideo    = document.getElementById('cs-zoom-video');
  if (csZoomOverlay && csZoomImg) {
    document.querySelectorAll('.cs-frame').forEach(frame => {
      frame.addEventListener('click', e => {
        e.stopPropagation();
        const isVideo = frame.dataset.zoomType === 'video';
        if (isVideo && csZoomVideo) {
          csZoomVideo.src = frame.dataset.zoom;
          csZoomVideo.style.display = 'block';
          csZoomImg.style.display = 'none';
          csZoomVideo.play().catch(() => {});
        } else {
          const srcEl = frame.querySelector('img');
          csZoomImg.src = frame.dataset.zoom || (srcEl ? srcEl.src : '');
          csZoomImg.alt = srcEl ? (srcEl.alt || '') : '';
          csZoomImg.style.display = 'block';
          if (csZoomVideo) { csZoomVideo.style.display = 'none'; csZoomVideo.pause(); }
        }
        csZoomOverlay.classList.add('show');
      });
    });
    csZoomOverlay.addEventListener('click', () => csZoomOverlay.classList.remove('show'));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') csZoomOverlay.classList.remove('show');
    });
  }

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
      oNoteQuote.textContent = '';
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
      oNoteQuote.textContent = '';
      oNoteBody.textContent  = f.dataset.desc  || '';
      overlay.classList.add('show');
      keys.left = keys.right = false;
    });
  });

  /* Room 3 — achievement frames */
  const ACH_QUOTES = [
    `"A childhood dream, finally coming true."`,
    `"Believe in yourself — dedication always gets you there."`
  ];
  Array.from(document.querySelectorAll('.r3-ach-frame')).forEach((f, i) => {
    f.addEventListener('click', () => {
      const imgEl = f.querySelector('img');
      oCelestial.classList.remove('show');
      if (imgEl) { oImg.src = imgEl.src; oImg.style.display = 'block'; }
      else { oImg.style.display = 'none'; }
      oNoteTitle.textContent = f.dataset.title || 'Achievement';
      oNoteQuote.textContent = '';
      oNoteBody.textContent  = f.dataset.desc  || '';
      overlay.classList.add('show');
    });
  });

  /* Room 3 — Kraftovity frames (same overlay as artwork popup) */
  Array.from(document.querySelectorAll('.r3-kv-frame')).forEach((f) => {
    f.addEventListener('click', () => {
      const imgEl = f.querySelector('img');
      oCelestial.classList.remove('show');
      if (imgEl) { oImg.src = imgEl.src; oImg.style.display = 'block'; }
      else { oImg.style.display = 'none'; }
      oNoteTitle.textContent = f.dataset.title || 'Kraftovity';
      oNoteQuote.textContent = '';
      oNoteBody.textContent  = f.dataset.desc  || '';
      overlay.classList.add('show');
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

/* ─────────────────────────────────────────────
   ROOM III — THE ROYAL OPERA
───────────────────────────────────────────── */
(function () {
  const room3 = document.getElementById('room3');
  if (!room3) return;

  const camera     = document.getElementById('r3camera');
  const stage      = document.getElementById('r3stage');
  const prompt     = document.getElementById('r3prompt');
  const curtainL   = document.getElementById('r3curtainL');
  const curtainR   = document.getElementById('r3curtainR');
  const credits    = document.getElementById('r3credits');
  const creditsRoll= document.getElementById('r3creditsRoll');
  const endBtns    = document.getElementById('r3endbtns');
  const replayBtn  = document.getElementById('r3replay');
  const manualBtn  = document.getElementById('r3manualBtn');
  const manual     = document.getElementById('r3manual');
  const manualInner= document.getElementById('r3manualInner');
  const manualClose= document.getElementById('r3manualClose');
  const source     = document.getElementById('r3-credit-source');
  const rig        = document.getElementById('r3-rig');
  const dog        = document.getElementById('r3-dog');
  const charWrap   = document.getElementById('r3char');
  const skipBtn    = document.getElementById('r3skip');

  /* populate credits roll + manual panel from single source */
  creditsRoll.innerHTML = source.innerHTML;
  manualInner.innerHTML = source.innerHTML;

  /* floating dust particles inside the spotlight */
  const dust = document.getElementById('r3dust');
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.style.left = (15 + Math.random() * 70) + '%';
    s.style.bottom = (Math.random() * 30) + '%';
    s.style.animationDuration = (5 + Math.random() * 6) + 's';
    s.style.animationDelay = (Math.random() * 6) + 's';
    dust.appendChild(s);
  }

  let opened = false;
  let endingTimer = null;

  function reset() {
    opened = false;
    if (endingTimer) { clearTimeout(endingTimer); endingTimer = null; }
    curtainL.classList.remove('open');
    curtainR.classList.remove('open');
    credits.classList.remove('show', 'fadeout');
    creditsRoll.classList.remove('rolling');
    creditsRoll.style.transform = 'translateY(0)';
    endBtns.classList.remove('show');
    manual.classList.remove('show');
    prompt.classList.remove('gone');
    prompt.style.display = '';
    skipBtn.classList.remove('show');
    stage.classList.remove('dim');
  }
  reset();

  /* tap the stage → begin the performance */
  function begin() {
    if (opened) return;
    opened = true;
    prompt.classList.add('gone');
    setTimeout(() => { prompt.style.display = 'none'; }, 650);
    curtainL.classList.add('open');
    curtainR.classList.add('open');
    setTimeout(startCredits, 3200);
  }
  stage.addEventListener('click', begin);
  curtainL.addEventListener('click', begin);
  curtainR.addEventListener('click', begin);
  prompt.addEventListener('click', begin);

  function startCredits() {
    credits.classList.add('show');
    credits.classList.remove('fadeout');
    creditsRoll.classList.remove('rolling');
    creditsRoll.style.transform = 'translateY(0)';
    requestAnimationFrame(() => {
      const dist = creditsRoll.scrollHeight + credits.clientHeight + 40;
      creditsRoll.style.setProperty('--r3-roll-dist', '-' + dist + 'px');
      const duration = Math.max(34, dist / 22); /* slow, comfortable read */
      creditsRoll.style.animationDuration = duration + 's';
      void creditsRoll.offsetWidth;
      creditsRoll.classList.add('rolling');
      skipBtn.classList.add('show');
    });
  }

  creditsRoll.addEventListener('animationend', endSequence);

  /* Cinematic finale: pause → fade credits → close curtains → dim → buttons */
  function endSequence() {
    skipBtn.classList.remove('show');
    /* hold the final frame for ~2s */
    endingTimer = setTimeout(() => {
      credits.classList.add('fadeout');
      stage.classList.add('dim');
      /* close the curtains */
      curtainL.classList.remove('open');
      curtainR.classList.remove('open');
      /* once curtains finish, reveal end buttons */
      endingTimer = setTimeout(() => {
        credits.classList.remove('show', 'fadeout');
        creditsRoll.classList.remove('rolling');
        creditsRoll.style.transform = 'translateY(0)';
        endBtns.classList.add('show');
      }, 2400);
    }, 2000);
  }

  /* SKIP CREDITS */
  skipBtn.addEventListener('click', () => {
    creditsRoll.classList.remove('rolling');
    /* trigger end sequence immediately */
    endSequence();
  });

  /* REPLAY */
  replayBtn.addEventListener('click', () => {
    endBtns.classList.remove('show');
    stage.classList.remove('dim');
    credits.classList.remove('show', 'fadeout');
    creditsRoll.classList.remove('rolling');
    creditsRoll.style.transform = 'translateY(0)';
    /* reopen curtains and re-run */
    curtainL.classList.add('open');
    curtainR.classList.add('open');
    setTimeout(startCredits, 1600);
  });

  /* READ MANUALLY */
  manualBtn.addEventListener('click', () => {
    endBtns.classList.remove('show');
    manual.classList.add('show');
  });
  manualClose.addEventListener('click', () => {
    manual.classList.remove('show');
    endBtns.classList.add('show');
  });

  /* cursor proximity → man claps, dog fidgets */
  window.addEventListener('mousemove', e => {
    if (!room3.classList.contains('active')) return;
    const rr = rig.getBoundingClientRect();
    rig.classList.toggle('clapping',
      Math.hypot(e.clientX - (rr.left + rr.width / 2), e.clientY - (rr.top + rr.height / 2)) < 120);
    const dr = dog.getBoundingClientRect();
    dog.classList.toggle('fidget',
      Math.hypot(e.clientX - (dr.left + dr.width / 2), e.clientY - (dr.top + dr.height / 2)) < 120);
  });

  /* reset whenever Room III becomes active */
  const obs = new MutationObserver(() => {
    if (room3.classList.contains('active')) reset();
  });
  obs.observe(room3, { attributes: true, attributeFilter: ['class'] });

  /* Room II → Room III nav */
  const toR3 = document.getElementById('exitNavToRoom3');
  if (toR3) toR3.addEventListener('click', () => {
    document.querySelectorAll('.exit-nav').forEach(n => n.classList.remove('show'));
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    room3.classList.add('active');
  });

  /* Room III corner nav buttons → hallway / room I / room II */
  function goToScene(id) {
    document.querySelectorAll('.exit-nav').forEach(n => n.classList.remove('show'));
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }
  const navHall  = document.getElementById('r3NavHall');
  const navR1    = document.getElementById('r3NavRoom1');
  const navR2    = document.getElementById('r3NavRoom2');
  if (navHall) navHall.addEventListener('click', () => goToScene('hall'));
  if (navR1)   navR1.addEventListener('click',   () => goToScene('room1'));
  if (navR2)   navR2.addEventListener('click',   () => goToScene('room2'));
})();

/* ─────────────────────────────────────────────
   MOBILE TAB SWITCHER — Room III bottom sheet
───────────────────────────────────────────── */
(function () {
  const tabsUI = document.getElementById('r3TabsUI');
  if (!tabsUI) return;

  const tabs   = tabsUI.querySelectorAll('.r3-tab');
  const panels = tabsUI.querySelectorAll('.r3-tab-panel');
  const handle = document.getElementById('r3SheetHandle');
  const swipeHint = document.getElementById('r3SwipeHint');

  function openSheet() {
    tabsUI.classList.add('open');
    if (handle) handle.setAttribute('aria-expanded', 'true');
    if (swipeHint) swipeHint.classList.add('hide');
  }
  function closeSheet() {
    tabsUI.classList.remove('open');
    if (handle) handle.setAttribute('aria-expanded', 'false');
    if (swipeHint) swipeHint.classList.remove('hide');
  }
  function toggleSheet() {
    tabsUI.classList.contains('open') ? closeSheet() : openSheet();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('r3tab-' + target);
      if (panel) panel.classList.add('active');
      openSheet(); // picking a tab while closed should reveal it
    });
  });

  /* ── Drag the handle up/down to open/close the sheet ── */
  if (handle) {
    let dragging = false;
    let startY = 0;
    let sheetHeight = 0;
    let startTranslate = 0; // px, 0 = fully open

    function getTranslateY() {
      const style = getComputedStyle(tabsUI);
      const m = new DOMMatrixReadOnly(style.transform);
      return m.m42; // current Y translation in px
    }

    function onDragStart(clientY) {
      dragging = true;
      startY = clientY;
      sheetHeight = tabsUI.offsetHeight;
      startTranslate = getTranslateY();
      tabsUI.classList.add('dragging');
    }
    function onDragMove(clientY) {
      if (!dragging) return;
      const delta = clientY - startY;
      let next = startTranslate + delta;
      const minTranslate = 0;                       // fully open
      const maxTranslate = sheetHeight - 30;         // fully closed (handle still showing)
      next = Math.max(minTranslate, Math.min(maxTranslate, next));
      tabsUI.style.transform = `translateY(${next}px)`;
    }
    function onDragEnd(clientY) {
      if (!dragging) return;
      dragging = false;
      tabsUI.classList.remove('dragging');
      tabsUI.style.transform = ''; // hand control back to the .open class transition

      const delta = clientY - startY;
      const openThreshold = sheetHeight * 0.28; // drag past ~28% of sheet height to flip state
      const wasOpen = tabsUI.classList.contains('open');

      if (wasOpen && delta > openThreshold) {
        closeSheet();
      } else if (!wasOpen && delta < -openThreshold) {
        openSheet();
      } else {
        // snap back to whichever state it was already in
        wasOpen ? openSheet() : closeSheet();
      }
    }

    handle.addEventListener('pointerdown', e => {
      handle.setPointerCapture(e.pointerId);
      onDragStart(e.clientY);
    });
    handle.addEventListener('pointermove', e => {
      if (dragging) onDragMove(e.clientY);
    });
    handle.addEventListener('pointerup', e => onDragEnd(e.clientY));
    handle.addEventListener('pointercancel', e => onDragEnd(e.clientY));

    /* plain tap (no drag) toggles open/closed — keyboard Enter/Space too */
    let pointerDownPos = null;
    handle.addEventListener('pointerdown', e => { pointerDownPos = e.clientY; });
    handle.addEventListener('pointerup', e => {
      if (pointerDownPos !== null && Math.abs(e.clientY - pointerDownPos) < 6) {
        toggleSheet();
      }
      pointerDownPos = null;
    });
    handle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSheet(); }
    });
  }

  /* tap a frame → open the existing frame overlay */
  tabsUI.querySelectorAll('.r3-tab-frame').forEach(frame => {
    frame.addEventListener('click', () => {
      const overlay = document.getElementById('frame-overlay');
      const img     = document.getElementById('overlay-img');
      const title   = document.getElementById('note-title');
      const quote   = document.getElementById('note-quote');
      const body    = document.getElementById('note-body');
      if (!overlay || !img) return;

      const src = frame.querySelector('img');
      if (src) img.src = src.src;
      if (title) title.textContent = frame.dataset.title || '';
      if (quote) quote.textContent = '';
      if (body)  body.textContent  = frame.dataset.desc  || '';

      overlay.style.display       = 'flex';
      overlay.style.opacity       = '1';
      overlay.style.pointerEvents = 'auto';
    });
  });

  /* hide tab sheet when NOT in room3, show when entering room3 */
  function syncTabsVisibility() {
    const inRoom3 = document.getElementById('room3')?.classList.contains('active');
    if (window.innerWidth <= 600) {
      tabsUI.style.display = inRoom3 ? 'flex' : 'none';
    }
  }

  /* watch for room3 becoming active via class changes */
  const observer = new MutationObserver(syncTabsVisibility);
  const room3 = document.getElementById('room3');
  if (room3) observer.observe(room3, { attributes: true, attributeFilter: ['class'] });

  /* also run on load */
  syncTabsVisibility();

  /* re-check on resize */
  window.addEventListener('resize', syncTabsVisibility);

})();

/* ── Tab panel Room nav buttons ── */
(function () {
  function wireTabNav(btnId, targetRoomId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      // reuse existing exitToHall + enterRoom pattern
      document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(targetRoomId);
      if (target) target.classList.add('active');
      // hide tab sheet
      const tabs = document.getElementById('r3TabsUI');
      if (tabs) tabs.style.display = 'none';
    });
  }
  wireTabNav('r3TabNavRoom1', 'room1');
  wireTabNav('r3TabNavRoom2', 'room2');
})();

/* ── Overlay: mouse-drag scroll (desktop) + prevent touch-block (mobile) ── */
(function () {
  const overlay = document.getElementById('frame-overlay');
  if (!overlay) return;

  let isDragging = false, startY = 0, startScroll = 0;

  overlay.addEventListener('mousedown', e => {
    // only drag on the overlay bg itself, not the close button
    if (e.target.closest('.overlay-close')) return;
    isDragging  = true;
    startY      = e.clientY;
    startScroll = overlay.scrollTop;
    overlay.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    overlay.scrollTop = startScroll - (e.clientY - startY);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    overlay.style.cursor = 'grab';
  });

  /* reset scroll to top every time overlay opens */
  const observer = new MutationObserver(() => {
    if (overlay.style.display === 'flex' || overlay.classList.contains('show')) {
      overlay.scrollTop = 0;
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['style', 'class'] });
})();

/* ─────────────────────────────────────────────
   OVERLAY SCROLL FIX — mobile + desktop
───────────────────────────────────────────── */
(function () {
  const overlay = document.getElementById('frame-overlay');
  if (!overlay) return;

  /* ── Stop the "click background = close" from triggering during scroll ── */
  let touchStartY = 0;
  let touchMoved  = false;

  overlay.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
    touchMoved  = false;
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    if (Math.abs(e.touches[0].clientY - touchStartY) > 8) touchMoved = true;
  }, { passive: true });

  /* replace the original overlay click-to-close with a smarter one */
  overlay.addEventListener('click', e => {
    if (touchMoved) { touchMoved = false; return; } // was a scroll, not a tap
    if (e.target === overlay) {
      overlay.classList.remove('show');
    }
  });

  /* ── Mouse drag scroll for desktop ── */
  let isDragging = false, startY = 0, startScroll = 0;

  overlay.addEventListener('mousedown', e => {
    if (e.target.closest('#overlayClose')) return;
    isDragging  = true;
    startY      = e.clientY;
    startScroll = overlay.scrollTop;
    overlay.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    overlay.scrollTop = startScroll - (e.clientY - startY);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    overlay.style.cursor = '';
  });

  /* reset scroll to top on open */
  const obs = new MutationObserver(() => {
    if (overlay.classList.contains('show')) overlay.scrollTop = 0;
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });

})();

/* ─────────────────────────────────────────────
   MOBILE FRAME MODAL
   Tapping a tab frame card opens a fullscreen
   scrollable popup instead of the desktop overlay.
───────────────────────────────────────────── */
(function () {
  const modal     = document.getElementById('mobFrameModal');
  const closeBtn  = document.getElementById('mobFrameClose');
  const scrollEl  = document.getElementById('mobFrameScroll');
  const imgEl     = document.getElementById('mobFrameImg');
  const titleEl   = document.getElementById('mobFrameTitle');
  const descEl    = document.getElementById('mobFrameDesc');

  if (!modal) return;

  function openModal(frame) {
    const src = frame.querySelector('img');
    if (src)    imgEl.src         = src.src;
    titleEl.textContent = frame.dataset.title || '';
    descEl.textContent  = frame.dataset.desc  || '';
    scrollEl.scrollTop  = 0;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent body scroll while modal open
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);

  // wire all tab frame cards
  document.querySelectorAll('.r3-tab-frame').forEach(frame => {
    // remove any old listeners by cloning
    const fresh = frame.cloneNode(true);
    frame.parentNode.replaceChild(fresh, frame);
    fresh.addEventListener('click', () => openModal(fresh));
  });

})();
