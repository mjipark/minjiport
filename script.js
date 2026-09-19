// ============================================
// Footer year
// ============================================
document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const DRIFT_PX = 140;
  const MIN_SCALE = 0.9;
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
// Ambient background field mouse parallax
// the fixed shape layer behind every section
// drifts opposite the cursor, same depth-based
// lerp technique as the hero collage, layered
// on top of each shape's own CSS float loop via
// the --mx/--my custom properties it animates.
// ============================================
(function initBgFieldParallax(){
  const field = document.getElementById("bgField");
  const isDesktop = window.matchMedia("(min-width: 761px)").matches;
  if (!field || prefersReducedMotion || !isDesktop) return;

  const shapes = Array.from(field.querySelectorAll(".bg-shape"));
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener("mousemove", (e) => {
    const { innerWidth, innerHeight } = window;
    targetX = (e.clientX / innerWidth - 0.5) * 2;
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  });

  function tick(){
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;

    shapes.forEach((shape) => {
      const depth = parseFloat(shape.dataset.depth) || 0.3;
      shape.style.setProperty("--mx", `${currentX * depth * -50}px`);
      shape.style.setProperty("--my", `${currentY * depth * -50}px`);
    });

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

  const interactiveSelector = "a, button, input, textarea, select, [role='button'], label";
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

  // hero name gets a further per-letter split (each
  // letter wrapped inside its word's .word-reveal span,
  // so the word-level rise-in above is unaffected) so
  // initHeroFontCycle below can flip each letter's font
  // independently instead of the whole name at once.
  function splitWordsAndLetters(el){
    const words = el.textContent.trim().split(/\s+/).filter(Boolean);
    el.innerHTML = words
      .map((w, i) => {
        const letters = w
          .split("")
          .map((ch) => `<span class="hero__letter">${ch}</span>`)
          .join("");
        return `<span class="word-reveal" style="--i:${i}">${letters}</span>`;
      })
      .join(" ");
  }

  document.querySelectorAll(".section-head__title").forEach(splitWords);
  document.querySelectorAll(".hero__name").forEach(splitWordsAndLetters);

  if (prefersReducedMotion) return;

  const heroName = document.querySelector(".hero__name");
  if (heroName) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => heroName.classList.add("is-visible"));
    });
  }
})();

// ============================================
// Hero name font-cycling
// co-ux.framer.website-inspired, but toned down: only
// 1-2 letters in "Minji Park" (see the .hero__letter
// split above) glitch to an accent typeface at a time,
// while the rest sit in the normal Fraunces italic —
// which letters glitch keeps rotating every second.
// Cycling every letter at once (an earlier version)
// read as noise rather than a name; this keeps the
// eye-catching flicker as an accent instead of
// replacing the whole headline. Pauses when the hero
// scrolls out of view (and never starts at all under
// reduced motion) so it isn't running forever in the
// background.
// ============================================
(function initHeroFontCycle(){
  const heroName = document.querySelector(".hero__name");
  const letters = heroName ? Array.from(heroName.querySelectorAll(".hero__letter")) : [];
  if (!heroName || !letters.length || prefersReducedMotion) return;

  const BASE_FONT = { family: "var(--font-display)", weight: 900, style: "italic" };
  const ACCENT_FONTS = [
    { family: "'Space Grotesk', sans-serif", weight: 700, style: "normal" },
    { family: "'Space Mono', monospace", weight: 700, style: "normal" },
    { family: "'Unbounded', sans-serif", weight: 900, style: "normal" },
    { family: "'Instrument Serif', serif", weight: 400, style: "italic" },
    { family: "'Bebas Neue', sans-serif", weight: 400, style: "normal" },
  ];
  const MAX_ACTIVE = Math.min(2, letters.length);
  const STEP_MS = 1000;
  const START_DELAY_MS = 1000;

  let timer = null;

  function applyFont(letterEl, font){
    letterEl.style.fontFamily = font.family;
    letterEl.style.fontWeight = font.weight;
    letterEl.style.fontStyle = font.style;
  }

  function tick(){
    letters.forEach((letterEl) => applyFont(letterEl, BASE_FONT));

    const activeCount = 1 + Math.floor(Math.random() * MAX_ACTIVE);
    const pool = letters.slice();
    for (let i = 0; i < activeCount && pool.length; i++){
      const letterEl = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      applyFont(letterEl, ACCENT_FONTS[Math.floor(Math.random() * ACCENT_FONTS.length)]);
    }
    timer = setTimeout(tick, STEP_MS);
  }

  function start(){
    if (timer) return;
    timer = setTimeout(tick, START_DELAY_MS);
  }
  function stop(){
    clearTimeout(timer);
    timer = null;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }, { threshold: 0 });
    observer.observe(heroName);
  } else {
    start();
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
