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
    <div class="guide-heading"><h2 id="guide-title">クイズで巡る東大本郷の説明</h2><button type="button" class="guide-close" aria-label="説明を閉じる">×</button></div>
    <div class="guide-body">
      <h3>参加方法</h3>
      <ol>
        <li>
          <strong>スマートフォンを用意しよう</strong>
          <p>2次元コード（QRコード&reg;）を読み取れるスマートフォンを用意してください。</p>
          <p>※ このサイトはウェブブラウザーで開くことをおすすめします。シークレットウィンドウやプライベートウィンドウは使わないでください。</p>
          <p>※ スマートフォンに訪問を記録できない場合も、答え合わせページに表示される「文字」とその番号をメモすれば、最終問題にチャレンジできます。</p>
        </li>
        <li>
          <strong>青い風船を目印に、7つのクイズを探そう</strong>
          <p>「地図・訪問状況」のマップをヒントに、キャンパス内のクイズスポット7か所を巡ります。青い風船の近くにあるクイズパネルを見つけたら、パネルの2次元コードを読み取って答え合わせ。ページを開くと、スポットへの訪問が記録されます。</p>
          <p>このサイトの「次のQRコードを読み取る」ボタンからも読み取れます。</p>
        </li>
        <li>
          <strong>さあ、最終問題にチャレンジ！</strong>
          <p>7か所すべてを巡ると、最終問題のヒントになる文字がそろいます。正門または伊藤国際門にいる学生スタッフに声をかけて、最終問題に挑戦しましょう。正解した方には、オリジナル修了証書をプレゼントします！</p>
        </li>
      </ol>
      <h3>クイズで巡る東大本郷とは？</h3>
      <p><a href="https://hongo-icho.jpn.org/" target="_blank">本郷いちょう遊歩</a>の東大企画です。本郷キャンパスの名所や史跡を巡り、大学にまつわるクイズに挑戦しながら「文字」を集めます。7つのスポットを巡るうちに、東京大学の歴史や魅力をもっと深く知ることができるかも！</p>
      <h3><a href="https://hongo-icho.jpn.org/" target="_blank">本郷いちょう遊歩</a>とは？</h3>
      <p>11月29日、文京区の本郷通り沿いにある3大学（東京大学、東洋学園大学、文京学院大学）が連携して開催する地域連携イベントです。こちらもあわせてお楽しみください！</p>
    </div>`;
  document.body.append(dialog);
  button.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right ||
        event.clientY < bounds.top || event.clientY >= bounds.bottom) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => button.focus());
}());
