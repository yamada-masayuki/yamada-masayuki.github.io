/* 本郷キャンパスの散策マップ。 */
(function () {
  'use strict';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'map-toggle';
  button.innerHTML = '<svg class="map-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/></svg><span>地図</span>';
  button.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog');
  dialog.className = 'exploration-map';
  dialog.setAttribute('aria-labelledby', 'map-heading');
  dialog.innerHTML = `
    <div class="map-heading"><h2 id="map-heading">クイズスポットの地図</h2><button type="button" class="map-close" aria-label="地図を閉じる"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <div class="map-frame"></div>
    <ul class="map-notes">
      <li>GPSによる現在地には誤差があるため、周囲の目印も確認してください。</li>
      <li>原則として建物は関係者以外立入禁止です。</li>
    </ul>`;
  document.body.append(button, dialog);
  button.setAttribute('aria-controls', 'exploration-map');
  dialog.id = 'exploration-map';
  button.addEventListener('click', () => {
    // 地図は初回に開く時だけ読み込み、通常のクイズ表示を遅らせない。
    if (!dialog.querySelector('iframe')) {
      const frame = document.createElement('iframe');
      frame.title = 'クイズスポットの地図';
      frame.src = 'https://www.google.com/maps/d/u/0/embed?mid=1dQVVcPS3Hyamz2AAxIutZZMYH9hSGLg&ehbc=2E312F';
      frame.referrerPolicy = 'no-referrer';
      frame.allowFullscreen = true;
      dialog.querySelector('.map-frame').append(frame);
    }
    dialog.showModal();
  });
  dialog.querySelector('.map-close').addEventListener('click', () => dialog.close());
  // ダイアログ内の余白や、地図から外へドラッグした操作では閉じない。
  function outside(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  }
  let startedOutside = false;
  dialog.addEventListener('pointerdown', (event) => { startedOutside = event.target === dialog && outside(event); });
  dialog.addEventListener('click', (event) => {
    if (startedOutside && event.target === dialog && outside(event)) dialog.close();
    startedOutside = false;
  });
  dialog.addEventListener('close', () => button.focus());
}());
