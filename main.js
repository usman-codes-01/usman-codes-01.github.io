/* ==========================================================================
   MUHAMMAD USMAN — portfolio engine
   ascii terminal field → scramble → sticky case deck → free project rail
   → pubspec typing → ink-pill nav spy → magnetic cursor → carrom physics
   ========================================================================== */

(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const root = document.documentElement;
  root.classList.add("js");
  if (reduced) root.classList.add("reduced");

  /* ========================================================================
     THE FLOW FIELD — ONE fixed canvas behind the WHOLE site. Smooth liquid
     contour lines that slowly undulate (the 2026 award trend: organic flowing
     motion, NOT flickering particles). Subtle enough to keep text readable,
     continuous so it never flickers. (canvas2d, runs without GSAP)
     ======================================================================== */
  class FlowField {
    constructor(canvas, isStatic) {
      this.cv = canvas;
      this.ctx = canvas.getContext("2d");
      this.isStatic = isStatic;
      this.visible = true;
      this.t = isStatic ? 12 : 0;
      this.last = performance.now();
      this.mx = 0; this.cmx = 0;
      this.onResize = this.onResize.bind(this);
      this.tick = this.tick.bind(this);
      window.addEventListener("resize", this.onResize);
      if (!isStatic) {
        window.addEventListener("pointermove", (e) => {
          this.mx = e.clientX / window.innerWidth - 0.5;
        }, { passive: true });
      }
      this.onResize();
      if (isStatic) this.draw();
      else {
        if ("IntersectionObserver" in window) {
          new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; }).observe(canvas);
        }
        requestAnimationFrame(this.tick);
      }
    }
    onResize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.cv.width = this.w * dpr;
      this.cv.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.rows = this.w < 700 ? 16 : 22;
      this.step = this.w < 700 ? 22 : 14;
      this.horizon = this.h * 0.40;
      this.baseD = [];
      for (let i = 0; i < this.rows; i++) this.baseD.push(i / this.rows);
      if (this.isStatic) this.draw();
    }
    tick(now) {
      requestAnimationFrame(this.tick);
      if (!this.visible) { this.last = now; return; }
      const dt = Math.max(0, Math.min((now - this.last) / 1000, 0.05));
      this.last = now;
      this.t += dt;
      this.cmx += (this.mx - this.cmx) * 0.03;
      this.draw();
    }
    draw() {
      const c = this.ctx, { w, h, step, t, rows, horizon } = this;
      c.fillStyle = "#0B0D0A";
      c.fillRect(0, 0, w, h);
      const shift = this.cmx * 32;

      // perspective terrain: rows emerge at the horizon and flow toward the
      // viewer, spacing / brightness / amplitude growing with nearness → real 3D
      const list = [];
      for (let i = 0; i < rows; i++) list.push({ d: (this.baseD[i] + t * 0.045) % 1, i });
      list.sort((a, b) => a.d - b.d);                 // far first, near painted on top

      for (const { d, i } of list) {
        const near = Math.pow(d, 1.9);                // 0 = far/horizon, 1 = near/bottom
        const y0 = horizon + (h + 90 - horizon) * near;
        const amp = 4 + near * 30;
        const fade = Math.min(1, d * 5) * Math.min(1, (1 - d) * 7);   // seamless loop in/out
        const amber = i % 5 === 2;
        const a = (0.025 + near * 0.10) * fade;
        c.strokeStyle = amber ? `rgba(255,176,0,${(a * 1.6).toFixed(3)})`
                              : `rgba(233,228,214,${a.toFixed(3)})`;
        c.lineWidth = (amber ? 1.3 : 1) * (0.6 + near * 0.9);
        c.beginPath();
        for (let x = -20; x <= w + 20; x += step) {
          const wave = Math.sin(x * 0.006 + t * 0.5 + i * 0.7) * amp
                     + Math.sin(x * 0.014 - t * 0.3 + i) * amp * 0.42;
          const px = x + shift * (0.4 + near);
          const py = y0 + wave;
          if (x < 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      }
    }
  }

  const ambientCanvas = $("#ambient");
  if (ambientCanvas) new FlowField(ambientCanvas, reduced);

  /* ========================================================================
     graceful bail — if GSAP didn't load, ship the static (complete) page
     ======================================================================== */
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  function staticFinish() {
    $("#strike") && $("#strike").classList.add("is-on");
    const phone = $("#phone");
    if (phone) { phone.classList.remove("is-search"); phone.classList.add("is-match"); }
  }

  if (reduced || !hasGSAP) {
    staticFinish();
    if (!hasGSAP) return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ========================================================================
     LENIS — physics smooth scroll (skipped under reduced motion)
     ======================================================================== */
  let lenis = null;
  if (!reduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // anchor navigation through Lenis
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = $(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  // nav turns into a frosted bar once you leave the hero — keeps the
  // usman.codes logo + links readable over any section (no more blend flips)
  (function navBar() {
    const nav = $(".nav");
    if (!nav) return;
    const sync = () => nav.classList.toggle("is-stuck", window.scrollY > 60);
    window.addEventListener("scroll", sync, { passive: true });
    if (lenis) lenis.on("scroll", sync);
    sync();
  })();

  /* ========================================================================
     split-text utilities
     ======================================================================== */
  function splitChars(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = "";
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "wd";
          for (const ch of word) {
            const outer = document.createElement("span");
            outer.className = "ch";
            const inner = document.createElement("span");
            inner.className = "ch-in";
            inner.textContent = ch;
            outer.appendChild(inner);
            w.appendChild(outer);
          }
          el.appendChild(w);
        });
      } else {
        el.appendChild(node);
      }
    });
    el.classList.add("split");
    return $$(".ch-in", el);
  }

  function splitWords(el) {
    const text = el.textContent;
    el.innerHTML = "";
    text.split(/(\s+)/).forEach((word) => {
      if (!word) return;
      if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "wd";
      w.textContent = word;
      el.appendChild(w);
    });
    el.classList.add("split");
    return $$(".wd", el);
  }

  /* ========================================================================
     scramble / decode — hero heading
     ======================================================================== */
  // binary decode — 0s and 1s flicker and resolve, left to right, into the name
  function scramble(el, finalText, dur) {
    const chars = finalText.split("");
    const settle = chars.map((_, i) => dur * (0.22 + 0.74 * (i / chars.length)) + rand(0, 0.1));
    const start = performance.now();
    let lastFlip = 0;
    let bits = chars.map(() => (Math.random() < 0.5 ? "0" : "1"));
    (function frame(now) {
      const t = (now - start) / 1000;
      // flip the unsettled bits ~16×/sec so the 0/1s are actually readable
      if (now - lastFlip > 60) {
        lastFlip = now;
        bits = bits.map(() => (Math.random() < 0.5 ? "0" : "1"));
      }
      let out = "", done = true;
      for (let i = 0; i < chars.length; i++) {
        if (t >= settle[i]) out += chars[i];
        else { out += bits[i]; done = false; }
      }
      el.textContent = out;
      if (!done) requestAnimationFrame(frame);
    })(start);
  }

  /* ========================================================================
     choreographed entrance (motion path only)
     ======================================================================== */
  if (!reduced) {
    gsap.set("#ambient", { autoAlpha: 0 });
    gsap.set("#heroUrdu", { autoAlpha: 0, x: 60 });
    gsap.set(".nav", { y: -28, autoAlpha: 0 });
    gsap.set("#heroTop", { y: 24, autoAlpha: 0 });
    gsap.set("#heroName", { autoAlpha: 0 });
    gsap.set(".hero-line-in", { yPercent: 115 });
    gsap.set("#heroFoot", { y: 30, autoAlpha: 0 });

    const nameEl = $("#scrambleName");
    const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
    entrance
      .to("#ambient", { autoAlpha: 1, duration: 1.4, ease: "power2.inOut" })
      .to(".nav", { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.9")
      .to("#heroTop", { y: 0, autoAlpha: 1, duration: 0.7 }, "-=0.5")
      .to("#heroName", { autoAlpha: 1, duration: 0.5 }, "-=0.35")
      .add(() => scramble($("#heroFirst"), "MUHAMMAD", 1.3), "<")
      .add(() => scramble(nameEl, "USMAN", 1.7), "<+=0.25")
      .to(".hero-line-in", { yPercent: 0, duration: 0.9, stagger: 0.14, ease: "power4.out" }, "-=0.2")
      .add(() => $("#strike").classList.add("is-on"), "-=0.25")
      .to("#heroFoot", { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.4")
      .to("#heroUrdu", { autoAlpha: 1, x: 0, duration: 1.6, ease: "power2.out" }, "-=1.0");
  }

  /* ========================================================================
     multi-layer parallax — hero drives apart as you leave it
     ======================================================================== */
  if (!reduced) {
    const heroST = { trigger: "#hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to("#heroUrdu",  { yPercent: 34, ease: "none", scrollTrigger: heroST });
    gsap.to("#heroName",  { yPercent: -76, ease: "none", scrollTrigger: heroST }); // CSS sits at -50%; drift a further -26%
    gsap.to("#heroThesis",{ yPercent: -60, ease: "none", scrollTrigger: heroST });
    gsap.to("#heroFoot",  { autoAlpha: 0, ease: "none", scrollTrigger: { ...heroST, end: "30% top" } });

    $$("[data-parallax]").forEach((el) => {
      const sec = el.closest("section") || el.parentElement;
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax),
        ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ========================================================================
     shared reveals — headings (per-char) + small elements
     ======================================================================== */
  if (!reduced) {
    $$("[data-split]").forEach((h) => {
      const chars = splitChars(h);
      gsap.fromTo(chars,
        { yPercent: 115 },
        {
          yPercent: 0, duration: 0.9, stagger: 0.032, ease: "power4.out",
          scrollTrigger: { trigger: h, start: "top 86%", once: true }
        });
    });

    $$("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 36, autoAlpha: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    // about — paragraphs read themselves in, word by word, as you scroll
    $$("[data-words]").forEach((p) => {
      const words = splitWords(p);
      gsap.fromTo(words,
        { opacity: 0.13 },
        {
          opacity: 1, stagger: 0.02, ease: "none",
          scrollTrigger: { trigger: p, start: "top 82%", end: "top 38%", scrub: true }
        });
    });
  }

  /* ========================================================================
     WORKIN case study — sticky deck on free scroll
     ======================================================================== */
  const phone = $("#phone");
  const steps = $$(".case-step");

  function setCasePhase(i) {
    if (!phone) return;
    phone.classList.toggle("is-search", i === 0);
    phone.classList.toggle("is-match", i === 1);
    phone.classList.toggle("is-award", i === 2);
    steps.forEach((s, j) => s.classList.toggle("is-active", j === i));
  }

  const mm = gsap.matchMedia();

  // free scroll: the deck stacks via position:sticky, nothing pins the page —
  // skip the whole chapter at full speed if you feel like it
  if (!reduced) {
    const states = $$(".case-state");

    // phone phases follow whichever chapter is in view
    states.forEach((st, i) => {
      ScrollTrigger.create({
        trigger: st,
        start: "top 60%",
        onEnter: () => setCasePhase(i),
        onLeaveBack: () => setCasePhase(Math.max(i - 1, 0))
      });
    });

    states.forEach((st) => {
      gsap.from(st, {
        y: 70, autoAlpha: 0, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: st, start: "top 92%", once: true }
      });
    });

    gsap.from("#awardBig", {
      scale: 1.5, rotate: -7, autoAlpha: 0, duration: 0.5, ease: "power4.out",
      scrollTrigger: { trigger: states[2], start: "top 60%", once: true }
    });

    mm.add("(min-width: 900px)", () => {
      // deck depth: a covered card recedes a touch — but only ONCE the next card
      // is actually sliding over it (no early fade, so each card stays readable)
      [0, 1].forEach((i) => {
        gsap.fromTo(states[i],
          { scale: 1 },
          {
            scale: 0.965, ease: "none",
            scrollTrigger: { trigger: states[i + 1], start: "top 65%", end: "top 18%", scrub: true }
          });
      });

      // phone floats up as the section approaches
      gsap.from(".phone", {
        y: 90, rotate: 4, autoAlpha: 0, ease: "power2.out",
        scrollTrigger: { trigger: "#work", start: "top 95%", end: "top 35%", scrub: 1 }
      });
    });
  } else {
    setCasePhase(1);
  }

  /* ========================================================================
     PROJECTS — a free horizontal rail (drag / swipe / native scroll);
     the page's vertical scroll is never held hostage
     ======================================================================== */
  (function projectsRail() {
    const track = $("#projTrack");
    if (!track) return;

    if (!reduced) {
      gsap.from(".card", {
        y: 60, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: "#projects", start: "top 78%", once: true }
      });

      // art counter-drifts as the rail moves
      const arts = $$(".card-art", track);
      let railRaf = null;
      track.addEventListener("scroll", () => {
        if (railRaf) return;
        railRaf = requestAnimationFrame(() => {
          railRaf = null;
          arts.forEach((art) => {
            const r = art.getBoundingClientRect();
            const p = (r.left + r.width / 2) / window.innerWidth - 0.5; // -0.5 … 0.5
            art.style.translate = (p * -14) + "% 0";
          });
        });
      }, { passive: true });
    }

    // drag the rail with a mouse — touch swipes natively
    let down = false, startX = 0, startL = 0, moved = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false;
      startX = e.clientX; startL = track.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.scrollLeft = startL - dx;
    });
    window.addEventListener("pointerup", () => { down = false; });
    track.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  })();

  // click-to-expand — each project opens to its build + result (rail stays put)
  (function expandCards() {
    $$(".card[data-expand]").forEach((card) => {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-expanded", "false");
      const toggle = () => {
        const open = card.classList.toggle("is-open");
        card.setAttribute("aria-expanded", open ? "true" : "false");
        // the rail's tallest card sets page height — keep ScrollTriggers honest
        if (typeof ScrollTrigger !== "undefined") {
          setTimeout(() => ScrollTrigger.refresh(), 540);
        }
      };
      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;   // real links (GITHUB ↗) still work
        toggle();
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  })();

  // emotion card — classifier flickers through labels on hover
  $$(".art-emotion").forEach((grid) => {
    const card = grid.closest(".card");
    const emos = $$(".emo", grid);
    const hot = $(".emo--hot", grid);
    if (hot) { hot.classList.remove("emo--hot"); hot.classList.add("is-hot"); }
    let timer = null;
    const labels = ["angry 0.12", "disgust 0.03", "fear 0.07", "happy 0.94", "neutral 0.41", "sad 0.09", "surprise 0.27"];
    card.addEventListener("mouseenter", () => {
      if (reduced) return;
      let i = emos.findIndex((e) => e.classList.contains("is-hot"));
      timer = setInterval(() => {
        emos.forEach((e) => e.classList.remove("is-hot"));
        i = (i + 1) % emos.length;
        emos[i].classList.add("is-hot");
        emos[i].textContent = labels[i];
      }, 420);
    });
    card.addEventListener("mouseleave", () => clearInterval(timer));
  });

  /* ========================================================================
     SKILLS — pubspec.yaml types itself
     ======================================================================== */
  (function pubspecTyping() {
    const codeEl = $("#code");
    const caret = $("#caret");
    const body = $("#editorBody");
    if (!codeEl || reduced) return;

    // wrap every character so it can be revealed like a keystroke
    const charEls = [];
    $$("li", codeEl).forEach((li) => {
      const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        for (const ch of node.textContent) {
          const i = document.createElement("i");
          i.className = "tc";
          i.textContent = ch;
          i.style.visibility = "hidden";
          frag.appendChild(i);
          charEls.push(i);
        }
        node.parentNode.replaceChild(frag, node);
      });
    });

    let started = false;
    ScrollTrigger.create({
      trigger: "#editor",
      start: "top 72%",
      once: true,
      onEnter: () => {
        if (started) return;
        started = true;
        caret.classList.add("is-on");
        let idx = 0;
        (function type() {
          // a couple of keystrokes per tick keeps it brisk but human
          for (let k = 0; k < 2 && idx < charEls.length; k++, idx++) {
            charEls[idx].style.visibility = "visible";
          }
          const lastChar = charEls[Math.min(idx, charEls.length) - 1];
          if (lastChar) {
            const r = lastChar.getBoundingClientRect();
            const b = body.getBoundingClientRect();
            caret.style.left = (r.right - b.left + body.scrollLeft) + "px";
            caret.style.top  = (r.top   - b.top  + body.scrollTop) + "px";
          }
          if (idx < charEls.length) {
            const ch = charEls[idx].textContent;
            setTimeout(type, ch === " " ? 4 : rand(6, 18));
          } else {
            setTimeout(() => caret.classList.remove("is-on"), 2600);
          }
        })();
      }
    });
  })();

  /* ========================================================================
     custom cursor — lag physics + context states (link / view / map-pin)
     ======================================================================== */
  if (fine && !reduced) {
    root.classList.add("fine");
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    let seen = false;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { rx = mx; ry = my; seen = true; root.classList.remove("cursor--hide"); }
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });

    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    });

    root.classList.add("cursor--hide");
    document.addEventListener("mouseleave", () => root.classList.add("cursor--hide"));
    document.addEventListener("mouseenter", () => root.classList.remove("cursor--hide"));

    const STATES = ["cursor--link", "cursor--view", "cursor--pin"];
    document.addEventListener("mouseover", (e) => {
      root.classList.remove(...STATES);
      const direct = e.target.closest("[data-cursor]");
      if (direct) { root.classList.add("cursor--" + direct.dataset.cursor); return; }
      const zone = e.target.closest("[data-cursor-zone]");
      if (zone) root.classList.add("cursor--" + zone.dataset.cursorZone);
    });
  }

  /* ========================================================================
     magnetic elements
     ======================================================================== */
  if (fine && !reduced) {
    $$(".magnetic").forEach((el) => {
      const strength = el.classList.contains("btn") || el.classList.contains("contact-link") ? 0.4 : 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength * 1.15,
          duration: 0.4, ease: "power3.out"
        });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ========================================================================
     scroll progress
     ======================================================================== */
  if (!reduced) {
    gsap.to("#progressBar", {
      scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
    });
  }

  /* ========================================================================
     scroll-spy nav — the amber ink pill springs to the section in view
     ======================================================================== */
  if (!reduced) {
    (function navSpy() {
      const links = $$(".nav-link");
      const ink = $("#navInk");
      if (!links.length || !ink) return;

      const byHref = {};
      links.forEach((l) => { byHref[l.getAttribute("href")] = l; });
      let activeLink = null;

      function moveInk(link, immediate) {
        if (!link || getComputedStyle(link).display === "none") {
          gsap.to(ink, { autoAlpha: 0, duration: 0.25 });
          return;
        }
        gsap.to(ink, {
          x: link.offsetLeft - 11,
          width: link.offsetWidth + 22,
          autoAlpha: 1,
          duration: immediate ? 0 : 0.85,
          ease: immediate ? "none" : "elastic.out(1, 0.55)"
        });
      }

      function setActive(href) {
        const link = href ? byHref[href] : null;
        if (link === activeLink) return;
        links.forEach((l) => l.classList.remove("is-active"));
        activeLink = link;
        if (link) link.classList.add("is-active");
        moveInk(link);
      }

      ["#about", "#skills", "#work", "#projects", "#contact"].forEach((id) => {
        ScrollTrigger.create({
          trigger: id,
          start: "top 45%",
          end: "bottom 45%",
          onToggle(self) { if (self.isActive) setActive(id); }
        });
      });
      ScrollTrigger.create({
        trigger: "#hero",
        start: "top top",
        end: "bottom 45%",
        onToggle(self) { if (self.isActive) setActive(null); }
      });

      window.addEventListener("resize", () => moveInk(activeLink, true));
    })();
  }

  /* ========================================================================
     the guide — one little bot that tours the site, saying a line for
     whichever section you're currently in
     ======================================================================== */
  (function guideSpy() {
    const bubble = $("#guideBubble");
    const guideEl = $("#guide");
    if (!bubble) return;
    let talkTimer = null;
    const lines = {
      hero:     "hey — let me show you around ↓",
      about:    "first up: who Usman actually is.",
      skills:   "his toolbox — all production-grade.",
      work:     "the big one — WorkIn, Top 50 nationwide.",
      projects: "more things he's shipped — drag through →",
      contact:  "like what you saw? here's how to reach him."
    };
    let cur = "";
    function say(sec) {
      if (sec === cur || !lines[sec]) return;
      cur = sec;
      bubble.classList.remove("pop");
      void bubble.offsetWidth;          // restart the pop animation
      bubble.textContent = lines[sec];
      bubble.classList.add("pop");
      // make the lips move for as long as the line would take to say
      if (guideEl) {
        guideEl.classList.add("is-speaking");
        clearTimeout(talkTimer);
        talkTimer = setTimeout(() => guideEl.classList.remove("is-speaking"),
          Math.min(2600, 700 + lines[sec].length * 45));
      }
    }
    ["hero", "about", "skills", "work", "projects", "contact"].forEach((sec) => {
      ScrollTrigger.create({
        trigger: "#" + sec,
        start: "top 55%",
        end: "bottom 55%",
        onToggle(self) { if (self.isActive) say(sec); }
      });
    });

    // the tour ends at the footer — the bot steps aside so it never covers it
    const guide = $("#guide"), footer = $(".footer");
    if (guide && footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: "top bottom",
        end: "bottom top",
        onToggle(self) { guide.classList.toggle("is-gone", self.isActive); }
      });
    }
  })();

  /* ========================================================================
     the tips terminal — types rotating, witty dev tips in Usman's voice;
     click for another (replaces the old draggable carrom striker)
     ======================================================================== */
  (function devTips() {
    const cmdEl = $("#tipsCmd"), outEl = $("#tipsOut"), box = $("#tips");
    if (!cmdEl || !outEl) return;

    const tips = [
      { cmd: "sudo hire usman",       out: "permission granted. excellent life choice. ✅" },
      { cmd: "usman --why-hire",      out: "I test on real 3G. your app shouldn't only work on office WiFi." },
      { cmd: "usman --scoreboard",    out: "production apps: 5  ·  todo-list clones: 0  ·  regrets: also 0." },
      { cmd: "usman --carrom",        out: "I made the carrom physics so real my friends rage-quit. worth it." },
      { cmd: "usman --fuel",          out: "runs on chai, not coffee. fixes your bugs either way. ☕❌🍵✅" },
      { cmd: "usman --fun-fact",      out: "WorkIn started as me being mad at an electrician. now: Top 50 nationwide." },
      { cmd: "usman --response-time", out: "I reply faster than `npm install`. and that's a real promise." },
      { cmd: "usman --bugs",          out: "0 bugs in production. (we do NOT talk about staging.)" },
      { cmd: "usman --status",        out: "currently: shipping. previously: shipping. next: also shipping." }
    ];

    let idx = -1, killed = false, autoT = null;

    function typeInto(el, text, speed, done) {
      let i = 0; el.textContent = "";
      (function step() {
        if (killed) return;
        el.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, speed);
        else if (done) done();
      })();
    }

    function next() {
      clearTimeout(autoT);
      idx = (idx + 1) % tips.length;
      const t = tips[idx];
      if (reduced) {
        cmdEl.textContent = t.cmd;
        outEl.textContent = t.out;
        autoT = setTimeout(next, 6000);
        return;
      }
      outEl.textContent = "";
      typeInto(cmdEl, t.cmd, 36, () => {
        setTimeout(() => typeInto(outEl, t.out, 17, () => {
          autoT = setTimeout(next, 5200);
        }), 260);
      });
    }

    if (box) box.addEventListener("click", () => next());
    next();
  })();

  /* ========================================================================
     DEMO LIGHTBOX — VIEW DEMO opens the project's screenshots fullscreen
     ======================================================================== */
  (function demoLightbox() {
    const box = $("#lightbox");
    if (!box) return;
    const imgEl   = $("#lbImg");
    const capEl   = $("#lbCap");
    const countEl = $("#lbCount");
    const prevBtn = $("#lbPrev");
    const nextBtn = $("#lbNext");
    const closeBtn = $("#lbClose");

    let shots = [];      // [{ src, alt }]
    let idx = 0;

    function render() {
      const s = shots[idx];
      if (!s) return;
      imgEl.src = s.src;
      imgEl.alt = s.alt || "";
      capEl.textContent = s.alt || "";
      countEl.textContent = `${idx + 1} / ${shots.length}`;
      const navDisp = shots.length < 2 ? "none" : "";
      prevBtn.style.display = navDisp;
      nextBtn.style.display = navDisp;
      countEl.style.display = navDisp;
    }
    function go(n) { idx = (idx + n + shots.length) % shots.length; render(); }

    function open(list) {
      shots = list; idx = 0; render();
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      imgEl.src = "";
    }

    // wire every VIEW DEMO button to its own screenshots (cards + WorkIn case)
    $$("[data-demo]").forEach((btn) => {
      // nearest ancestor that actually holds this button's screenshots
      let scope = btn.parentElement;
      while (scope && !scope.querySelector(".card-demo")) scope = scope.parentElement;
      const imgs = scope ? $$(".card-demo img", scope).map((im) => ({ src: im.src, alt: im.alt })) : [];
      if (!imgs.length) { btn.style.display = "none"; return; }   // no pics yet → hide demo
      btn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        open(imgs);
      });
    });

    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(1));
    closeBtn.addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
  })();

  /* ========================================================================
     keep layout honest after fonts settle
     ======================================================================== */
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
