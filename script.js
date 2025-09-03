document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* Navbar shadow on scroll */
  const header = $("header");
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll);

  /* Theme toggle button injected at end of navbar */
  const navbar = $(".navbar");
  if (navbar && !$("#themeToggle")) {
    const btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.type = "button";
    btn.textContent = "🌙/☀️";
    btn.style.border = "none";
    btn.style.background = "transparent";
    btn.style.color = "#fff";
    btn.style.fontSize = "1.1rem";
    btn.style.cursor = "pointer";
    btn.style.marginLeft = "8px";
    navbar.appendChild(btn);
  }

  const THEME_KEY = "ch_theme";
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem(THEME_KEY);
  const applyTheme = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
  };
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
  $("#themeToggle")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "light" ? "dark" : "light");
  });

  /* Smooth scroll for hash links */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id && id !== "#" ? $(id) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", id);
      }
    });
  });

  /* Search: auto-inject in any section/main with data-searchable */
  $$("[data-searchable]").forEach((root) => {
    if ($(".ch-search", root)) return;
    const wrap = document.createElement("div");
    wrap.className = "ch-search";
    wrap.innerHTML = `<input type="search" placeholder="Search..." aria-label="Search">`;
    root.insertBefore(wrap, root.children[1] || root.firstChild);

    const input = $("input[type='search']", wrap);
    const cards = $$(".card", root);
    const listItems = $$("li", root);

    const filter = (q) => {
      const query = q.trim().toLowerCase();
      const show = (el, ok) => el.style.display = ok ? "" : "none";
      cards.forEach(card => {
        const t = (card.textContent || "").toLowerCase();
        show(card, t.includes(query));
      });
      listItems.forEach(li => {
        const t = (li.textContent || "").toLowerCase();
        show(li, t.includes(query));
      });
    };
    input.addEventListener("input", e => filter(e.target.value));
  });

  /* Download tracking (localStorage) for links that point to PDFs */
  const DL_KEY = "ch_download_counts";
  const getCounts = () => { try { return JSON.parse(localStorage.getItem(DL_KEY) || "{}"); } catch { return {}; } };
  const setCounts = (obj) => localStorage.setItem(DL_KEY, JSON.stringify(obj));
  const isPdfLink = (a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    return href.endsWith(".pdf") || href.includes("/pdfs/");
  };

  const attachBadge = (a, count) => {
    if (a.dataset.badged) return;
    const b = document.createElement("span");
    b.className = "dl-badge";
    b.textContent = ` (${count})`;
    a.appendChild(b);
    a.dataset.badged = "true";
  };

  const refreshBadges = () => {
    const counts = getCounts();
    $$("a").forEach(a => {
      if (!isPdfLink(a)) return;
      const key = a.getAttribute("href");
      attachBadge(a, counts[key] || 0);
    });
  };
  refreshBadges();

  document.body.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !isPdfLink(a)) return;
    const key = a.getAttribute("href");
    const counts = getCounts();
    counts[key] = (counts[key] || 0) + 1;
    setCounts(counts);
    const badge = a.querySelector(".dl-badge");
    if (badge) badge.textContent = ` (${counts[key]})`;
  });

  /* Contact form mailto handler (no backend needed) */
  const form = $(".contact-form");
  if (form && !form.getAttribute("action")) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector('input[type="text"]')?.value?.trim() || "";
      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      const message = form.querySelector("textarea")?.value?.trim() || "";
      if (!name || !email || !message) {
        alert("Please fill all fields.");
        return;
      }
      const subject = encodeURIComponent(`Message from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      const yourEmail = "jayeshjadhav660@gmail.com"; // ← apna email daalo
      window.location.href = `mailto:${yourEmail}?subject=${subject}&body=${body}`;
      form.reset();
    });
  }

  /* Back to top button */
  if (!$("#toTopBtn")) {
    const btn = document.createElement("button");
    btn.id = "toTopBtn";
    btn.title = "Back to top";
    btn.textContent = "↑";
    document.body.appendChild(btn);
    const showHide = () => btn.style.display = window.scrollY > 240 ? "grid" : "none";
    showHide();
    window.addEventListener("scroll", showHide);
    btn.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));
  }
});