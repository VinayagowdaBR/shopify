/* =========================================================
   AIUI Immersive — Phase 1 (Header + Hero)
   - Scroll-aware glass header (compress + hide-on-scroll-down)
   - Magnetic CTA on hero buttons
   - Mouse parallax on hero background
   - OGL shader background (desktop, lazy-loaded, opt-in)
   - prefers-reduced-motion + small-screen guards
   ========================================================= */
(function () {
  "use strict";

  var html = document.documentElement;
  if (!html.classList.contains("aiui-on")) return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  /* ---------- 1. Scroll-aware header ---------- */
  (function initHeader() {
    var header = document.getElementById("header");
    if (!header) return;

    var lastY = window.scrollY || 0;
    var ticking = false;
    var hideThreshold = 12;     // px scroll-delta before hiding
    var compressAfter = 24;     // px from top before glass kicks in

    function update() {
      var y = window.scrollY || 0;
      var dy = y - lastY;

      header.classList.toggle("aiui-scrolled", y > compressAfter);

      // Hide when scrolling down past the header, show when scrolling up
      if (y > 200 && dy > hideThreshold) {
        header.classList.add("aiui-hidden");
      } else if (dy < -2 || y < compressAfter) {
        header.classList.remove("aiui-hidden");
      }

      // Scroll progress bar
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
      header.style.setProperty("--aiui-scroll-progress", pct.toFixed(2) + "%");

      lastY = y;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  })();

  /* ---------- 2. Magnetic CTA on hero buttons ---------- */
  (function initMagnetic() {
    if (prefersReduced || !isDesktop) return;

    var btns = document.querySelectorAll(".aiui-hero .btn");
    btns.forEach(function (btn) {
      btn.setAttribute("data-aiui-magnetic", "");
      var rect = null;
      var raf = 0;

      function onMove(e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var x = e.clientX - (rect.left + rect.width / 2);
        var y = e.clientY - (rect.top + rect.height / 2);
        // Magnet strength ~ 25% of cursor offset, capped
        var bx = Math.max(-14, Math.min(14, x * 0.25));
        var by = Math.max(-10, Math.min(10, y * 0.25));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          btn.style.setProperty("--aiui-bx", bx.toFixed(2));
          btn.style.setProperty("--aiui-by", by.toFixed(2));
        });
      }
      function onEnter() { rect = btn.getBoundingClientRect(); }
      function onLeave() {
        rect = null;
        cancelAnimationFrame(raf);
        btn.style.setProperty("--aiui-bx", "0");
        btn.style.setProperty("--aiui-by", "0");
      }

      btn.addEventListener("mouseenter", onEnter);
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
    });
  })();

  /* ---------- 3. Hero mouse parallax ---------- */
  (function initHeroParallax() {
    if (prefersReduced || !isDesktop) return;

    var heroes = document.querySelectorAll(".aiui-hero");
    heroes.forEach(function (hero) {
      var raf = 0;
      var rect = null;

      function onMove(e) {
        if (!rect) rect = hero.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;   // -1..1
        var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;   // -1..1
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          hero.style.setProperty("--aiui-mx", nx.toFixed(3));
          hero.style.setProperty("--aiui-my", ny.toFixed(3));
        });
      }
      function onEnter() { rect = hero.getBoundingClientRect(); }
      function onLeave() {
        rect = null;
        cancelAnimationFrame(raf);
        hero.style.setProperty("--aiui-mx", "0");
        hero.style.setProperty("--aiui-my", "0");
      }
      // Recompute rect on scroll/resize for accuracy
      window.addEventListener("resize", function () { rect = null; }, { passive: true });
      window.addEventListener("scroll", function () { rect = null; }, { passive: true });

      hero.addEventListener("mouseenter", onEnter);
      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseleave", onLeave);
    });
  })();

  /* ---------- 4. OGL shader background (lazy, desktop only) ---------- */
  (function initShader() {
    if (prefersReduced || !isDesktop) return;

    var slots = document.querySelectorAll(".aiui-hero[data-aiui-shader] .aiui-hero__shader");
    if (!slots.length) return;

    // Only mount when the hero is near the viewport
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        mountShader(entry.target);
      });
    }, { rootMargin: "200px" });

    slots.forEach(function (slot) { io.observe(slot); });

    function mountShader(slot) {
      // Read accent colors from CSS, with fallbacks
      var styles = getComputedStyle(html);
      var accent = parseHexColor(styles.getPropertyValue("--aiui-accent").trim() || "#b88a4a");
      var accent2 = parseHexColor(styles.getPropertyValue("--aiui-accent-2").trim() || "#f4d8a8");

      import("https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm").then(function (OGL) {
        var Renderer = OGL.Renderer, Program = OGL.Program, Mesh = OGL.Mesh, Triangle = OGL.Triangle;

        var renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
        var gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);

        slot.appendChild(gl.canvas);
        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        gl.canvas.style.display = "block";

        var geometry = new Triangle(gl);
        var program = new Program(gl, {
          vertex: "attribute vec2 position; varying vec2 vUv; void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }",
          fragment: [
            "precision highp float;",
            "varying vec2 vUv;",
            "uniform float uTime;",
            "uniform vec2 uMouse;",
            "uniform vec3 uColorA;",
            "uniform vec3 uColorB;",
            "vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453123);}",
            "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(dot(hash(i+vec2(0.,0.)),f-vec2(0.,0.)),dot(hash(i+vec2(1.,0.)),f-vec2(1.,0.)),u.x),mix(dot(hash(i+vec2(0.,1.)),f-vec2(0.,1.)),dot(hash(i+vec2(1.,1.)),f-vec2(1.,1.)),u.x),u.y);}",
            "void main(){",
            "  vec2 uv = vUv;",
            "  vec2 m = uMouse * 0.5;",
            "  float t = uTime * 0.06;",
            "  float n = 0.0;",
            "  n += 0.55 * noise(uv * 1.4 + vec2(t, -t) + m);",
            "  n += 0.30 * noise(uv * 2.9 - vec2(t * 1.3, t));",
            "  n += 0.15 * noise(uv * 5.5 + vec2(-t, t * 0.7));",
            "  n = smoothstep(-0.4, 0.9, n);",
            "  vec3 col = mix(uColorA, uColorB, n);",
            "  // Soft radial mask so edges fade into the bg image",
            "  float r = distance(uv, vec2(0.5, 0.55));",
            "  float mask = smoothstep(0.85, 0.15, r);",
            "  gl_FragColor = vec4(col, mask * 0.85);",
            "}"
          ].join("\n"),
          uniforms: {
            uTime:   { value: 0 },
            uMouse:  { value: [0, 0] },
            uColorA: { value: accent },
            uColorB: { value: accent2 },
          },
          transparent: true,
        });
        var mesh = new Mesh(gl, { geometry: geometry, program: program });

        function resize() {
          var w = slot.clientWidth, h = slot.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
        }
        resize();
        window.addEventListener("resize", resize);

        var hero = slot.closest(".aiui-hero");
        var rect = null;
        function onMouse(e) {
          if (!rect) rect = hero.getBoundingClientRect();
          var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
          program.uniforms.uMouse.value[0] = nx;
          program.uniforms.uMouse.value[1] = -ny;
        }
        if (hero) {
          hero.addEventListener("mousemove", onMouse);
          window.addEventListener("scroll", function () { rect = null; }, { passive: true });
        }

        var t0 = performance.now();
        var rafId = 0;
        var visible = true;
        document.addEventListener("visibilitychange", function () {
          visible = !document.hidden;
          if (visible) loop();
        });

        function loop() {
          if (!visible) { cancelAnimationFrame(rafId); return; }
          program.uniforms.uTime.value = (performance.now() - t0) / 1000;
          renderer.render({ scene: mesh });
          rafId = requestAnimationFrame(loop);
        }
        loop();

        // Reveal once first frame is up
        requestAnimationFrame(function () {
          if (hero) hero.classList.add("aiui-shader-ready");
        });
      }).catch(function () {
        // OGL failed to load — silent fallback to CSS-only hero
      });
    }

    function parseHexColor(hex) {
      hex = (hex || "").trim().replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
      if (hex.length !== 6) return [0.72, 0.54, 0.29];
      var n = parseInt(hex, 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
  })();

  /* ---------- 5. Reveal-on-scroll (auto-tag homepage sections) ----------
     We auto-attach .aiui-reveal to the rows we want to animate so we don't
     touch Liquid markup. Then a single IntersectionObserver toggles
     .aiui-inview when each row enters the viewport. */
  (function initReveal() {
    if (prefersReduced) return;

    // Selectors matching rows we want to animate in (homepage + collection)
    var revealSelectors = [
      ".cat-circles .cc-row",
      ".latest-blog .grid--blog",
      ".sec-ttl",
      ".grid--carousel",                                 // featured collection rows
      ".collection-list .grid",                          // collection list grids
      "[data-section-type='featured-collection'] .grid", // bestseller-type rows
      "#Collection .grid-products",                      // collection page grid
      "#Collection .filters-toolbar",                    // collection toolbar
      "#Collection .active-facets",                      // active filter chips
      "#Collection .sidebar.filterbar",                  // filter sidebar
    ];

    var nodes = [];
    revealSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains("aiui-reveal")) {
          el.classList.add("aiui-reveal");
          nodes.push(el);
        }
      });
    });

    if (!nodes.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("aiui-inview");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- 6. Subtle 3D tilt on product / blog cards (desktop) ---------- */
  (function initCardTilt() {
    if (prefersReduced || !isDesktop) return;

    var cards = document.querySelectorAll(".grid-view-item, .latest-blog .wrap-blog");
    cards.forEach(function (card) {
      card.style.transformStyle = "preserve-3d";
      var raf = 0;
      var rect = null;

      function onMove(e) {
        if (!rect) rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform =
            "translateY(-6px) perspective(900px) rotateX(" + (-y * 4).toFixed(2) +
            "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
        });
      }
      function onEnter() { rect = card.getBoundingClientRect(); }
      function onLeave() {
        rect = null;
        cancelAnimationFrame(raf);
        card.style.transform = "";
      }
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  })();

  /* ---------- 7. PDP enhancements ----------
     Targets the custom .hov-product-conversion section (the live PDP).
     Adds:
     - Quantity +/- stepper
     - Sticky bar reveal when main image scrolls out of view
     - Magnetic effect on primary buttons
     - "View in 3D" toggle that lazy-loads model-viewer */
  (function initPdp() {
    var pdp = document.querySelector(".aiui-pdp");
    if (!pdp) return;

    /* Quantity stepper */
    (function () {
      var qtyInput = pdp.querySelector(".hov-quantity-input");
      if (!qtyInput || qtyInput.closest(".aiui-qty-stepper")) return;

      var stepper = document.createElement("div");
      stepper.className = "aiui-qty-stepper";

      var minus = document.createElement("button");
      minus.type = "button"; minus.setAttribute("aria-label", "Decrease quantity");
      minus.textContent = "−";

      var plus = document.createElement("button");
      plus.type = "button"; plus.setAttribute("aria-label", "Increase quantity");
      plus.textContent = "+";

      qtyInput.parentNode.insertBefore(stepper, qtyInput);
      stepper.appendChild(minus);
      stepper.appendChild(qtyInput);
      stepper.appendChild(plus);

      function nudge(delta) {
        var min = parseInt(qtyInput.min || "1", 10);
        var v = parseInt(qtyInput.value || "1", 10) + delta;
        if (isNaN(v) || v < min) v = min;
        qtyInput.value = v;
        qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      minus.addEventListener("click", function () { nudge(-1); });
      plus.addEventListener("click", function () { nudge(1); });
    })();

    /* Sticky bar reveal — show when main image bottom passes the top of viewport */
    (function () {
      var mainImg = pdp.querySelector(".hov-main-image");
      var stickyBar = pdp.querySelector(".hov-sticky-bar");
      if (!mainImg || !stickyBar) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // Show sticky bar when the main image is mostly OUT of view
          if (!entry.isIntersecting) {
            pdp.classList.add("aiui-sticky-visible");
          } else {
            pdp.classList.remove("aiui-sticky-visible");
          }
        });
      }, { threshold: 0.1 });
      io.observe(mainImg);
    })();

    /* Magnetic on primary buttons */
    if (!prefersReduced && isDesktop) {
      pdp.querySelectorAll(".hov-btn-primary, .hov-btn-secondary, .hov-sticky-btn").forEach(function (btn) {
        var raf = 0, rect = null;
        function move(e) {
          if (!rect) rect = btn.getBoundingClientRect();
          var x = e.clientX - (rect.left + rect.width / 2);
          var y = e.clientY - (rect.top + rect.height / 2);
          var bx = Math.max(-8, Math.min(8, x * 0.18));
          var by = Math.max(-6, Math.min(6, y * 0.18));
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(function () {
            btn.style.transform = "translate3d(" + bx.toFixed(2) + "px," + by.toFixed(2) + "px,0)";
          });
        }
        btn.addEventListener("mouseenter", function () { rect = btn.getBoundingClientRect(); });
        btn.addEventListener("mousemove", move);
        btn.addEventListener("mouseleave", function () {
          rect = null; cancelAnimationFrame(raf); btn.style.transform = "";
        });
      });
    }

    /* 3D viewer lazy-load */
    (function () {
      var toggle = pdp.querySelector("[data-aiui-3d-toggle]");
      if (!toggle) return;
      var stage = pdp.querySelector(".aiui-3d-stage");
      var mount = pdp.querySelector(".aiui-3d-mount");
      if (!stage || !mount) return;

      var loaded = false;
      var label = toggle.querySelector(".aiui-3d-toggle-label");

      function ensureModelViewer() {
        if (window.customElements && window.customElements.get("model-viewer")) {
          return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.type = "module";
          s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      function buildViewer() {
        if (loaded) return;
        loaded = true;
        var mv = document.createElement("model-viewer");
        mv.setAttribute("src", mount.dataset.modelSrc || "");
        mv.setAttribute("alt", mount.dataset.alt || "");
        mv.setAttribute("poster", mount.dataset.poster || "");
        mv.setAttribute("camera-controls", "");
        mv.setAttribute("auto-rotate", "");
        mv.setAttribute("ar", "");
        mv.setAttribute("ar-modes", "webxr scene-viewer quick-look");
        mv.setAttribute("shadow-intensity", "1");
        mv.setAttribute("exposure", "1.05");
        mv.setAttribute("environment-image", "neutral");
        mv.setAttribute("loading", "eager");
        mv.style.width = "100%";
        mv.style.height = "100%";
        mount.appendChild(mv);
      }

      toggle.addEventListener("click", function () {
        var pressed = toggle.getAttribute("aria-pressed") === "true";
        if (pressed) {
          // Hide 3D, return to photo
          stage.classList.remove("aiui-on-view");
          stage.setAttribute("hidden", "");
          stage.setAttribute("aria-hidden", "true");
          pdp.classList.remove("aiui-3d-active");
          toggle.setAttribute("aria-pressed", "false");
          if (label) label.textContent = "View in 3D";
          return;
        }
        // Show 3D
        toggle.setAttribute("aria-pressed", "true");
        if (label) label.textContent = "Show photo";
        stage.removeAttribute("hidden");
        stage.setAttribute("aria-hidden", "false");
        pdp.classList.add("aiui-3d-active");

        ensureModelViewer().then(function () {
          buildViewer();
          requestAnimationFrame(function () { stage.classList.add("aiui-on-view"); });
        }).catch(function () {
          // Failed to load — gracefully revert
          stage.setAttribute("hidden", "");
          pdp.classList.remove("aiui-3d-active");
          toggle.setAttribute("aria-pressed", "false");
          if (label) label.textContent = "View in 3D";
        });
      });
    })();
  })();

  /* ---------- 8. Collection page enhancements ----------
     - Smooth-scroll the grid into view when sort/view changes
     - Brief shimmer overlay on the grid while filter changes commit */
  (function initCollection() {
    var collectionRoot = document.getElementById("Collection");
    if (!collectionRoot) return;

    var grid = collectionRoot.querySelector(".grid-products");
    var sortSelect = collectionRoot.querySelector(".filters-toolbar__input--sort");
    var viewBtns = collectionRoot.querySelectorAll(".filters-toolbar .change-view");

    function scrollToGridSoon() {
      if (!grid) return;
      // Run after the existing handlers have triggered the navigation
      requestAnimationFrame(function () {
        var top = grid.getBoundingClientRect().top + window.scrollY - 110;
        if (top > 0) window.scrollTo({ top: top, behavior: "smooth" });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", scrollToGridSoon);
    }
    viewBtns.forEach(function (btn) {
      btn.addEventListener("click", scrollToGridSoon);
    });
  })();

  /* ---------- 9. MutationObserver: catch lazy-rendered grids ----------
     Some sections (Shopify section-rendering-API, app injections) drop
     content in after first paint. Re-run the reveal tagger on changes. */
  (function watchLateContent() {
    if (prefersReduced) return;

    var debounceId = 0;
    var mo = new MutationObserver(function () {
      clearTimeout(debounceId);
      debounceId = setTimeout(function () {
        // Re-tag any new candidate rows
        var sels = [
          ".cat-circles .cc-row",
          ".latest-blog .grid--blog",
          ".grid--carousel",
          ".collection-list .grid"
        ];
        sels.forEach(function (sel) {
          document.querySelectorAll(sel + ":not(.aiui-reveal)").forEach(function (el) {
            el.classList.add("aiui-reveal", "aiui-inview");
          });
        });
      }, 200);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();
})();
