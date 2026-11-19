/* 全7問完成時の風船は初回のみ。完成カードの光沢はCSSが継続表示する。 */
(function () {
  'use strict';
  const key = `${window.QUIZ_CONFIG.storageKey}-celebration-seen-v1`;

  function discovery() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const colors = ['#ff5a5f', '#ffb400', '#25c06d', '#3a86ff'];
    const layer = document.createElement('div');
    layer.className = 'discovery-confetti';
    layer.setAttribute('aria-hidden', 'true');

    for (let index = 0; index < 32; index++) {
      const angle = index * Math.PI * 0.764;
      const distance = 18 + (index * 13 % 34);
      const fan = document.createElementNS(svgNamespace, 'svg');
      fan.setAttribute('viewBox', '0 -67 106 134');
      fan.style.setProperty('--x', `${Math.cos(angle) * distance}vw`);
      fan.style.setProperty('--y', `${Math.sin(angle) * distance}vh`);
      fan.style.setProperty('--spin', `${index % 2 ? -1 : 1}turn`);
      fan.style.setProperty('--tilt', `${index * 53 % 360}deg`);
      fan.style.setProperty('--size', `${12 + index * 7 % 19}px`);
      fan.style.setProperty('--delay', `${index % 5 * 18}ms`);
      const shape = document.createElementNS(svgNamespace, 'path');
      // 添付の扇形をそのまま使い、1枚ずつ画面に散らす。
      shape.setAttribute('d', 'M 0 0 L 81.600 -66.079 A 105 105 0 0 1 81.600 66.079 Z');
      shape.setAttribute('fill', colors[index % colors.length]);
      fan.append(shape);
      layer.append(fan);
    }
    document.body.append(layer);
    window.setTimeout(() => layer.remove(), 1200);
  }

  function balloons() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'balloon-layer';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#ffcc00', '#0b8bee', '#ffe477', '#b9e1ff', '#fff2b3', '#ffda44', '#72c2ff'];
    // 固定値にして画面の度に予期しない位置に出ないようにする。
    for (let index = 0; index < 16; index++) {
      const balloon = document.createElement('span');
      balloon.className = 'balloon';
      const horizontal = 4 + ((index * 43) % 93);
      balloon.style.setProperty('--x', `${horizontal}%`);
      balloon.style.setProperty('--size', `${28 + index % 4 * 8}px`);
      balloon.style.setProperty('--delay', `${index % 6 * 0.18}s`);
      balloon.style.setProperty('--duration', `${4.2 + index % 5 * 0.36}s`);
      balloon.style.setProperty('--sway', `${index % 2 ? -55 : 55}px`);
      balloon.style.setProperty('--balloon-color', colors[index % colors.length]);
      balloon.innerHTML = '<span class="balloon-shape"></span><span class="balloon-string"></span>';
      layer.append(balloon);
    }
    document.body.append(layer);
    // 最後の風船が終了した後にDOMを除去する。
    window.setTimeout(() => { layer.remove(); }, 7200);
  }

  function activate() {
    document.getElementById('keyword-list').classList.add('is-complete');
    let first = false;
    try {
      if (window.localStorage.getItem(key) !== '1') {
        window.localStorage.setItem(key, '1');
        first = true;
      }
    } catch (error) {
      // 保存不可の環境でも完成表示は行う。風船はこの閲覧の1回だけ表示する。
      first = true;
    }
    if (first) balloons();
  }

  window.QuizCelebration = Object.freeze({ activate, discovery });
}());
