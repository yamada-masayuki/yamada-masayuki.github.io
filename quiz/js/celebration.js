/* 全7問完成時の風船は初回のみ。完成カードの光沢はCSSが継続表示する。 */
(function () {
  'use strict';
  const key = `${window.QUIZ_CONFIG.storageKey}-celebration-seen-v1`;

  function balloons() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'balloon-layer';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#d5a08b', '#e6c477', '#93b6a8', '#b4a8c9', '#9cbdcc', '#e8b2a3', '#b8bc80'];
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

  window.QuizCelebration = Object.freeze({ activate });
}());
