/* ==========================================================================
   SUBNAUTICA WIKI — main.js
   Núcleo da aplicação. Define o namespace global SW (SubnauticaWiki),
   a configuração central de cada bioma, o gerenciador de áudio, o HUD
   (PDA) e o ponto de entrada que inicializa todos os outros módulos
   (cursor.js, parallax.js, particles.js, fishes.js, scroll.js).

   IMPORTANTE: este arquivo carrega PRIMEIRO (na ordem dos <script defer>),
   mas como todos os scripts usam "defer", eles executam em ordem e o
   DOMContentLoaded só dispara depois que TODOS já rodaram — por isso é
   seguro registrar aqui o callback de inicialização que chama métodos
   definidos nos outros arquivos (SW.Cursor, SW.Fishes, SW.Scroll, etc.).
   ========================================================================== */

(function () {
  'use strict';

  /* Namespace global único do projeto. Tudo que os módulos precisam
     compartilhar entre arquivos vive aqui dentro. */
  window.SW = window.SW || {};

  /* ------------------------------------------------------------------------
     1. CONFIGURAÇÃO CENTRAL DOS BIOMAS
     Cada objeto descreve um "estágio" do mergulho: profundidade, temperatura,
     cor de água (usada no tint global de profundidade) e arquivo de áudio
     ambiente. A ordem do array é a ordem real de mergulho (topo -> fundo).
     ------------------------------------------------------------------------ */
  SW.CONFIG = {
    // Cor de água no topo (superfície) — ponto de partida da interpolação
    surfaceColor: { r: 130, g: 210, b: 235 },

    biomes: [
      {
        id: 'aguas-rasas',
        nome: 'Águas Rasas',
        depth: 30,
        temp: 23,
        color: { r: 25, g: 150, b: 175 },
        audio: 'aguas-rasas'
      },
      {
        id: 'floresta-de-algas',
        nome: 'Floresta de Algas',
        depth: 90,
        temp: 19,
        color: { r: 18, g: 95, b: 70 },
        audio: 'floresta-de-algas'
      },
      {
        id: 'planaltos-gramados',
        nome: 'Planaltos Gramados',
        depth: 150,
        temp: 17,
        color: { r: 24, g: 80, b: 110 },
        audio: 'planaltos-gramados'
      },
      {
        id: 'floresta-de-cogumelos',
        nome: 'Floresta de Cogumelos',
        depth: 250,
        temp: 15,
        color: { r: 14, g: 70, b: 80 },
        audio: 'floresta-de-cogumelos'
      },
      {
        id: 'zona-de-algas-sanguineas',
        nome: 'Zona de Algas Sanguíneas',
        depth: 400,
        temp: 9,
        color: { r: 9, g: 18, b: 48 },
        audio: 'zona-de-algas-sanguineas'
      },
      {
        id: 'rio-perdido',
        nome: 'Rio Perdido',
        depth: 600,
        temp: 21,
        color: { r: 22, g: 32, b: 20 },
        audio: 'rio-perdido'
      },
      {
        id: 'zona-de-lava-inativa',
        nome: 'Zona de Lava Inativa',
        depth: 860,
        temp: 48,
        color: { r: 38, g: 28, b: 16 },
        audio: 'zona-de-lava-inativa'
      },
      {
        id: 'lagos-de-lava',
        nome: 'Lagos de Lava',
        depth: 1300,
        temp: 92,
        color: { r: 92, g: 30, b: 10 },
        audio: 'lagos-de-lava'
      },
      {
        id: 'instalacao-de-contencao-primaria',
        nome: 'Instalação de Contenção Primária',
        depth: 1700,
        temp: 30,
        color: { r: 16, g: 48, b: 44 },
        audio: 'instalacao-de-contencao-primaria'
      }
    ],

    // Marcas fixas exibidas no indicador de profundidade (sonar lateral)
    depthTicks: [0, 50, 100, 200, 500, 900, 1300, 1700]
  };

  /* Utilidade simples de interpolação linear, usada por quase todos os
     módulos (parallax de cor, HUD, indicador de profundidade). */
  SW.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  SW.clamp = function (v, min, max) {
    return Math.max(min, Math.min(max, v));
  };

  /* ------------------------------------------------------------------------
     2. GERENCIADOR DE ÁUDIO AMBIENTE
     Cada bioma tem sua própria faixa de áudio. A troca é feita com fade
     suave (fade-out da faixa atual + fade-in da nova) via requestAnimationFrame,
     nunca corte abrupto. O áudio só inicia depois de interação do usuário
     (política padrão dos navegadores contra autoplay com som).
     ------------------------------------------------------------------------ */
  SW.Audio = (function () {
    var tracks = {};
    var currentId = null;
    var unlocked = false;
    var muted = false;
    var fadeHandles = {};

    function buildTrackList() {
      var ids = ['superficie'].concat(SW.CONFIG.biomes.map(function (b) { return b.audio; }));
      ids.forEach(function (id) {
        var el = document.getElementById('audio-' + id);
        if (el) {
          el.volume = 0;
          tracks[id] = el;
        }
      });
    }

    function fade(el, to, duration, done) {
      if (!el) { if (done) done(); return; }
      var id = el.id;
      if (fadeHandles[id]) cancelAnimationFrame(fadeHandles[id]);
      var start = el.volume;
      var startTime = performance.now();

      function step(now) {
        var t = SW.clamp((now - startTime) / duration, 0, 1);
        el.volume = SW.lerp(start, to, t);
        if (t < 1) {
          fadeHandles[id] = requestAnimationFrame(step);
        } else {
          if (to === 0) { try { el.pause(); } catch (e) {} }
          if (done) done();
        }
      }
      fadeHandles[id] = requestAnimationFrame(step);
    }

    function play(id) {
      if (!unlocked || muted) return;
      var el = tracks[id];
      if (!el) return;
      var p = el.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado — ignora silenciosamente */ });
      fade(el, 0.55, 1400);
    }

    function setActive(id) {
      if (id === currentId) return;
      var prevId = currentId;
      currentId = id;
      if (prevId && tracks[prevId]) fade(tracks[prevId], 0, 1200);
      if (unlocked && !muted) play(id);
    }

    function unlock() {
      if (unlocked) return;
      unlocked = true;
      if (currentId) play(currentId);
    }

    function toggleMute() {
      muted = !muted;
      if (muted) {
        Object.keys(tracks).forEach(function (id) { fade(tracks[id], 0, 500); });
      } else {
        unlock();
        if (currentId) play(currentId);
      }
      return muted;
    }

    function init() {
      buildTrackList();
      currentId = 'superficie';
      // Primeira interação do usuário (clique, toque ou tecla) libera áudio
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
        window.addEventListener(evt, unlock, { once: true, passive: true });
      });
    }

    return { init: init, setActive: setActive, toggleMute: toggleMute, isMuted: function () { return muted; } };
  })();

  /* ------------------------------------------------------------------------
     3. HUD — PDA (profundidade, temperatura, bioma, oxigênio)
     Os valores são atualizados pelo scroll.js a cada frame de scroll, mas
     a animação de "respiração" do oxigênio roda continuamente aqui,
     independente do scroll, para dar sensação de vida ao HUD.
     ------------------------------------------------------------------------ */
  SW.HUD = (function () {
    var elDepth, elTemp, elBiome, elO2Fill, elO2Value;
    var displayedDepth = 0;
    var displayedTemp = 26;
    var o2Phase = 0;
    var rafHandle = null;

    function cacheElements() {
      elDepth = document.getElementById('hud-depth');
      elTemp = document.getElementById('hud-temp');
      elBiome = document.getElementById('hud-biome');
      elO2Fill = document.getElementById('hud-o2-fill');
      elO2Value = document.getElementById('hud-o2-value');
    }

    /* Chamado pelo scroll.js com os valores-alvo (profundidade/temperatura
       contínuas, calculadas por interpolação entre biomas) */
    function setTarget(depth, temp, biomeName) {
      displayedDepth = depth;
      displayedTemp = temp;
      if (elBiome && elBiome.textContent !== biomeName) {
        elBiome.textContent = biomeName;
      }
    }

    function loop(now) {
      if (elDepth) elDepth.innerHTML = Math.round(displayedDepth) + '<small>m</small>';
      if (elTemp) {
        var tempRounded = Math.round(displayedTemp);
        elTemp.innerHTML = tempRounded + '<small>°C</small>';
        elTemp.classList.toggle('warn', tempRounded >= 45);
      }
      // Oxigênio "respira" entre 88% e 100% — puramente estético/imersivo
      o2Phase += 0.018;
      var o2 = 94 + Math.sin(o2Phase) * 5;
      if (elO2Fill) elO2Fill.style.width = o2.toFixed(0) + '%';
      if (elO2Value) elO2Value.textContent = o2.toFixed(0) + '%';
      rafHandle = requestAnimationFrame(loop);
    }

    function init() {
      cacheElements();
      rafHandle = requestAnimationFrame(loop);
    }

    return { init: init, setTarget: setTarget };
  })();

  /* ------------------------------------------------------------------------
     4. CONTROLES DE INTERFACE (menu mobile, botão topo, botão áudio)
     ------------------------------------------------------------------------ */
  SW.UI = (function () {
    function initMobileMenu() {
      var menu = document.getElementById('side-menu');
      var toggle = document.getElementById('menu-toggle');
      if (!menu || !toggle) return;
      toggle.addEventListener('click', function () {
        menu.classList.toggle('menu-open');
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { menu.classList.remove('menu-open'); });
      });
    }

    function initBackToTop() {
      var btn = document.getElementById('back-to-top');
      if (!btn) return;
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      window.addEventListener('scroll', function () {
        btn.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
      }, { passive: true });
    }

    function initAudioToggle() {
      var btn = document.getElementById('audio-toggle');
      if (!btn) return;
      function paint(muted) { btn.textContent = muted ? '🔇' : '🔊'; }
      paint(true);
      btn.addEventListener('click', function () {
        var muted = SW.Audio.toggleMute();
        paint(muted);
      });
    }

    function detectTouch() {
      var isTouch = window.matchMedia('(pointer: coarse)').matches;
      document.body.classList.toggle('touch-device', isTouch);
    }

    function initDiveCta() {
      var cta = document.getElementById('dive-cta');
      var firstBiome = document.querySelector('.biome-section');
      if (!cta || !firstBiome) return;
      cta.addEventListener('click', function () {
        firstBiome.scrollIntoView({ behavior: 'smooth' });
      });
    }

    function init() {
      detectTouch();
      initMobileMenu();
      initBackToTop();
      initAudioToggle();
      initDiveCta();
    }

    return { init: init };
  })();

  /* ------------------------------------------------------------------------
     5. PONTO DE ENTRADA
     Inicializa todos os módulos na ordem correta. Cada módulo é defensivo
     (verifica sua própria existência) para que a ausência de um deles
     nunca quebre os demais.
     ------------------------------------------------------------------------ */
  function bootstrap() {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    SW.Audio.init();
    SW.HUD.init();
    SW.UI.init();

    if (SW.Cursor) SW.Cursor.init();
    if (SW.Parallax) SW.Parallax.init();
    if (SW.Particles) SW.Particles.init();
    if (SW.Fishes) SW.Fishes.init();
    if (SW.Scroll) SW.Scroll.init();

    document.body.classList.add('sw-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
