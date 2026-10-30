(function () {
  'use strict';
  const pageId = Number(document.body.dataset.pageId);
  const item = window.QUIZ_CONFIG.items.find((value) => value.id === pageId);
  if (!item) {
    document.getElementById('answer-title').textContent = 'ページが見つかりません';
    document.getElementById('answer-main').hidden = true;
    return;
  }

  // ページを開いた時点で自動的に解放する。ボタン操作は不要。
  const result = window.QuizProgress.markVisited(pageId);
  document.title = `${item.title} | クイズで巡る東大本郷`;
  const put = (id, value) => { document.getElementById(id).textContent = value; };
  put('answer-number', `QUIZ ${String(item.id).padStart(2, '0')} / 07`);
  put('answer-spot', item.eyebrow);
  put('answer-title', item.title);
  put('answer-question', item.question);
  put('answer-correct', item.answer);
  put('answer-explanation', item.explanation);
  put('answer-trivia', item.trivia);
  put('answer-keyword', item.token);
      if (!result.ok) {
        put('answer-record-message', 'キーワードは表示されていますが、このブラウザには記録を保存できませんでした。');
      }
  const reference = document.getElementById('answer-source');
  reference.textContent = `参考：${item.source}`;
  reference.href = item.sourceUrl;
  const illustration = document.getElementById('answer-illustration');
  illustration.src = `../assets/images/${item.icon}.svg`;
  illustration.alt = `${item.spot}をイメージした装飾イラスト`;
  if (!result.ok) {
    const warning = document.getElementById('storage-warning');
    warning.textContent = 'このブラウザに解放状態を保存できませんでした。キーワードは表示されていますが、一覧ページに記録されない可能性があります。';
    warning.hidden = false;
  }
}());
