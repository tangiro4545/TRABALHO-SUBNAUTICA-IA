/* ==========================================================================
   SUBNAUTICA WIKI — particles.js
   Sistema global de partículas desenhado em <canvas> (bolhas subindo +
   poeira/partículas em suspensão, tingidas pela cor atual da água) e um
   efeito pontual de cáustica na superfície usando Three.js — o único
   lugar do projeto onde Three.js é realmente necessário, exatamente como
   pedido ("Three.js apenas quando necessário"). Tudo é protegido por
   try/catch e feature-detection: se o WebGL não estiver disponível, o
   restante do site continua funcionando normalmente.
   ========================================================================== */

(function () {
  'use strict';
  window.SW = window.SW || {};

  SW.Particles = (function () {

    var canvas, ctx, W, H, dpr;
    var bubbles = [];
    var motes = [];
    var rafHandle = null;
    var lastTime = 0;
    var reduceMotion = false;
    var isMobile = false;
    var resizeTimer;

    var MAX_BUBBLES = 46;
    var MAX_MOTES = 70;

    function rand(a, b) { return a + Math.random() * (b - a); }

    /* ---- canvas ----------------------------------------------------------- */

    function resizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onResizeDebounced() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 200);
    }

    /* ---- partículas --------------------------------------------------------- */

    function newBubble() {
      return {
        x: rand(0, W),
        y: H + rand(0, 90),
        r: rand(1.3, 5.4),
        speed: rand(16, 44),
        wobble: rand(0.5, 1.6),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.22, 0.6)
      };
    }

    function newMote() {
      return {
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.6, 2.1),
        vx: rand(-4, 4),
        vy: rand(-3, 3),
        alpha: rand(0.08, 0.34)
      };
    }

    function fillPools() {
      var bCount = isMobile ? Math.round(MAX_BUBBLES * 0.45) : MAX_BUBBLES;
      var mCount = isMobile ? Math.round(MAX_MOTES * 0.45) : MAX_MOTES;
      bubbles = [];
      for (var i = 0; i < bCount; i++) bubbles.push(newBubble());
      motes = [];
      for (var j = 0; j < mCount; j++) motes.push(newMote());
    }

    function currentTint() {
      if (SW.State && SW.State.tint) return SW.State.tint;
      return { r: 120, g: 200, b: 220 };
    }

    function step(now) {
      var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      ctx.clearRect(0, 0, W, H);

      var tint = currentTint();
      var moteColor = 'rgba(' + Math.round(tint.r) + ',' + Math.round(tint.g) + ',' + Math.round(tint.b) + ',';

      // Bolhas subindo, com leve oscilação lateral e brilho especular
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.y -= b.speed * dt;
        b.x += Math.sin(now * 0.001 * b.wobble + b.phase) * 0.6;
        if (b.y < -12) {
          var fresh = newBubble();
          fresh.y = H + rand(10, 70);
          bubbles[i] = fresh;
          b = fresh;
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + b.alpha.toFixed(2) + ')';
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Poeira/partículas em suspensão, tingidas pela cor atual da água
      for (var k = 0; k < motes.length; k++) {
        var m = motes[k];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x < 0) m.x = W; if (m.x > W) m.x = 0;
        if (m.y < 0) m.y = H; if (m.y > H) m.y = 0;
        ctx.beginPath();
        ctx.fillStyle = moteColor + m.alpha.toFixed(2) + ')';
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafHandle = requestAnimationFrame(step);
    }

    /* ------------------------------------------------------------------------
       CÁUSTICA DE SUPERFÍCIE — Three.js
       Um único plano com shader simples simulando o tremular da luz do sol
       filtrada pela água. Roda só enquanto a superfície está visível
       (pausado via IntersectionObserver) e nunca impede o resto do site de
       funcionar caso WebGL falhe.
       ------------------------------------------------------------------------ */
    function initCaustics() {
      if (!window.THREE) return;
      var mount = document.querySelector('#superficie .surface-sky');
      if (!mount) return;

      try {
        var width = mount.clientWidth || window.innerWidth;
        var height = mount.clientHeight || window.innerHeight;

        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.domElement.style.cssText =
          'position:absolute; inset:0; width:100%; height:100%; mix-blend-mode:screen; opacity:0.32; pointer-events:none;';
        mount.appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        var geometry = new THREE.PlaneGeometry(2, 2);
        var material = new THREE.ShaderMaterial({
          transparent: true,
          uniforms: { uTime: { value: 0 } },
          vertexShader:
            'varying vec2 vUv;' +
            'void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }',
          fragmentShader:
            'precision mediump float;' +
            'varying vec2 vUv;' +
            'uniform float uTime;' +
            'void main(){' +
            '  vec2 uv = vUv * 8.0;' +
            '  float t = uTime * 0.35;' +
            '  float c = sin(uv.x + t) + sin(uv.y * 1.3 - t * 1.2) + sin((uv.x + uv.y) * 0.7 + t * 0.6);' +
            '  c = smoothstep(0.6, 1.9, c);' +
            '  vec3 col = vec3(0.75, 0.95, 1.0) * c;' +
            '  gl_FragColor = vec4(col, c * 0.55 * (1.0 - vUv.y));' +
            '}'
        });

        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        var clock = new THREE.Clock();
        var running = true;

        function renderLoop() {
          if (!running) return;
          material.uniforms.uTime.value = clock.getElapsedTime();
          renderer.render(scene, camera);
          requestAnimationFrame(renderLoop);
        }
        renderLoop();

        if ('IntersectionObserver' in window) {
          var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              var wasRunning = running;
              running = entry.isIntersecting;
              if (running && !wasRunning) renderLoop();
            });
          }, { threshold: 0 });
          obs.observe(mount);
        }

        window.addEventListener('resize', function () {
          var w = mount.clientWidth || window.innerWidth;
          var h = mount.clientHeight || window.innerHeight;
          renderer.setSize(w, h);
        }, { passive: true });

      } catch (err) {
        // Sem WebGL ou qualquer outra falha: a cáustica simplesmente não
        // aparece. O cabeçalho ainda funciona perfeitamente sem ela.
        if (window.console) console.warn('[SubnauticaWiki] Cáustica (Three.js) desativada:', err);
      }
    }

    /* ---- init --------------------------------------------------------------- */

    function init() {
      canvas = document.getElementById('fx-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return;

      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      isMobile = window.matchMedia('(max-width: 640px)').matches;

      resizeCanvas();
      fillPools();

      window.addEventListener('resize', onResizeDebounced, { passive: true });

      if (!reduceMotion) {
        lastTime = performance.now();
        rafHandle = requestAnimationFrame(step);
        initCaustics();
      }
    }

    return { init: init };
  })();
})();
