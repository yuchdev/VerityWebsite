/* ============================================================
   Verity landing (original style) + animated scroll cards
   ------------------------------------------------------------
   Switch ONLY this variable to change the scroll-card behavior:

     "current"      -> standard appear animation (IntersectionObserver threshold)
     "catchup_half" -> next card appears when previous card's bottom reaches half-screen

   NOTE:
   - Cards animate only once.
   - JS sets: <html data-anim="..."> for CSS to pick animation keyframes.
   ============================================================ */
const ANIMATION_MODE = "current"; // "current" | "catchup_half"

(function init() {
  document.documentElement.dataset.anim = ANIMATION_MODE;

  setupMobileMenuAndYear();
  setupScrollCards();
})();

function setupMobileMenuAndYear() {
  const burger = document.querySelector(".nav__burger");
  const menu = document.getElementById("mobileMenu");

  burger?.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    if (menu) menu.hidden = open;
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll("#mobileMenu a").forEach((a) =>
    a.addEventListener("click", () => {
      if (!burger || !menu) return;
      burger.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    })
  );
}

function setupScrollCards() {
  const root = document.querySelector("[data-scrollcards]");
  if (!root) return;

  const cards = Array.from(root.querySelectorAll(".scrollCard"));
  if (!cards.length) return;

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cards.forEach((c) => c.classList.add("is-visible"));
    return;
  }

  // Ensure first card is visible immediately (prevents initial blank)
  cards[0].classList.add("is-visible");

  if (ANIMATION_MODE === "catchup_half") {
    catchupHalfMode(cards);
  } else {
    currentMode(cards);
  }
}

/* MODE 1: Standard appear on entry (Chromium/Firefox/Safari) */
function currentMode(cards) {
  const rest = cards.slice(1);

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -20% 0px",
    }
  );

  rest.forEach((c) => io.observe(c));
}

/* MODE 2: Reveal card i+1 when card i bottom hits half-screen */
function catchupHalfMode(cards) {
  const revealed = new Array(cards.length).fill(false);
  revealed[0] = true;

  const half = () => window.innerHeight * 0.5;
  let ticking = false;

  const step = () => {
    const mid = half();

    for (let i = 0; i < cards.length - 1; i++) {
      if (!revealed[i] || revealed[i + 1]) continue;

      const prevRect = cards[i].getBoundingClientRect();
      if (prevRect.bottom <= mid) {
        cards[i + 1].classList.add("is-visible");
        revealed[i + 1] = true;
      }
    }

    if (revealed.every(Boolean)) {
      window.removeEventListener("scroll", onScroll, { passive: true });
      window.removeEventListener("resize", onScroll);
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      step();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  step();
}
