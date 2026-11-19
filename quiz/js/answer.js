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
  if (result.added) window.QuizCelebration.discovery();
  document.title = `${item.title} | クイズで巡る東大本郷`;
  const put = (id, value) => { document.getElementById(id).textContent = value; };
  put('answer-number', 'QUIZ & DISCOVERY');
  put('answer-spot', item.eyebrow);
  put('answer-title', item.title);
  put('answer-question', item.question);
  put('answer-correct', item.answer);
  put('answer-explanation', item.explanation);
  document.getElementById('answer-illustration').src = `../assets/images/${item.icon}.svg`;
  put('answer-letter-number', '発見した文字');
  put('answer-keyword', item.token);
  document.getElementById('answer-keyword').setAttribute('aria-label', `発見した文字 ${item.token}`);
  if (!result.ok) {
    put('answer-record-message', '文字は表示されていますが、このブラウザには記録を保存できませんでした。');
  }
  if (!result.ok) {
    const warning = document.getElementById('storage-warning');
    warning.textContent = 'このブラウザに解放状態を保存できませんでした。文字は表示されていますが、一覧ページに記録されない可能性があります。';
    warning.hidden = false;
  }
}());
