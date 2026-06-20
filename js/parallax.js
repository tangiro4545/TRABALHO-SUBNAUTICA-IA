/* ==========================================================================
   SUBNAUTICA WIKI — parallax.js
   Gera os elementos decorativos da superfície (nuvens, skyrays, partículas
   de água) e controla o parallax de scroll: cada camada se move a uma
   velocidade diferente conforme o usuário rola, dando sensação real de
   profundidade. Também adiciona os raios de luz (god rays) que atravessam
   cada bioma.

   IMPORTANTE sobre Skyrays: o usuário forneceu embeds Sketchfab para todas
   as criaturas SUBAQUÁTICAS da lista, mas não para o Skyray (criatura que
   voa sobre a superfície). Para não violar a regra de "nunca usar
   placeholders" nos modelos 3D — e como não existe um embed real fornecido
   para este caso — o Skyray é representado aqui por uma silhueta SVG leve,
   não por um substituto de modelo 3D.
   ========================================================================== */

(function () {
  'use strict';
  window.SW = window.SW || {};

  SW.Parallax = (function () {

    var isMobile = false;

    /* ---- nuvens ---------------------------------------------------------- */

    function spawnClouds() {
      var layer = document.querySelector('.clouds-layer');
      if (!layer) return;
      var n = isMobile ? 3 : 6;

      for (var i = 0; i < n; i++) {
        var c = document.createElement('div');
        c.className = 'cloud';
        var top = 4 + Math.random() * 20;
        var left = Math.random() * 100;
        var scale = 0.55 + Math.random() * 0.9;
        c.style.top = top + '%';
        c.style.left = left + '%';
        c.style.opacity = (0.45 + Math.random() * 0.4).toFixed(2);
        c.style.transform = 'scale(' + scale.toFixed(2) + ')';
        layer.appendChild(c);

        if (window.gsap) {
          gsap.to(c, {
            x: '+=' + (90 + Math.random() * 120),
            duration: 26 + Math.random() * 24,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 6
          });
        } else {
          c.style.animation = 'cloudDrift ' + (24 + Math.random() * 16) + 's ease-in-out infinite alternate';
        }
      }
    }

    /* ---- skyrays (silhueta SVG — ver nota no topo do arquivo) ------------ */

    function skyraySVG() {
      return (
        '<svg viewBox="0 0 70 34" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">' +
        '<path d="M35 4 C20 4 4 16 0 19 C4 22 20 32 35 30 C50 32 66 22 70 19 C66 16 50 4 35 4 Z" fill="rgba(18,32,38,0.55)"/>' +
        '<path d="M35 9 C26 10 15 16 9 19 C15 22 26 27 35 26" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>' +
        '</svg>'
      );
    }

    function spawnSkyrays() {
      var layer = document.querySelector('.skyray-layer');
      if (!layer) return;
      var n = isMobile ? 1 : 3;

      for (var i = 0; i < n; i++) {
        var wrap = document.createElement('div');
        wrap.className = 'skyray';
        wrap.style.top = (8 + Math.random() * 16) + '%';
        wrap.style.left = (-12 - Math.random() * 18) + '%';
        wrap.innerHTML = skyraySVG();
        wrap.style.animation = 'skyrayFlap ' + (1.6 + Math.random() * 0.8) + 's ease-in-out infinite';
        layer.appendChild(wrap);
        animateSkyrayFlight(wrap, i);
      }
    }

    function animateSkyrayFlight(el, index) {
      var distance = window.innerWidth * 1.3;
      var duration = 22 + Math.random() * 16;

      if (window.gsap) {
        var tl = gsap.timeline({ repeat: -1, delay: index * 4 });
        tl.to(el, { x: distance, duration: duration, ease: 'sine.inOut' });
        tl.set(el, { x: 0 });
        gsap.to(el, { y: '+=16', duration: 2.2 + Math.random(), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      } else {
        el.style.transition = 'transform ' + duration + 's linear';
        requestAnimationFrame(function () { el.style.transform = 'translateX(' + distance + 'px)'; });
      }
    }

    /* ---- partículas de água da superfície -------------------------------- */

    function spawnWaterSpecks() {
      var layer = document.querySelector('.surface-water-particles');
      if (!layer) return;
      var n = isMobile ? 12 : 28;

      for (var i = 0; i < n; i++) {
        var s = document.createElement('span');
        s.className = 'water-speck';
        var left = Math.random() * 100;
        var top = 38 + Math.random() * 58;
        var dur = 6 + Math.random() * 9;
        var delay = -(Math.random() * dur);
        var dx = (Math.random() * 40 - 20).toFixed(0) + 'px';
        var dy = (-(40 + Math.random() * 70)).toFixed(0) + 'px';
        s.style.left = left + '%';
        s.style.top = top + '%';
        s.style.setProperty('--dx', dx);
        s.style.setProperty('--dy', dy);
        s.style.animationDuration = dur + 's';
        s.style.animationDelay = delay + 's';
        layer.appendChild(s);
      }
    }

    /* ---- god rays / luz volumétrica em cada bioma ------------------------- */

    function spawnGodRays() {
      var sections = document.querySelectorAll('.biome-section:not(.surface-section)');
      sections.forEach(function (section) {
        var fogOuter = section.querySelector('.biome-fog-outer');
        if (!fogOuter) return;

        var wrap = document.createElement('div');
        wrap.className = 'godray-wrap';
        wrap.style.cssText = 'position:absolute; inset:0; overflow:hidden; pointer-events:none; mix-blend-mode:screen;';

        var count = isMobile ? 2 : 3;
        for (var i = 0; i < count; i++) {
          var ray = document.createElement('div');
          var left = 8 + i * 32 + Math.random() * 14;
          var width = 50 + Math.random() * 70;
          var rot = -10 + Math.random() * 20;
          ray.style.cssText =
            'position:absolute; top:-25%; left:' + left + '%; width:' + width + 'px; height:160%;' +
            'background:linear-gradient(to bottom, rgba(255,255,255,0.20), transparent 72%);' +
            'transform:rotate(' + rot.toFixed(1) + 'deg); filter:blur(7px); opacity:0.55;';
          wrap.appendChild(ray);

          if (window.gsap) {
            gsap.to(ray, {
              opacity: 0.25,
              duration: 4 + Math.random() * 3,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: Math.random() * 3
            });
          }
        }
        fogOuter.appendChild(wrap);
      });
    }

    /* ---- parallax de scroll: superfície ----------------------------------- */

    function initHeaderParallax() {
      var header = document.getElementById('superficie');
      if (!header) return;

      var aurora = header.querySelector('.aurora-glow');
      var clouds = header.querySelector('.clouds-layer');
      var skyrays = header.querySelector('.skyray-layer');
      var bg = header.querySelector('.surface-bg');

      if (window.gsap && window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: header,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function (self) {
            var p = self.progress;
            if (bg) bg.style.transform = 'translate3d(0,' + (p * 70).toFixed(1) + 'px,0)';
            if (aurora) aurora.style.transform = 'translate3d(0,' + (p * 34).toFixed(1) + 'px,0)';
            if (clouds) clouds.style.transform = 'translate3d(0,' + (p * 20).toFixed(1) + 'px,0)';
            if (skyrays) skyrays.style.transform = 'translate3d(0,' + (p * 12).toFixed(1) + 'px,0)';
          }
        });
      }
    }

    /* ---- parallax de scroll: névoa de cada bioma --------------------------- */

    function initBiomeFogParallax() {
      var outers = document.querySelectorAll('.biome-fog-outer');
      outers.forEach(function (outer) {
        var section = outer.closest('.biome-section');
        if (!section || !(window.gsap && window.ScrollTrigger)) return;

        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: function (self) {
            var range = 46;
            var y = SW.lerp(-range, range, self.progress);
            outer.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
          }
        });
      });
    }

    /* ---- init --------------------------------------------------------------- */

    function init() {
      isMobile = window.matchMedia('(max-width: 640px)').matches;

      spawnClouds();
      spawnSkyrays();
      spawnWaterSpecks();
      spawnGodRays();
      initHeaderParallax();
      initBiomeFogParallax();
    }

    return { init: init };
  })();
})();
