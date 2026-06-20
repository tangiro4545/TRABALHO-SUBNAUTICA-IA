/* ==========================================================================
   SUBNAUTICA WIKI — scroll.js
   Tudo relacionado ao progresso do mergulho conforme o usuário rola a
   página:
     • Interpolação contínua de profundidade / temperatura / cor da água
       (usada pelo HUD e pelo overlay de tint global) — combina GSAP
       ScrollTrigger (dispara o recálculo) com um loop requestAnimationFrame
       (suaviza os valores exibidos, para nunca "saltar").
     • Indicador de profundidade (sonar lateral).
     • Scroll-spy do menu lateral via IntersectionObserver.
     • Revelação das caixas wiki (glass) ao entrar em viewport.
   ========================================================================== */

(function () {
  'use strict';
  window.SW = window.SW || {};
  SW.State = SW.State || { depth: 0, biomeName: 'Superfície', tint: { r: 130, g: 210, b: 235 } };

  SW.Scroll = (function () {

    var checkpoints = [];
    var sectionEls = [];
    var sideMenuLinks = [];
    var depthTickEls = [];

    var displayed = { depth: 0, temp: 27, r: 130, g: 210, b: 235 };
    var target =    { depth: 0, temp: 27, r: 130, g: 210, b: 235, name: 'Superfície' };

    var elTint, elMarker, elReadoutValue;
    var resizeTimer;

    /* ---- checkpoints (um por bioma + superfície) ----------------------- */

    function buildCheckpoints() {
      checkpoints = [];

      var header = document.getElementById('superficie');
      if (header) {
        checkpoints.push({
          top: header.getBoundingClientRect().top + window.scrollY,
          depth: 0,
          temp: 27,
          color: SW.CONFIG.surfaceColor,
          name: 'Superfície'
        });
      }

      SW.CONFIG.biomes.forEach(function (b) {
        var el = document.getElementById(b.id);
        if (!el) return;
        checkpoints.push({
          top: el.getBoundingClientRect().top + window.scrollY,
          depth: b.depth,
          temp: b.temp,
          color: b.color,
          name: b.nome,
          id: b.id
        });
      });
    }

    function findSegment(y) {
      if (!checkpoints.length) return -1;
      if (y < checkpoints[0].top) return -1;
      for (var i = 0; i < checkpoints.length - 1; i++) {
        if (y >= checkpoints[i].top && y < checkpoints[i + 1].top) return i;
      }
      return checkpoints.length - 2; // depois do último checkpoint, mantém o último trecho
    }

    function updateTargets() {
      if (!checkpoints.length) return;
      var y = window.scrollY + window.innerHeight * 0.5;
      var segIndex = findSegment(y);

      if (segIndex < 0) {
        var c0 = checkpoints[0];
        target.depth = c0.depth;
        target.temp = c0.temp;
        target.r = c0.color.r; target.g = c0.color.g; target.b = c0.color.b;
        target.name = c0.name;
        return;
      }

      var a = checkpoints[segIndex];
      var b = checkpoints[segIndex + 1] || a;
      var span = Math.max(1, b.top - a.top);
      var t = SW.clamp((y - a.top) / span, 0, 1);

      target.depth = SW.lerp(a.depth, b.depth, t);
      target.temp = SW.lerp(a.temp, b.temp, t);
      target.r = SW.lerp(a.color.r, b.color.r, t);
      target.g = SW.lerp(a.color.g, b.color.g, t);
      target.b = SW.lerp(a.color.b, b.color.b, t);
      target.name = t < 0.5 ? a.name : b.name;
    }

    /* ---- indicador de profundidade (sonar) ------------------------------ */

    function buildDepthTicks() {
      var track = document.querySelector('.depth-track');
      if (!track) return;
      depthTickEls = Array.prototype.slice.call(track.querySelectorAll('.depth-tick'));
      depthTickEls.forEach(function (tick) {
        var v = parseFloat(tick.getAttribute('data-depth')) || 0;
        var pct = SW.clamp(v / 1700, 0, 1) * 100;
        tick.style.top = pct + '%';
      });
    }

    function updateActiveTicks(depth) {
      depthTickEls.forEach(function (tick) {
        var v = parseFloat(tick.getAttribute('data-depth')) || 0;
        tick.classList.toggle('active', depth >= v - 15);
      });
    }

    /* ---- scroll-spy do menu lateral (IntersectionObserver) ------------- */

    function initScrollSpy() {
      sectionEls = [];
      var header = document.getElementById('superficie');
      if (header) sectionEls.push(header);
      SW.CONFIG.biomes.forEach(function (b) {
        var el = document.getElementById(b.id);
        if (el) sectionEls.push(el);
      });

      sideMenuLinks = Array.prototype.slice.call(document.querySelectorAll('#side-menu a[data-target]'));
      if (!('IntersectionObserver' in window)) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          sideMenuLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-target') === id);
          });
        });
      }, { threshold: 0.5, rootMargin: '-10% 0px -10% 0px' });

      sectionEls.forEach(function (el) { observer.observe(el); });
    }

    /* ---- revelação das caixas wiki -------------------------------------- */

    function initWikiReveal() {
      var boxes = Array.prototype.slice.call(document.querySelectorAll('.wiki-box'));
      var hasGsap = !!(window.gsap && window.ScrollTrigger);

      boxes.forEach(function (box) {
        var children = Array.prototype.slice.call(
          box.querySelectorAll('.wiki-eyebrow, .wiki-title, .wiki-meta-row, .wiki-divider, .wiki-main, .wiki-infobox')
        );

        if (hasGsap) {
          gsap.set(children, { opacity: 0, y: 26 });
          ScrollTrigger.create({
            trigger: box,
            start: 'top 85%',
            onEnter: function () {
              box.classList.add('revealed');
              gsap.to(children, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.08 });
            },
            onEnterBack: function () {
              box.classList.add('revealed');
              gsap.to(children, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 });
            },
            onLeaveBack: function () {
              box.classList.remove('revealed');
              gsap.set(children, { opacity: 0, y: 26 });
            }
          });
        } else if ('IntersectionObserver' in window) {
          var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              box.classList.toggle('revealed', entry.isIntersecting);
            });
          }, { threshold: 0.18 });
          obs.observe(box);
        } else {
          box.classList.add('revealed');
        }
      });
    }

    /* ---- gatilho global (GSAP ScrollTrigger ou fallback) ---------------- */

    function initGlobalTrigger() {
      if (window.gsap && window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: updateTargets,
          onRefresh: updateTargets
        });
      } else {
        window.addEventListener('scroll', updateTargets, { passive: true });
      }
      updateTargets();
    }

    /* ---- loop de suavização (requestAnimationFrame) ---------------------- */

    function loop() {
      displayed.depth += (target.depth - displayed.depth) * 0.08;
      displayed.temp += (target.temp - displayed.temp) * 0.08;
      displayed.r += (target.r - displayed.r) * 0.06;
      displayed.g += (target.g - displayed.g) * 0.06;
      displayed.b += (target.b - displayed.b) * 0.06;

      // Estado compartilhado e somente-leitura para outros módulos
      // (particles.js usa a cor atual para tingir poeira/partículas sem
      // precisar conhecer os detalhes de checkpoints/scroll).
      SW.State.depth = displayed.depth;
      SW.State.biomeName = target.name;
      SW.State.tint = { r: displayed.r, g: displayed.g, b: displayed.b };

      if (SW.HUD) SW.HUD.setTarget(displayed.depth, displayed.temp, target.name);

      if (elTint) {
        var alpha = 0.16 + 0.22 * SW.clamp(displayed.depth / 1700, 0, 1);
        elTint.style.backgroundColor =
          'rgba(' + Math.round(displayed.r) + ',' + Math.round(displayed.g) + ',' + Math.round(displayed.b) + ',' + alpha.toFixed(2) + ')';
      }

      var pct = SW.clamp(displayed.depth / 1700, 0, 1) * 100;
      if (elMarker) elMarker.style.top = pct + '%';
      if (elReadoutValue) elReadoutValue.textContent = Math.round(displayed.depth);

      updateActiveTicks(displayed.depth);

      requestAnimationFrame(loop);
    }

    /* ---- resize ----------------------------------------------------------- */

    function onResize() {
      buildCheckpoints();
      buildDepthTicks();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      updateTargets();
    }

    function onResizeDebounced() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 220);
    }

    /* ---- init --------------------------------------------------------------- */

    function init() {
      elTint = document.getElementById('depth-tint-overlay');
      elMarker = document.getElementById('depth-marker');
      elReadoutValue = document.getElementById('depth-indicator-value');

      buildCheckpoints();
      buildDepthTicks();
      initScrollSpy();
      initWikiReveal();
      initGlobalTrigger();

      window.addEventListener('resize', onResizeDebounced, { passive: true });
      window.addEventListener('load', onResizeDebounced);

      requestAnimationFrame(loop);
    }

    return { init: init };
  })();
})();
