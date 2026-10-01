/* ============================================================
   PORTFOLIO GABRIELA CANAVERO — animaciones
   Tres cosas hacen todo el trabajo:
     1. entrada del hero
     2. reveal de cada sección al scrollear
     3. el ticker de resultados (los números que cuentan hasta su valor)
   ============================================================ */

(function () {
  "use strict";

  // ---------- Año en el footer ----------
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Barra de progreso de scroll ----------
  var bar = document.getElementById("progressBar");
  if (bar) {
    var updateBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();
  }

  /* --------------------------------------------------------
     Nav: el subrayado sigue a la sección visible
     Gana la sección que ocupa el centro de la pantalla. El
     hover es independiente, así que no se pisan.
     -------------------------------------------------------- */
  (function () {
    var nav = document.querySelector("[data-scrollspy]");
    if (!nav || typeof IntersectionObserver === "undefined") return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var porId = {};
    var secciones = [];

    links.forEach(function (a) {
      var el = document.querySelector(a.getAttribute("href"));
      if (el && el.id) { porId[el.id] = a; secciones.push(el); }
    });
    if (!secciones.length) return;

    var visible = {};
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });

      var ganador = null, mejor = 0;
      secciones.forEach(function (s) {
        if ((visible[s.id] || 0) > mejor) { mejor = visible[s.id]; ganador = s.id; }
      });

      links.forEach(function (a) {
        a.classList.toggle("is-active", ganador !== null && porId[ganador] === a);
      });
    }, {
      rootMargin: "-45% 0px -45% 0px",   // la franja activa es el centro
      threshold: [0, .25, .5, .75, 1]
    });

    secciones.forEach(function (s) { obs.observe(s); });
  })();

  /* --------------------------------------------------------
     Cinta de marcas: si falta el PNG, dejamos el nombre en
     texto en vez de un ícono roto.
     -------------------------------------------------------- */
  (function () {
    var logos = document.querySelectorAll(".brands__item img");
    logos.forEach(function (img) {
      var aTexto = function () {
        var s = document.createElement("span");
        s.className = "brands__name";
        s.textContent = img.dataset.name || img.alt;
        if (!img.alt) s.setAttribute("aria-hidden", "true");
        if (img.parentNode) img.parentNode.replaceChild(s, img);
      };
      img.addEventListener("error", aTexto);
      if (img.complete && img.naturalWidth === 0) aTexto();
    });
  })();

  // ---------- ¿Animamos? ----------
  // No animamos si el sistema pide menos movimiento o si GSAP no cargó.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* --------------------------------------------------------
     Ticker de resultados
     Toma cada <span class="metric__value" data-value="8">
     y lo cuenta desde 0. Respeta data-prefix, data-suffix y
     data-decimals. Los "pendiente" no tienen data-value, así
     que quedan intactos.
     -------------------------------------------------------- */
  function renderMetric(el, current) {
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    el.textContent = prefix + current.toFixed(decimals) + suffix;
  }

  function fillMetricsInstantly(scope) {
    var metrics = (scope || document).querySelectorAll(".metric__value[data-value]");
    metrics.forEach(function (el) {
      renderMetric(el, parseFloat(el.dataset.value));
    });
  }

  function animateMetrics(card) {
    var metrics = card.querySelectorAll(".metric__value[data-value]");
    metrics.forEach(function (el, i) {
      var target = parseFloat(el.dataset.value);
      var counter = { n: 0 };
      window.gsap.to(counter, {
        n: target,
        duration: 1.1,
        delay: i * 0.12,          // suman de a uno, como un total de carrito
        ease: "power2.out",
        onUpdate: function () { renderMetric(el, counter.n); }
      });
    });
  }

  // ---------- Camino sin animación ----------
  if (reduceMotion || !hasGSAP) {
    document.querySelectorAll(".js-hero, .reveal > *").forEach(function (el) {
      el.style.opacity = 1;
    });
    fillMetricsInstantly();
    return;
  }

  // A partir de acá sí animamos: el CSS esconde los elementos.
  document.documentElement.classList.add("js-anim");
  window.gsap.registerPlugin(window.ScrollTrigger);

  // ---------- 1. Entrada del hero ----------
  var heroItems = document.querySelectorAll(".js-hero");
  window.gsap.set(heroItems, { opacity: 0, y: 22 });
  window.gsap.to(heroItems, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.11,
    delay: 0.15
  });

  // ---------- 2. Reveal de secciones ----------
  document.querySelectorAll(".reveal").forEach(function (section) {
    var kids = section.children.length === 1
      ? section.firstElementChild.children   // grillas: animamos las columnas
      : section.children;

    // El contenedor intermedio (la grilla) tiene que quedar visible:
    // el CSS lo esconde y quien se anima son sus hijos.
    window.gsap.set(section.children, { opacity: 1 });
    window.gsap.set(kids, { opacity: 0, y: 28 });
    window.gsap.to(kids, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        once: true
      }
    });
  });

  // ---------- 3. Ticker: se dispara al entrar cada tarjeta ----------
  document.querySelectorAll(".receipt, .total").forEach(function (card) {
    window.ScrollTrigger.create({
      trigger: card,
      start: "top 82%",
      once: true,
      onEnter: function () { animateMetrics(card); }
    });
  });

  // Si alguna tarjeta ya está visible al cargar, no esperamos al scroll.
  window.ScrollTrigger.refresh();
})();
