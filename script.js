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
  const collage = document.getElementById("heroCollage");
  const isDesktop = window.matchMedia("(min-width: 761px)").matches;
  if (!collage || prefersReducedMotion || !isDesktop) return;

  const items = Array.from(collage.querySelectorAll(".parallax-item"));
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
// Work list cursor-follow preview
// eylonmalkevich.com style: a floating image
// trails the cursor while hovering a row and
// swaps to that row's thumbnail.
// ============================================
(function initCursorPreview(){
  const preview = document.getElementById("cursorPreview");
  const previewImg = document.getElementById("cursorPreviewImg");
  const rows = document.querySelectorAll(".work__row");
  if (!preview || !rows.length) return;

  let mouseX = 0, mouseY = 0;
  let previewX = 0, previewY = 0;
  let active = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      previewImg.src = row.dataset.img;
      preview.classList.add("is-visible");
      active = true;
    });
    row.addEventListener("mouseleave", () => {
      preview.classList.remove("is-visible");
      active = false;
    });
  });

  function tick(){
    if (active) {
      previewX += (mouseX - previewX) * 0.18;
      previewY += (mouseY - previewY) * 0.18;
      preview.style.left = `${previewX}px`;
      preview.style.top = `${previewY}px`;
    }
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
// Scroll-driven "minji" hero reveal
// scrubs the cutout's position/scale/rotation
// against scroll progress through the hero —
// the animation plays as the user scrolls.
// ============================================
(function initMinjiScroll(){
  const el = document.getElementById("heroMinji");
  const hero = document.getElementById("top");
  if (!el || !hero) return;

  const isDesktop = window.matchMedia("(min-width: 761px)").matches;

  if (prefersReducedMotion || !isDesktop) {
    el.style.opacity = 1;
    return;
  }

  let progress = 0;

  function updateProgress(){
    const rect = hero.getBoundingClientRect();
    const total = Math.max(rect.height, 1);
    const scrolled = -rect.top;
    progress = Math.min(1, Math.max(0, scrolled / total));
  }

  function tick(){
    updateProgress();
    const translateY = (1 - progress) * 140;
    const scale = 0.82 + progress * 0.18;
    const rotate = (1 - progress) * -10;
    const opacity = Math.min(1, progress * 2.4);
    el.style.transform = `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`;
    el.style.opacity = opacity;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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
