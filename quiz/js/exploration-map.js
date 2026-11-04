/* 散策エリアと、このブラウザでの読み込み状況。順路やGPSは使用しない。 */
(function () {
  'use strict';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'map-toggle';
  button.textContent = '地図・訪問状況';
  button.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog');
  dialog.className = 'exploration-map';
  dialog.setAttribute('aria-labelledby', 'map-heading');
  dialog.innerHTML = `
    <div class="map-heading"><h2 id="map-heading">散策マップ</h2><button type="button" class="map-close" aria-label="地図を閉じる">閉じる ×</button></div>
    <p>どこへ向かうかは、あなた次第。地図と周囲の目印を見ながら探索しよう。</p>
    <p class="map-gps-note">GPSによる現在地には誤差があります。建物の近くでは位置がずれることがあるため、地図と周囲の目印を確認して移動してください。このサイトでは現在地を取得しません。</p>
    <div class="map-frame"></div>
    <a class="map-external" href="https://www.google.com/maps/search/?api=1&query=東京大学本郷キャンパス" target="_blank" rel="noopener noreferrer">Googleマップで開く（別タブ） ↗</a>
    <p class="map-caption">地図が表示されない場合は、上のリンクをご利用ください。Googleの地図はオンライン接続が必要です。</p>
    <h3>各地点の訪問状況</h3>
    <p class="map-caption">訪問済み＝このブラウザで解答・解説ページを読み込み済み。番号は文字の番号で、回る順番ではありません。</p>
    <p class="map-record-note" role="status"></p>
    <ul class="map-spots"></ul>
    <p class="map-caption">地点名は仮データです。地図は散策エリアの参考で、QRコードの正確な設置位置は示していません。「東京大学のはじまり」は設置場所が未設定です。</p>`;
  document.body.append(button, dialog);
  button.setAttribute('aria-controls', 'exploration-map');
  dialog.id = 'exploration-map';
  function render() {
    const state = window.QuizProgress.read();
    const note = dialog.querySelector('.map-record-note');
    note.textContent = !state.available ? '訪問履歴を読み取れません。訪問状況は不明です。' : state.corrupted ? '訪問履歴が破損しているため、訪問状況は不明です。' : `訪問済み ${state.ids.length} / ${window.QUIZ_CONFIG.items.length}地点。履歴はこのブラウザ内だけに保存されます。`;
    const list = dialog.querySelector('.map-spots');
    list.replaceChildren(...window.QUIZ_CONFIG.items.map((item) => {
      const visited = state.ids.includes(item.id);
      const row = document.createElement('li');
      row.className = visited ? 'is-visited' : '';
      const name = document.createElement('span');
      name.textContent = `${item.id}. ${item.spot}`;
      const badge = document.createElement('strong');
      badge.textContent = !state.available || state.corrupted ? '記録不明' : visited ? '✓ 訪問済み' : '未訪問';
      row.append(name, badge);
      return row;
    }));
  }
  button.addEventListener('click', () => {
    render();
    // 地図は初回に開く時だけ読み込み、通常のクイズ表示を遅らせない。
    if (!dialog.querySelector('iframe')) {
      const frame = document.createElement('iframe');
      frame.title = '東京大学本郷キャンパス周辺のGoogleマップ';
      frame.src = 'https://maps.google.com/maps?q=東京大学本郷キャンパス&z=16&output=embed';
      frame.referrerPolicy = 'no-referrer';
      frame.allowFullscreen = true;
      dialog.querySelector('.map-frame').append(frame);
    }
    dialog.showModal();
  });
  dialog.querySelector('.map-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => button.focus());
  window.addEventListener('storage', () => { if (dialog.open) render(); });
  window.addEventListener('pageshow', () => { if (dialog.open) render(); });
}());
