// ============================================
// Footer year
// ============================================
document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ============================================
// Nav height → --nav-h custom property
// Keeps --nav-h (style.css's fallback is 84px, used by
// .hero-flip's negative margin to slide the hero up
// under the sticky nav so it's truly centered in the
// viewport) in sync with the nav's actual rendered
// height, rather than trusting that fallback to stay
// accurate forever.
// ============================================
(function syncNavHeight(){
  const nav = document.querySelector(".nav");
  if (!nav) return;
  function sync(){
    document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
  }
  sync();
  window.addEventListener("resize", sync);
})();

// ============================================
// Hero scroll parallax transition
// .hero sits inside a taller #heroFlip wrapper and
// stays pinned (position:sticky, set in CSS) while
// that extra height scrolls past. This maps that
// scroll distance to .hero's content drifting upward
// and shrinking faster than the actual scroll, fading
// out as it goes — content held in place while the
// scene moves at a different rate, the classic
// parallax depth cue (marsrejects.com, thetinypod.com)
// — before the Background section rises into view
// underneath, rather than a plain scroll cut. Desktop
// only (CSS drops the wrapper's extra height on narrow
// screens/reduced motion, so there's no scroll-jack
// there either).
// ============================================
(function initHeroParallax(){
  const wrapper = document.getElementById("heroFlip");
  const hero = document.getElementById("top");
  const intro = hero ? hero.querySelector(".hero__intro") : null;
  if (!wrapper || !hero || !intro || prefersReducedMotion) return;
  if (!window.matchMedia("(min-width: 761px)").matches) return;

  const DRIFT_PX = 220;
  const MIN_SCALE = 0.82;
  let ticking = false;

  function update(){
    ticking = false;
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      intro.style.transform = "";
      intro.style.opacity = "";
      return;
    }
    const rect = wrapper.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
    const scale = 1 - progress * (1 - MIN_SCALE);
    intro.style.transform = `translateY(${progress * -DRIFT_PX}px) scale(${scale})`;
    intro.style.opacity = String(1 - progress);
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// ============================================
// Hero magnetic glow
// A soft coral spotlight that trails the cursor across
// the hero, lighting up the ghost "MJ" watermark as it
// passes (parallax-bgs.webflow.io's "magnetic background"
// idea, adapted as a hover effect layered behind the
// hero copy). Lerped toward the pointer like the custom
// cursor below. Desktop, fine-pointer, motion-OK only —
// gated the same way. Tracks the pointer via a window-level
// listener (rather than one on the hero itself) and checks
// containment against the hero's rect, so it still works
// correctly if something above it ever intercepts bubbling —
// visibility is toggled by that containment check, so the
// effect itself stays scoped to the hero either way.
// ============================================
(function initHeroGlow(){
  const hero = document.getElementById("top");
  if (!hero || prefersReducedMotion) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const glow = document.createElement("div");
  glow.className = "hero__glow";
  glow.setAttribute("aria-hidden", "true");
  hero.appendChild(glow);

  let targetX = 0, targetY = 0, x = 0, y = 0, primed = false;

  window.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;
    glow.classList.toggle("is-visible", inside);
    if (!inside) return;
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (!primed){ x = targetX; y = targetY; primed = true; }
  });

  function tick(){
    x += (targetX - x) * 0.15;
    y += (targetY - y) * 0.15;
    glow.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ============================================
// Custom cursor
// A small brand-colored ring that trails the real
// pointer across every page (replaces the old
// work-row-only image preview), swelling over links/
// buttons and shrinking on click. The cursor element
// and the html.has-custom-cursor class (which is what
// actually hides the system cursor, via CSS) are only
// added here in JS, so a script error or an
// unsupported device just leaves the normal cursor
// alone instead of vanishing.
// ============================================
(function initCustomCursor(){
  if (prefersReducedMotion) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-custom-cursor");

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let x = mouseX, y = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // .work__row is included even though only its nested <a> actually
  // navigates — the whole row is styled clickable (cursor:pointer,
  // hover invert in style.css), so the cursor should swell over its
  // tags/meta area too, not just the title/description link.
  const interactiveSelector = "a, button, input, textarea, select, [role='button'], label, .work__row";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSelector)) cursor.classList.add("is-hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSelector)) cursor.classList.remove("is-hover");
  });
  window.addEventListener("mousedown", () => cursor.classList.add("is-down"));
  window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));

  function tick(){
    x += (mouseX - x) * 0.25;
    y += (mouseY - y) * 0.25;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ============================================
// Work row hover preview
// A small polaroid-style thumbnail trails the cursor
// while hovering a .work__row, reusing each row's
// data-preview image (see .work-preview in style.css).
// Lerped toward the pointer like the custom cursor
// above, but offset up-and-right and clamped to the
// viewport so it never gets clipped off-screen.
// ============================================
(function initWorkPreview(){
  const list = document.querySelector(".work__list");
  if (!list || prefersReducedMotion) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const rows = Array.from(list.querySelectorAll(".work__row[data-preview]"));
  if (!rows.length) return;

  const TILTS = [-2, 1.5, -1, 2];
  const OFFSET_X = 32;
  const OFFSET_Y = -180;
  const MARGIN = 16;
  const WIDTH = 200;

  const preview = document.createElement("div");
  preview.className = "work-preview";
  preview.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.alt = "";
  preview.appendChild(img);
  document.body.appendChild(preview);

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let x = mouseX, y = mouseY;
  let activeRow = null;

  function setActive(row){
    if (activeRow === row) return;
    activeRow = row;
    if (row){
      img.src = row.dataset.preview;
      preview.style.setProperty("--tilt", `${TILTS[rows.indexOf(row) % TILTS.length]}deg`);
      preview.classList.add("is-visible");
    } else {
      preview.classList.remove("is-visible");
    }
  }

  list.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    setActive(e.target.closest(".work__row"));
  });
  list.addEventListener("mouseleave", () => setActive(null));

  function tick(){
    x += (mouseX - x) * 0.2;
    y += (mouseY - y) * 0.2;
    const px = Math.min(x + OFFSET_X, window.innerWidth - WIDTH - MARGIN);
    const py = Math.max(y + OFFSET_Y, MARGIN);
    preview.style.transform = `translate(${px}px, ${py}px) rotate(var(--tilt, 0deg))`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ============================================
// Mobile drawer — tapping the "YN." mark opens
// a full nav sidebar on narrow screens.
// ============================================
(function initMobileDrawer(){
  const mark = document.getElementById("navMark");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileDrawerOverlay");
  const closeBtn = document.getElementById("mobileDrawerClose");
  if (!mark || !drawer || !overlay) return;

  const isMobile = () => window.matchMedia("(max-width:760px)").matches;

  function open(){
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    mark.setAttribute("aria-expanded", "true");
  }
  function close(){
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    mark.setAttribute("aria-expanded", "false");
  }

  mark.addEventListener("click", (e) => {
    if (!isMobile()) return;
    e.preventDefault();
    drawer.classList.contains("is-open") ? close() : open();
  });
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// ============================================
// Word-by-word text reveal
// splits section titles (and the hero name) into
// per-word spans with a staggered rise-in delay;
// section titles piggyback on the existing
// .reveal/.is-visible scroll trigger below, the
// hero name plays once immediately on load.
// ============================================
(function initWordReveal(){
  function splitWords(el){
    const words = el.textContent.trim().split(/\s+/).filter(Boolean);
    el.innerHTML = words
      .map((w, i) => `<span class="word-reveal" style="--i:${i}">${w}</span>`)
      .join(" ");
  }

  document.querySelectorAll(".section-head__title, .hero__name").forEach(splitWords);

  if (prefersReducedMotion) return;

  const heroName = document.querySelector(".hero__name");
  if (heroName) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => heroName.classList.add("is-visible"));
    });
  }
})();

// ============================================
// Scroll reveal for sections
// ============================================
(function initReveal(){
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((t) => observer.observe(t));
})();

// ============================================
// Scroll pop-in for repeated items
// work rows, experience entries, skill cards, and the
// contact block's lines each get a staggered --i index
// and .pop-in class here, then pop up (scale + rise,
// see .pop-in in style.css) one after another as their
// section scrolls into view — the same one-shot
// IntersectionObserver pattern as initReveal above,
// just at the individual-item level instead of the
// whole section.
// ============================================
(function initPopIn(){
  const groups = [
    document.querySelectorAll(".work__row"),
    document.querySelectorAll(".experience__item"),
    document.querySelectorAll(".skills__cat"),
    document.querySelectorAll(".contact__cta, .contact__sub, .contact__email, .contact__row"),
  ];

  const targets = [];
  groups.forEach((group) => {
    group.forEach((el, i) => {
      el.classList.add("pop-in");
      el.style.setProperty("--i", i);
      targets.push(el);
    });
  });
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  targets.forEach((t) => observer.observe(t));
})();

// ============================================
// Skills card carousel
// Book-page marquee, horizontal on mobile (<=760px, page
// slides in from the left/right) and vertical on tablet/
// desktop (>=761px, page slides in from top/bottom, panned
// with the mouse instead of touch). `pos` is a continuous
// (fractional) position along the loop, drifting forward on
// its own at a slow constant rate via requestAnimationFrame.
// Every card's placement is driven by --dist — its signed
// circular distance from `pos` (0 = active/centered, ±1 =
// the previous/next page peeking at the edge, ±2 = parked
// off-screen — see the skills__grid rules in style.css) —
// recomputed every frame, so the whole stack drifts smoothly
// and loops forever. Dragging a card grabs `pos` directly
// along whichever axis is active (1:1 with the pointer, so
// it can run faster than the drift in either direction);
// releasing hands control straight back to the slow autoplay
// from wherever it landed. The Prev/Next controls ease `pos`
// by one card instead of jumping it. Scrolling the whole grid
// out of view resets it back to the first page.
// ============================================
(function initSkillsStack(){
  const grid = document.querySelector(".skills__grid");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".skills__cat"));
  const count = cards.length;
  if (!count) return;

  const isStackMode = () => true;
  const isVertical = () => window.matchMedia("(min-width:761px)").matches;
  const SECONDS_PER_CARD = 22;
  const AUTOPLAY_SPEED = 1 / SECONDS_PER_CARD;
  const MAX_DT = 0.05;
  // velocity relaxes back to AUTOPLAY_SPEED as a damped spring
  // (STIFFNESS/DAMPING below) rather than a plain exponential
  // decay, so a released flick overshoots slightly and settles
  // with a touch of bounce instead of just gliding to a stop.
  const SPRING_STIFFNESS = 50;
  const SPRING_DAMPING = 18; // above 2*sqrt(stiffness) (~14.1) — overdamped, so it settles smoothly with no bounce
  const MAX_FLING_SPEED = 3; // units/sec, keeps a hard flick in scale with the drift

  let pos = 0;
  let manualTarget = null;
  let dragging = false;
  let dragVertical = false;
  let dragStartCoord = 0;
  let dragStartPos = 0;
  let slotSizePx = 300;
  let lastTime = null;
  let visible = true;
  let velocity = AUTOPLAY_SPEED;
  let velocityAccel = 0;
  let lastMoveTime = 0;
  let lastMovePos = 0;

  // reads the axis coordinate a drag in progress cares about —
  // locked to dragVertical (set once at pointerdown) rather than
  // re-checking isVertical(), so a drag never flips axis mid-gesture
  // if the viewport is resized while dragging.
  const axisCoord = (e) => dragVertical ? e.clientY : e.clientX;

  const nav = document.createElement("div");
  nav.className = "skills__nav";
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "skills__nav__prev";
  prevBtn.textContent = "Prev";
  const sep = document.createElement("span");
  sep.className = "skills__nav__sep";
  sep.textContent = "|";
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "skills__nav__next";
  nextBtn.textContent = "Next";
  nav.append(prevBtn, sep, nextBtn);
  grid.after(nav);

  function render(){
    const stackable = isStackMode();
    cards.forEach((card, i) => {
      let d = ((i - pos) % count + count) % count;
      if (d > count / 2) d -= count;
      const isActive = Math.abs(d) < 0.5;
      card.classList.toggle("is-active", isActive);
      card.style.setProperty("--dist", d);
      card.style.setProperty("--absdist", Math.abs(d));
      if (stackable) card.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  function goTo(delta){
    manualTarget = (manualTarget != null ? manualTarget : pos) + delta;
  }

  function reset(){
    pos = 0;
    manualTarget = null;
    render();
  }

  function syncInteractivity(){
    cards.forEach((card) => card.setAttribute("role", "group"));
  }

  function tick(time){
    if (lastTime == null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, MAX_DT);
    lastTime = time;

    if (isStackMode() && visible){
      if (manualTarget != null){
        const diff = manualTarget - pos;
        if (Math.abs(diff) < 0.003){
          pos = manualTarget;
          manualTarget = null;
        } else {
          pos += diff * Math.min(dt * 8, 1);
        }
      } else if (!dragging){
        // damped spring pulling velocity back to AUTOPLAY_SPEED —
        // velocityAccel is the spring's "acceleration", so a hard
        // flick eases past the resting speed and springs back
        // instead of coasting straight down to it.
        velocityAccel += (SPRING_STIFFNESS * (AUTOPLAY_SPEED - velocity) - SPRING_DAMPING * velocityAccel) * dt;
        velocity += velocityAccel * dt;
        pos += velocity * dt;
      }
      render();
    }
    requestAnimationFrame(tick);
  }

  prevBtn.addEventListener("click", () => goTo(-1));
  nextBtn.addEventListener("click", () => goTo(1));

  grid.addEventListener("pointerdown", (e) => {
    if (!isStackMode()) return;
    const card = e.target.closest(".skills__cat");
    if (!card) return;
    dragging = true;
    dragVertical = isVertical();
    manualTarget = null;
    dragStartCoord = axisCoord(e);
    dragStartPos = pos;
    const rect = card.getBoundingClientRect();
    slotSizePx = (dragVertical ? rect.height : rect.width) * 1.05;
    lastMoveTime = performance.now();
    lastMovePos = pos;
    velocity = 0;
    velocityAccel = 0;
    grid.classList.add("is-dragging");
    card.setPointerCapture(e.pointerId);
  });

  grid.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const d = axisCoord(e) - dragStartCoord;
    pos = dragStartPos - d / slotSizePx;
    render();

    // smoothed instantaneous velocity, so releasing mid-flick
    // carries that speed into the settle-down in tick().
    const now = performance.now();
    const dt = (now - lastMoveTime) / 1000;
    if (dt > 0){
      const instVelocity = (pos - lastMovePos) / dt;
      velocity = velocity * 0.7 + instVelocity * 0.3;
      lastMoveTime = now;
      lastMovePos = pos;
    }
  });

  function endDrag(){
    if (!dragging) return;
    dragging = false;
    velocity = Math.max(-MAX_FLING_SPEED, Math.min(MAX_FLING_SPEED, velocity));
    grid.classList.remove("is-dragging");
  }

  grid.addEventListener("pointerup", endDrag);
  grid.addEventListener("pointercancel", endDrag);

  // Mouse-wheel panning, desktop/tablet only. Grabs `pos` the
  // same way a drag does, but nudges it by a normalized amount
  // per tick instead of 1:1 with pixels (wheel deltas vary
  // wildly by device/browser). No preventDefault — the page
  // keeps scrolling normally while the deck pans, so the wheel
  // never gets trapped here even though the loop has no "end"
  // to release it at. A short idle timer snaps back to the
  // nearest whole card once scrolling stops, reusing the same
  // manualTarget easing the Prev/Next controls use.
  const WHEEL_SENSITIVITY = 0.0022;
  const WHEEL_IDLE_MS = 140;
  let wheelIdleTimer = null;

  grid.addEventListener("wheel", (e) => {
    if (!isVertical()) return;
    manualTarget = null;
    dragging = false;
    grid.classList.remove("is-dragging");
    pos += e.deltaY * WHEEL_SENSITIVITY;
    velocity = 0;
    velocityAccel = 0;
    render();
    clearTimeout(wheelIdleTimer);
    wheelIdleTimer = setTimeout(() => { manualTarget = Math.round(pos); }, WHEEL_IDLE_MS);
  }, { passive: true });

  cards.forEach((card) => {
    card.addEventListener("keydown", (e) => {
      if (!isStackMode() || !card.classList.contains("is-active")) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp"){ e.preventDefault(); goTo(-1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown"){ e.preventDefault(); goTo(1); }
    });
  });

  render();
  syncInteractivity();
  window.addEventListener("resize", syncInteractivity);
  requestAnimationFrame(tick);

  if ("IntersectionObserver" in window){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (!visible) reset();
      });
    }, { threshold: 0 });
    observer.observe(grid);
  }
})();

// ============================================
// "Minji" cutout pop-in/out for the Background
// section — pops in as soon as the section (not
// just the cutout's own small corner of it) reaches
// the viewport, and pops back out once the section
// itself has scrolled off, rather than a one-shot
// reveal. Watching the whole section (instead of the
// cutout element, which sits near the top of a much
// taller section) keeps it from popping back out
// prematurely while you're still scrolled into the
// middle of the section reading the bio.
// ============================================
(function initBackgroundMinjiReveal(){
  const section = document.getElementById("background");
  const el = document.getElementById("backgroundMinji");
  if (!section || !el) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    el.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      el.classList.toggle("is-visible", entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: "0px" });

  observer.observe(section);
})();

// ============================================
// Smart "back" links (project detail pages)
// prefer real browser history over a fresh
// navigation so the Work list's scroll position
// is restored, falling back to the href when
// there's no history to go back to (e.g. the
// page was opened directly).
// ============================================
(function initSmartBackLinks(){
  const links = document.querySelectorAll(".js-back");
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  });
})();

// ============================================
// Hobby photo caption popup
// hovering a photo in the Hobbies moodboard floats a
// small text-only card (title + blurb, no repeated
// image) right next to that tile, pinned beside it on
// scroll/resize. On hover-capable pointers it's purely
// hover-driven — no click needed, no close button, it
// just follows the mouse on and off each tile. On
// touch/coarse pointers, where hover doesn't exist, it
// falls back to tap-to-toggle with a centered card, a
// dimmed backdrop, and a visible close button.
// ============================================
(function initHobbyLightbox(){
  const lightbox = document.getElementById("hobbyLightbox");
  const cards = document.querySelectorAll(".hobby-card__btn");
  if (!lightbox || !cards.length) return;

  const panel = lightbox.querySelector(".lightbox__panel");
  const title = document.getElementById("lightboxTitle");
  const caption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");

  const GAP = 18;
  const MARGIN = 16;
  const HOVER_CLOSE_DELAY = 120;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lastFocused = null;
  let openCard = null;
  let closeTimer = null;

  function isCentered(){
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function position(){
    if (isCentered() || !openCard){
      lightbox.classList.add("is-centered");
      panel.style.top = "50%";
      panel.style.left = "50%";
      panel.style.transform = lightbox.classList.contains("is-open")
        ? "translate(-50%, -50%) scale(1)"
        : "translate(-50%, -50%) scale(0.92)";
      return;
    }
    lightbox.classList.remove("is-centered");

    const rect = openCard.getBoundingClientRect();
    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + GAP;
    if (left + panelW > vw - MARGIN){
      left = rect.left - GAP - panelW;
    }
    if (left < MARGIN){
      left = Math.min(Math.max(rect.left, MARGIN), vw - panelW - MARGIN);
    }

    let top = rect.top + rect.height / 2 - panelH / 2;
    top = Math.min(Math.max(top, MARGIN), vh - panelH - MARGIN);

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.transform = lightbox.classList.contains("is-open") ? "scale(1)" : "scale(0.92)";
  }

  function show(card){
    openCard = card;
    title.textContent = card.dataset.title;
    caption.textContent = card.dataset.caption;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    position();
    requestAnimationFrame(position);
  }

  function hide(){
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    panel.style.transform = isCentered()
      ? "translate(-50%, -50%) scale(0.92)"
      : "scale(0.92)";
    openCard = null;
  }

  if (canHover){
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        show(card);
      });
      card.addEventListener("mouseleave", () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(hide, HOVER_CLOSE_DELAY);
      });
      card.addEventListener("focus", () => show(card));
      card.addEventListener("blur", () => hide());
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) hide();
    });
  } else {
    function openClick(card){
      lastFocused = document.activeElement;
      show(card);
      closeBtn.focus();
    }
    function closeClick(){
      hide();
      if (lastFocused) lastFocused.focus();
    }
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        if (openCard === card) closeClick();
        else openClick(card);
      });
    });
    closeBtn.addEventListener("click", closeClick);
    backdrop.addEventListener("click", closeClick);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeClick();
    });
  }

  window.addEventListener("resize", () => {
    if (lightbox.classList.contains("is-open")) position();
  });
  window.addEventListener("scroll", () => {
    if (lightbox.classList.contains("is-open")) position();
  }, { passive: true });
})();
