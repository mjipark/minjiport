// ============================================
// Footer year
// ============================================
document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ============================================
// Hero mouse parallax
// wow-showroom.com style: elements drift opposite
// mouse position, scaled by each item's data-depth.
// ============================================
(function initParallax(){
  const isDesktop = window.matchMedia("(min-width: 761px)").matches;
  const items = Array.from(document.querySelectorAll(".parallax-item"));
  if (!items.length || prefersReducedMotion || !isDesktop) return;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener("mousemove", (e) => {
    const { innerWidth, innerHeight } = window;
    targetX = (e.clientX / innerWidth - 0.5) * 2;   // -1 .. 1
    targetY = (e.clientY / innerHeight - 0.5) * 2;  // -1 .. 1
  });

  function tick(){
    // lerp for smooth trailing motion
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    items.forEach((item) => {
      const depth = parseFloat(item.dataset.depth) || 0.3;
      const moveX = currentX * depth * 32;
      const moveY = currentY * depth * 32;
      item.style.transform = `rotate(var(--r)) translate(${moveX}px, ${moveY}px)`;
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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
// "Minji" cutout pop-in/out for the Background
// section — pops in on the right each time the
// section scrolls into view, and pops back out
// (reverses the same animation) each time it
// scrolls out, rather than a one-shot reveal.
// ============================================
(function initBackgroundMinjiReveal(){
  const el = document.getElementById("backgroundMinji");
  if (!el) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    el.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      el.classList.toggle("is-visible", entry.isIntersecting);
    });
  }, { threshold: 0.3 });

  observer.observe(el);
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
