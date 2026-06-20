/* ==========================================================================
   SUBNAUTICA WIKI — cursor.js
   Cursor customizado: substitui o cursor nativo por um modelo 3D do
   Sketchfab (Seamoth no início, trocando para o Traje Camarão / Prawn Suit
   ao alcançar a Floresta de Cogumelos). Segue o mouse com easing + inércia
   e gira suavemente conforme a direção do movimento.
   ========================================================================== */

(function () {
  'use strict';

  window.SW = window.SW || {};

  /* Embeds Sketchfab EXATOS — URLs e créditos nunca são alterados. */
  var SEAMOTH_EMBED =
    '<div class="sketchfab-embed-wrapper"> <iframe title="The Seamoth" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/76047662c69047fab00a3ec0313381c7/embed?camera=0"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/the-seamoth-76047662c69047fab00a3ec0313381c7?utm_medium=embed&utm_campaign=share-popup&utm_content=76047662c69047fab00a3ec0313381c7" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> The Seamoth </a> by <a href="https://sketchfab.com/nordestewind?utm_medium=embed&utm_campaign=share-popup&utm_content=76047662c69047fab00a3ec0313381c7" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> nordestewind </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=76047662c69047fab00a3ec0313381c7" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>';

  var PRAWN_EMBED =
    '<div class="sketchfab-embed-wrapper"> <iframe title="Exosuit Arm Torpedo Launcher" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/d7ed7aca1b9f4028a87afd6df54f8394/embed?camera=0"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/exosuit-arm-torpedo-launcher-d7ed7aca1b9f4028a87afd6df54f8394?utm_medium=embed&utm_campaign=share-popup&utm_content=d7ed7aca1b9f4028a87afd6df54f8394" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Exosuit Arm Torpedo Launcher </a> by <a href="https://sketchfab.com/fox3d?utm_medium=embed&utm_campaign=share-popup&utm_content=d7ed7aca1b9f4028a87afd6df54f8394" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Fox3D </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=d7ed7aca1b9f4028a87afd6df54f8394" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>';

  SW.Cursor = (function () {

    var cursorRoot, seamothWrap, prawnWrap, mushroomSection;
    var reduceMotion = false;

    // Posição "real" (mouse bruto) e posição "renderizada" (com inércia)
    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var pos = { x: mouse.x, y: mouse.y };
    var prevPos = { x: pos.x, y: pos.y };

    // Rotação atual / alvo (efeito de "virar" o veículo)
    var rotY = 0;
    var targetRotY = 0;
    var rotZ = 0;
    var idleFrames = 0;

    var activeModel = 'seamoth';
    var hasMoved = false;

    var POS_EASE = 0.14;     // quanto menor, mais inércia/atraso
    var ROT_EASE = 0.09;     // suavidade da rotação ao virar
    var IDLE_FRAMES_TO_RESET = 14; // quantos frames parado até voltar para frente

    /* Garante que todo iframe usado como cursor tenha os atributos exigidos
       (não intercepta eventos, não rouba foco de teclado, carrega sob
       demanda) sem alterar nada da URL/crédito originais. */
    function hardenIframe(container) {
      var iframe = container.querySelector('iframe');
      if (!iframe) return;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('tabindex', '-1');
      iframe.style.pointerEvents = 'none';
    }

    function buildModels() {
      seamothWrap = document.querySelector('.cursor-model[data-model="seamoth"] .cursor-embed-wrap');
      prawnWrap = document.querySelector('.cursor-model[data-model="prawn"] .cursor-embed-wrap');
      if (seamothWrap) {
        seamothWrap.innerHTML = SEAMOTH_EMBED;
        hardenIframe(seamothWrap);
      }
      if (prawnWrap) {
        prawnWrap.innerHTML = PRAWN_EMBED;
        hardenIframe(prawnWrap);
      }
    }

    function onMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!hasMoved) {
        // Primeira leitura: posiciona instantaneamente para não "voar"
        // de um canto qualquer da tela até o ponteiro real.
        pos.x = mouse.x;
        pos.y = mouse.y;
        prevPos.x = mouse.x;
        prevPos.y = mouse.y;
        hasMoved = true;
      }
    }

    function onTouch(e) {
      if (e.touches && e.touches[0]) {
        onMouseMove(e.touches[0]);
      }
    }

    /* Verifica se já passamos da Floresta de Cogumelos para trocar o
       modelo do cursor (Seamoth -> Prawn Suit) com fade. Reversível: ao
       voltar para cima do bioma, retorna ao Seamoth. */
    function checkModelSwap() {
      if (!mushroomSection) return;
      var rect = mushroomSection.getBoundingClientRect();
      var pastThreshold = rect.top <= window.innerHeight * 0.5;
      var wanted = pastThreshold ? 'prawn' : 'seamoth';
      if (wanted !== activeModel) {
        swapModel(wanted);
      }
    }

    function swapModel(name) {
      activeModel = name;
      var seamothEl = document.querySelector('.cursor-model[data-model="seamoth"]');
      var prawnEl = document.querySelector('.cursor-model[data-model="prawn"]');
      if (!seamothEl || !prawnEl) return;

      var toShow = name === 'prawn' ? prawnEl : seamothEl;
      var toHide = name === 'prawn' ? seamothEl : prawnEl;

      toHide.classList.remove('active');
      toShow.classList.add('active', 'swapping');
      window.setTimeout(function () { toShow.classList.remove('swapping'); }, 650);
    }

    function activeWrapEl() {
      return activeModel === 'prawn' ? prawnWrap : seamothWrap;
    }

    function update() {
      // 1) posição com inércia (easing exponencial em direção ao mouse real)
      pos.x += (mouse.x - pos.x) * POS_EASE;
      pos.y += (mouse.y - pos.y) * POS_EASE;

      // 2) velocidade horizontal do modelo (não do mouse bruto — fica mais
      //    orgânico, pois já está suavizada pela inércia acima)
      var vx = pos.x - prevPos.x;
      prevPos.x = pos.x;
      prevPos.y = pos.y;

      if (Math.abs(vx) > 0.35) {
        targetRotY = SW.clamp(vx * 2.4, -36, 36); // direita = ângulo positivo
        idleFrames = 0;
      } else {
        idleFrames++;
        if (idleFrames > IDLE_FRAMES_TO_RESET) targetRotY = 0; // parado -> de frente
      }

      rotY += (targetRotY - rotY) * ROT_EASE;
      rotZ += ((-rotY * 0.15) - rotZ) * 0.07; // leve "roll" acompanhando o giro

      cursorRoot.style.transform =
        'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) translate(-50%,-50%)';

      var wrap = activeWrapEl();
      if (wrap) {
        wrap.style.transform = 'rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg)';
      }

      checkModelSwap();
      requestAnimationFrame(update);
    }

    function init() {
      cursorRoot = document.getElementById('custom-cursor');
      mushroomSection = document.getElementById('floresta-de-cogumelos');
      if (!cursorRoot) return;

      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.matchMedia('(pointer: coarse)').matches) return; // sem cursor 3D em touch

      buildModels();

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });

      if (reduceMotion) {
        // Ainda segue o mouse, mas sem giro/inércia pronunciada
        POS_EASE = 0.6;
        ROT_EASE = 0;
      }

      requestAnimationFrame(update);
    }

    return { init: init };
  })();
})();
