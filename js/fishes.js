/* ==========================================================================
   SUBNAUTICA WIKI — fishes.js
   Banco de dados das criaturas (embeds Sketchfab EXATOS, créditos intactos),
   configuração de povoamento por bioma e o motor de animação procedural
   que faz cada criatura "nadar": flutuação vertical, mudança de direção,
   rotação e, para os gigantes, travessias lentas e esporádicas.

   Os iframes são injetados via JavaScript dentro de .creature-layer e
   movidos inteiramente por transform/translate3d a cada quadro
   (requestAnimationFrame) — nunca por position/top/left, para manter a
   performance.
   ========================================================================== */

(function () {
  'use strict';
  window.SW = window.SW || {};

  /* ------------------------------------------------------------------------
     1. BANCO DE CRIATURAS — embeds Sketchfab originais, sem nenhuma
     alteração de URL ou remoção de crédito.
     ------------------------------------------------------------------------ */
  var CREATURE_DB = {

    peeper: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Peeper" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/e24f033a8c984487a322b2e4cee34886/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/peeper-e24f033a8c984487a322b2e4cee34886?utm_medium=embed&utm_campaign=share-popup&utm_content=e24f033a8c984487a322b2e4cee34886" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Peeper </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=e24f033a8c984487a322b2e4cee34886" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=e24f033a8c984487a322b2e4cee34886" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    boomerang: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Boomerang" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/e43a37b6f1a049419e8f8a4cce4ea5d8/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/boomerang-e43a37b6f1a049419e8f8a4cce4ea5d8?utm_medium=embed&utm_campaign=share-popup&utm_content=e43a37b6f1a049419e8f8a4cce4ea5d8" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Boomerang </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=e43a37b6f1a049419e8f8a4cce4ea5d8" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=e43a37b6f1a049419e8f8a4cce4ea5d8" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    bladderfish: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Bladderfish" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/e1434e7274ae4ba08eea28e21689dfab/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/bladderfish-e1434e7274ae4ba08eea28e21689dfab?utm_medium=embed&utm_campaign=share-popup&utm_content=e1434e7274ae4ba08eea28e21689dfab" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Bladderfish </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=e1434e7274ae4ba08eea28e21689dfab" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=e1434e7274ae4ba08eea28e21689dfab" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    gasopod: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Gasopod" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/4601afa263cd4637ae37af94e41b52f3/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/gasopod-4601afa263cd4637ae37af94e41b52f3?utm_medium=embed&utm_campaign=share-popup&utm_content=4601afa263cd4637ae37af94e41b52f3" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Gasopod </a> by <a href="https://sketchfab.com/fox3d?utm_medium=embed&utm_campaign=share-popup&utm_content=4601afa263cd4637ae37af94e41b52f3" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Fox3D </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=4601afa263cd4637ae37af94e41b52f3" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    stalker: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Stalker" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/ed6acdf0fb2e4e769811ffe676ac7fa4/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/stalker-ed6acdf0fb2e4e769811ffe676ac7fa4?utm_medium=embed&utm_campaign=share-popup&utm_content=ed6acdf0fb2e4e769811ffe676ac7fa4" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Stalker </a> by <a href="https://sketchfab.com/DusanZderic?utm_medium=embed&utm_campaign=share-popup&utm_content=ed6acdf0fb2e4e769811ffe676ac7fa4" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> DusanZderic </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=ed6acdf0fb2e4e769811ffe676ac7fa4" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    sandshark: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Sandshark" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/44e3c66039a44cd0a5db713b44fd4b28/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/sandshark-44e3c66039a44cd0a5db713b44fd4b28?utm_medium=embed&utm_campaign=share-popup&utm_content=44e3c66039a44cd0a5db713b44fd4b28" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Sandshark </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=44e3c66039a44cd0a5db713b44fd4b28" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=44e3c66039a44cd0a5db713b44fd4b28" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    jellyray: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Jellyray" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/b4ffde84ef1c496c8a81d66f10ca1763/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/jellyray-b4ffde84ef1c496c8a81d66f10ca1763?utm_medium=embed&utm_campaign=share-popup&utm_content=b4ffde84ef1c496c8a81d66f10ca1763" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Jellyray </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=b4ffde84ef1c496c8a81d66f10ca1763" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=b4ffde84ef1c496c8a81d66f10ca1763" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    crabsquid: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Crabsquid" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/8ac29bdaef8247378127907dfc614341/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/crabsquid-8ac29bdaef8247378127907dfc614341?utm_medium=embed&utm_campaign=share-popup&utm_content=8ac29bdaef8247378127907dfc614341" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Crabsquid </a> by <a href="https://sketchfab.com/fox3d?utm_medium=embed&utm_campaign=share-popup&utm_content=8ac29bdaef8247378127907dfc614341" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Fox3D </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=8ac29bdaef8247378127907dfc614341" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    ghostray: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Ghost_Ray" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/b8503f882e90420dac9ffdd71748588c/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/ghost-ray-b8503f882e90420dac9ffdd71748588c?utm_medium=embed&utm_campaign=share-popup&utm_content=b8503f882e90420dac9ffdd71748588c" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Ghost_Ray </a> by <a href="https://sketchfab.com/fox3d?utm_medium=embed&utm_campaign=share-popup&utm_content=b8503f882e90420dac9ffdd71748588c" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Fox3D </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=b8503f882e90420dac9ffdd71748588c" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    ghostleviathan: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Ghost Leviathan" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/e6ae1c1e849b4c5fafda130ffdd6a210/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/ghost-leviathan-e6ae1c1e849b4c5fafda130ffdd6a210?utm_medium=embed&utm_campaign=share-popup&utm_content=e6ae1c1e849b4c5fafda130ffdd6a210" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Ghost Leviathan </a> by <a href="https://sketchfab.com/gavinpgamer1?utm_medium=embed&utm_campaign=share-popup&utm_content=e6ae1c1e849b4c5fafda130ffdd6a210" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> gavinpgamer1 </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=e6ae1c1e849b4c5fafda130ffdd6a210" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    seadragon: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Sea Dragon" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/b5b7d80310464f87b1123c84a9afe862/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/sea-dragon-b5b7d80310464f87b1123c84a9afe862?utm_medium=embed&utm_campaign=share-popup&utm_content=b5b7d80310464f87b1123c84a9afe862" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Sea Dragon </a> by <a href="https://sketchfab.com/fox3d?utm_medium=embed&utm_campaign=share-popup&utm_content=b5b7d80310464f87b1123c84a9afe862" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Fox3D </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=b5b7d80310464f87b1123c84a9afe862" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    },

    seaemperor: {
      embed: '<div class="sketchfab-embed-wrapper"> <iframe title="Subnautica - Sea emperor" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/19818def84584ff687eeb0f39ade37c2/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/subnautica-sea-emperor-19818def84584ff687eeb0f39ade37c2?utm_medium=embed&utm_campaign=share-popup&utm_content=19818def84584ff687eeb0f39ade37c2" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Subnautica - Sea emperor </a> by <a href="https://sketchfab.com/joaopedro.grigolon?utm_medium=embed&utm_campaign=share-popup&utm_content=19818def84584ff687eeb0f39ade37c2" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> joaopedro.grigolon </a> on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=19818def84584ff687eeb0f39ade37c2" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>'
    }
  };

  /* ------------------------------------------------------------------------
     2. POVOAMENTO POR BIOMA
     type: 'school' (cardume, vai e volta) | 'circle' (órbita lenta,
     usado pelo Stalker) | 'floor' (junto ao fundo, usado pelo Sand Shark)
     | 'glow' (emite pulsos de luz, usado pelo Crabsquid) | 'giant'
     (travessia lenta e esporádica, criaturas grandes).
     ------------------------------------------------------------------------ */
  var BIOME_POPULATION = {

    'aguas-rasas': [
      { species: 'peeper', count: 5, type: 'school', size: 'sm', speed: 1.1, baseY: 35 },
      { species: 'boomerang', count: 4, type: 'school', size: 'sm', speed: 0.9, baseY: 50 },
      { species: 'bladderfish', count: 4, type: 'school', size: 'xs', speed: 0.7, baseY: 60 },
      { species: 'gasopod', count: 3, type: 'school', size: 'md', speed: 0.32, baseY: 68 }
    ],

    'floresta-de-algas': [
      { species: 'peeper', count: 4, type: 'school', size: 'sm', speed: 1.0, baseY: 30 },
      { species: 'boomerang', count: 4, type: 'school', size: 'sm', speed: 0.85, baseY: 48 },
      { species: 'bladderfish', count: 4, type: 'school', size: 'xs', speed: 0.65, baseY: 58 },
      { species: 'stalker', count: 3, type: 'circle', size: 'md', speed: 0.55, baseY: 45 }
    ],

    'planaltos-gramados': [
      { species: 'peeper', count: 4, type: 'school', size: 'sm', speed: 1.0, baseY: 28 },
      { species: 'boomerang', count: 3, type: 'school', size: 'sm', speed: 0.8, baseY: 42 },
      { species: 'bladderfish', count: 4, type: 'school', size: 'xs', speed: 0.6, baseY: 52 },
      { species: 'sandshark', count: 2, type: 'floor', size: 'lg', speed: 0.5, baseY: 82 }
    ],

    'floresta-de-cogumelos': [
      { species: 'peeper', count: 4, type: 'school', size: 'sm', speed: 0.95, baseY: 25 },
      { species: 'boomerang', count: 4, type: 'school', size: 'sm', speed: 0.8, baseY: 40 },
      { species: 'bladderfish', count: 3, type: 'school', size: 'xs', speed: 0.6, baseY: 55 },
      { species: 'jellyray', count: 3, type: 'school', size: 'md', speed: 0.35, baseY: 45 }
    ],

    'zona-de-algas-sanguineas': [
      { species: 'peeper', count: 3, type: 'school', size: 'sm', speed: 0.9, baseY: 30 },
      { species: 'boomerang', count: 3, type: 'school', size: 'sm', speed: 0.78, baseY: 45 },
      { species: 'bladderfish', count: 3, type: 'school', size: 'xs', speed: 0.55, baseY: 58 },
      { species: 'crabsquid', count: 2, type: 'glow', size: 'lg', speed: 0.3, baseY: 50 }
    ],

    'rio-perdido': [
      { species: 'peeper', count: 3, type: 'school', size: 'sm', speed: 0.85, baseY: 28 },
      { species: 'boomerang', count: 3, type: 'school', size: 'sm', speed: 0.75, baseY: 42 },
      { species: 'bladderfish', count: 3, type: 'school', size: 'xs', speed: 0.55, baseY: 55 },
      { species: 'ghostray', count: 3, type: 'school', size: 'md', speed: 0.4, baseY: 40 },
      { species: 'ghostleviathan', count: 1, type: 'giant', size: 'giant', speed: 1, baseY: 70 }
    ],

    'zona-de-lava-inativa': [
      { species: 'seadragon', count: 1, type: 'giant', size: 'giant', speed: 1, baseY: 55 }
    ],

    'lagos-de-lava': [
      { species: 'seadragon', count: 1, type: 'giant', size: 'giant', speed: 1, baseY: 50 }
    ],

    'instalacao-de-contencao-primaria': [
      { species: 'seaemperor', count: 1, type: 'giant', size: 'xl', speed: 1, baseY: 45 },
      { species: 'peeper', count: 3, type: 'school', size: 'sm', speed: 0.7, baseY: 30 },
      { species: 'boomerang', count: 3, type: 'school', size: 'sm', speed: 0.6, baseY: 60 },
      { species: 'bladderfish', count: 3, type: 'school', size: 'xs', speed: 0.5, baseY: 70 }
    ]
  };

  SW.Fishes = (function () {

    var activeLayers = {};   // biomeId -> { layer, instances[] }
    var allInstances = [];   // lista plana usada pelo loop de animação
    var rafHandle = null;
    var lastTime = 0;
    var mobile = false;

    /* ---- utilidades -------------------------------------------------- */

    function hardenIframe(container) {
      var iframe = container.querySelector('iframe');
      if (!iframe) return;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('tabindex', '-1');
      iframe.style.pointerEvents = 'none';
    }

    function scaledCount(n, type) {
      if (!mobile) return n;
      if (type === 'giant') return n;
      return Math.max(1, Math.round(n * 0.5));
    }

    /* ---- criação de instâncias ---------------------------------------- */

    function createInstance(group, index) {
      var def = CREATURE_DB[group.species];
      if (!def) return null;

      var el = document.createElement('div');
      el.className = 'creature size-' + group.size;
      el.innerHTML = def.embed;
      hardenIframe(el);

      // Pulso de bioluminescência extra para o Crabsquid
      if (group.type === 'glow') {
        var glow = document.createElement('span');
        glow.className = 'bio-spore';
        glow.style.cssText = 'position:absolute;width:34px;height:34px;left:50%;top:18%;' +
          'transform:translate(-50%,-50%);background:#8fe9ff;box-shadow:0 0 22px 8px rgba(143,233,255,0.55);' +
          'animation-delay:' + (Math.random() * 2).toFixed(2) + 's;';
        el.appendChild(glow);
      }

      var inst = {
        el: el,
        kind: group.type,
        baseY: SW.clamp(group.baseY + (Math.random() * 10 - 5), 6, 92),
        ampY: group.type === 'floor' ? 1.5 : (4 + Math.random() * 7),
        phase: Math.random() * Math.PI * 2,
        freqY: 0.12 + Math.random() * 0.18,
        dir: Math.random() < 0.5 ? -1 : 1,
        x: Math.random() * 100,
        speed: group.speed * (0.85 + Math.random() * 0.3),
        turnTimer: 4 + Math.random() * 6,
        turnElapsed: Math.random() * 4,
        // parâmetros específicos do padrão "circle" (Stalker)
        orbitCenter: 35 + Math.random() * 30,
        orbitRadius: 16 + Math.random() * 10,
        orbitAngle: Math.random() * Math.PI * 2,
        // parâmetros do padrão "giant"
        giantCycle: Math.random() * 50,
        dustTimer: Math.random() * 6 + 3
      };

      return inst;
    }

    /* ---- spawn / despawn por bioma (lazy, via IntersectionObserver) --- */

    function spawnBiome(biomeId) {
      if (activeLayers[biomeId]) return;
      var layer = document.querySelector('.creature-layer[data-biome="' + biomeId + '"]');
      var pop = BIOME_POPULATION[biomeId];
      if (!layer || !pop) return;

      var instances = [];
      pop.forEach(function (group) {
        var n = scaledCount(group.count, group.type);
        for (var i = 0; i < n; i++) {
          var inst = createInstance(group, i);
          if (!inst) continue;
          layer.appendChild(inst.el);
          instances.push(inst);
          (function (instRef, delay) {
            window.setTimeout(function () { instRef.el.classList.add('is-visible'); }, delay);
          })(inst, 80 + i * 140);
        }
      });

      activeLayers[biomeId] = { layer: layer, instances: instances };
      allInstances = allInstances.concat(instances);
    }

    function despawnBiome(biomeId) {
      var data = activeLayers[biomeId];
      if (!data) return;
      allInstances = allInstances.filter(function (inst) {
        return data.instances.indexOf(inst) === -1;
      });
      data.layer.innerHTML = '';
      delete activeLayers[biomeId];
    }

    /* ---- motor de animação procedural --------------------------------- */

    function stepSchoolOrFloor(inst, dt, now, w, h) {
      inst.turnElapsed += dt;
      if (inst.turnElapsed > inst.turnTimer && Math.random() < 0.02) {
        inst.dir *= -1;
        inst.turnElapsed = 0;
        inst.turnTimer = 4 + Math.random() * 6;
      }

      inst.x += inst.dir * inst.speed * dt * 2.4;
      if (inst.x > 104) { inst.x = 104; inst.dir = -1; }
      if (inst.x < -4) { inst.x = -4; inst.dir = 1; }

      var y = inst.baseY + Math.sin(now * 0.001 * inst.freqY + inst.phase) * inst.ampY;
      var px = (inst.x / 100) * w;
      var py = (y / 100) * h;
      var flip = inst.dir < 0 ? -1 : 1;
      var tilt = Math.sin(now * 0.0012 + inst.phase) * (inst.kind === 'floor' ? 1.5 : 4);

      inst.el.style.transform =
        'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scaleX(' + flip + ') rotate(' + tilt.toFixed(1) + 'deg)';

      // Sand Shark levanta um leve "respingo de areia" esporádico
      if (inst.kind === 'floor') {
        inst.dustTimer -= dt;
        if (inst.dustTimer <= 0 && Math.abs(inst.dir * inst.speed) > 0.2) {
          inst.dustTimer = 5 + Math.random() * 6;
          spawnSandPuff(inst.el, px, py);
        }
      }
    }

    function stepCircle(inst, dt, now, w, h) {
      inst.orbitAngle += dt * (0.18 + inst.speed * 0.25);
      var x = inst.orbitCenter + Math.cos(inst.orbitAngle) * inst.orbitRadius;
      var y = inst.baseY + Math.sin(inst.orbitAngle * 1.3) * (inst.orbitRadius * 0.5);
      var px = (x / 100) * w;
      var py = (y / 100) * h;
      var flip = Math.cos(inst.orbitAngle) < 0 ? -1 : 1;
      inst.el.style.transform =
        'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scaleX(' + flip + ')';
    }

    function stepGiant(inst, dt, now, w, h) {
      var period = 48;
      var crossDuration = 24;
      inst.giantCycle = (inst.giantCycle + dt) % period;
      var t = inst.giantCycle;

      if (t > crossDuration) {
        inst.el.style.opacity = 0;
        return;
      }

      var p = t / crossDuration;
      var fade = p < 0.08 ? p / 0.08 : (p > 0.86 ? (1 - p) / 0.14 : 1);
      inst.el.style.opacity = String(SW.clamp(fade, 0, 1) * 0.95);

      var startX = inst.dir > 0 ? -30 : 122;
      var endX = inst.dir > 0 ? 122 : -30;
      var x = SW.lerp(startX, endX, p);
      var y = inst.baseY + Math.sin(p * Math.PI * 2 * 0.5 + inst.phase) * 3;
      var px = (x / 100) * w;
      var py = (y / 100) * h;
      var flip = inst.dir;

      inst.el.style.transform =
        'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scaleX(' + flip + ')';
    }

    function spawnSandPuff(refEl, px, py) {
      var layer = refEl.parentElement;
      if (!layer) return;
      var puff = document.createElement('span');
      puff.className = 'smoke-puff';
      var size = 26 + Math.random() * 18;
      puff.style.cssText =
        'left:' + px.toFixed(0) + 'px; top:' + (py + 18).toFixed(0) + 'px;' +
        'width:' + size + 'px; height:' + (size * 0.5) + 'px;' +
        'background: radial-gradient(circle, rgba(214,196,150,0.55), transparent 70%);' +
        'animation-duration: 3.2s;';
      layer.appendChild(puff);
      window.setTimeout(function () { if (puff.parentNode) puff.parentNode.removeChild(puff); }, 3300);
    }

    function animate(now) {
      var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      allInstances.forEach(function (inst) {
        var layer = inst.el.parentElement;
        if (!layer) return;
        var w = layer.clientWidth || window.innerWidth;
        var h = layer.clientHeight || window.innerHeight;

        if (inst.kind === 'giant') stepGiant(inst, dt, now, w, h);
        else if (inst.kind === 'circle') stepCircle(inst, dt, now, w, h);
        else stepSchoolOrFloor(inst, dt, now, w, h);
      });

      rafHandle = requestAnimationFrame(animate);
    }

    /* ---- observador de interseção (lazy spawn/despawn) ----------------- */

    function initObserver() {
      var layers = document.querySelectorAll('.creature-layer');
      if (!('IntersectionObserver' in window)) {
        // Fallback sem observer: povoa tudo de uma vez (sites muito antigos)
        layers.forEach(function (layer) { spawnBiome(layer.getAttribute('data-biome')); });
        return;
      }
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var biomeId = entry.target.getAttribute('data-biome');
          if (entry.isIntersecting) spawnBiome(biomeId);
          else despawnBiome(biomeId);
        });
      }, { rootMargin: '55% 0px 55% 0px', threshold: 0.01 });

      layers.forEach(function (layer) { observer.observe(layer); });
    }

    function init() {
      mobile = window.matchMedia('(max-width: 640px)').matches;
      initObserver();
      lastTime = performance.now();
      rafHandle = requestAnimationFrame(animate);
    }

    return { init: init };
  })();
})();
