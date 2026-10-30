(function () {
  'use strict';
  const items = [...window.QUIZ_CONFIG.items].sort((a, b) => a.id - b.id);
  const state = window.QuizProgress.read();
  const unlocked = new Set(state.ids);
  const total = items.length;
  const count = items.filter((item) => unlocked.has(item.id)).length;

  const fraction = document.getElementById('progress-count');
  const bar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-description');
  fraction.textContent = `${count} / ${total}`;
  bar.style.width = `${(count / total) * 100}%`;
      document.getElementById('progress-track').setAttribute('aria-valuenow', String(count));
  const summary = `${total}個中${count}個のキーワードを解放しています`;
  progressText.textContent = summary;
  document.getElementById('progress-track').setAttribute('aria-label', summary);

  const grid = document.getElementById('keyword-list');
  items.forEach((item) => {
    const visited = unlocked.has(item.id);
    const li = document.createElement('li');
    li.className = `keyword-card ${visited ? 'is-unlocked' : 'is-locked'}`;
    li.style.setProperty('--rare-delay', `${(item.id - 1) * -0.72}s`);
    const header = document.createElement('div');
    header.className = 'keyword-card-header';
    const num = document.createElement('span');
    num.className = 'keyword-card-number';
    num.textContent = `NO. ${String(item.id).padStart(2, '0')}`;
    const status = document.createElement('span');
    status.className = `keyword-status ${visited ? 'status-done' : 'status-waiting'}`;
    status.textContent = visited ? '解放済み' : '未発見';
    header.append(num, status);

    const value = document.createElement('div');
    value.className = 'keyword-value';
    value.textContent = visited ? item.token : '？？？？';
    value.setAttribute('aria-label', visited ? `キーワード ${item.token}` : '未解放のキーワード');

    const footer = document.createElement('div');
    footer.className = 'keyword-card-footer';
    if (visited) {
      const link = document.createElement('a');
      link.href = `qr/${item.file}`;
      link.className = 'card-link';
      link.textContent = `${item.spot}の解説を見る`;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = ' ↗';
      link.append(arrow);
      footer.append(link);
    } else {
      const text = document.createElement('span');
      text.className = 'card-hint';
      text.textContent = 'QRコードを読み取って解放';
      footer.append(text);
    }
    li.append(header, value, footer);
    grid.append(li);
  });

  const completion = document.getElementById('completion');
  if (count === total) {
    document.getElementById('completed-word').textContent = items.map((item) => item.token).join('');
    completion.hidden = false;
    window.QuizCelebration.activate();
  }
  const warning = document.getElementById('storage-warning');
  if (!state.available) {
    warning.textContent = 'このブラウザでは進捗を読み取れません。通常モードで開くか、ブラウザの保存設定をご確認ください。';
    warning.hidden = false;
  } else if (state.corrupted) {
    warning.textContent = '保存済みの進捗データを読み取れませんでした。次に解答ページを開くと、進捗の記録を最初から作り直します。';
    warning.hidden = false;
  }
}());
