/* 全ページ共通の参加方法。説明の表示では進捗を変更しない。 */
(function () {
  'use strict';
  const button = document.querySelector('.guide-toggle');
  if (!button) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'quiz-guide';
  dialog.className = 'quiz-guide';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.innerHTML = `
    <div class="guide-heading"><h2 id="guide-title">クイズの楽しみ方</h2><button type="button" class="guide-close" aria-label="説明を閉じる">×</button></div>
    <div class="guide-body">
      <p>本郷キャンパスをあるいて、7つの文字を集めよう！</p>
      <ol>
        <li><strong>クイズを探そう</strong><p>回る順番は自由。周囲の目印や「地図・訪問状況」を見ながら、自分で行き先を考えよう。</p></li>
        <li><strong>QRコードを読み取ろう</strong><p>「次のQRコードを読み取る」からカメラを起動。写真からの読み取りも使えます。解答・解説ページを開くと、その番号の文字が記録されます。</p></li>
        <li><strong>あいことばを見つけよう</strong><p>文字一覧で7つの文字を番号順に読もう。あいことばは「正門」「伊藤国際門」の学生に伝えてね。</p></li>
      </ol>
      <h3>地図と記録について</h3>
      <p>「地図・訪問状況」は各ページの右下から開けます。GPSによる現在地には誤差があるため、周囲の目印も確認してください。このサイトでは現在地を取得しません。</p>
      <p>進捗はこのブラウザ内に保存されます。別の端末・ブラウザには引き継がれません。カメラ映像や写真はサーバーへ送信しません。</p>
      <p>クイズ・設置場所は仮データです。歩きながらの画面操作を避け、周囲の安全を確認してお楽しみください。</p>
    </div>`;
  document.body.append(dialog);
  button.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => button.focus());
}());
