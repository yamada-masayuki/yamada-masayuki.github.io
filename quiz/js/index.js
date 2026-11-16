(function () {
  'use strict';
  const configuredItems = window.QUIZ_CONFIG.items;
  const state = window.QuizProgress.read();
  const items = state.ids.map((id) => configuredItems.find((item) => item.id === id));
  items.push(...Array(configuredItems.length - items.length).fill(null));
  const total = items.length;
  const count = state.ids.length;

  const fraction = document.getElementById('progress-count');
  const bar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-description');
  fraction.textContent = `${count} / ${total}`;
  bar.style.width = `${(count / total) * 100}%`;
  document.getElementById('progress-track').setAttribute('aria-valuenow', String(count));
  const summary = `${total}文字中${count}文字を解放しています`;
  progressText.textContent = summary;
  document.getElementById('progress-track').setAttribute('aria-label', summary);

  const grid = document.getElementById('keyword-list');
  items.forEach((item) => {
    const visited = item !== null;
    const li = document.createElement('li');
    li.className = `keyword-card ${visited ? 'is-unlocked' : 'is-locked'}`;
    li.style.setProperty('--rare-delay', `${grid.children.length * -0.72}s`);
    const header = document.createElement('div');
    header.className = 'keyword-card-header';
    const status = document.createElement('span');
    status.className = `keyword-status ${visited ? 'status-done' : 'status-waiting'}`;
    status.textContent = visited ? '解放済み' : '未発見';
    header.append(status);

    const value = document.createElement('div');
    value.className = 'keyword-value';
    value.textContent = visited ? item.token : '？';
    value.setAttribute('aria-label', visited ? `発見した文字 ${item.token}` : '未発見の文字');

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
      const controls = document.createElement('div');
      controls.className = 'letter-controls';
      [-1, 1].forEach((direction) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = direction < 0 ? '← 移動' : '移動 →';
        button.setAttribute('aria-label', `${item.token}を${direction < 0 ? '前' : '後ろ'}へ移動`);
        button.addEventListener('click', () => {
          const neighbor = direction < 0 ? li.previousElementSibling : li.nextElementSibling;
          if (!neighbor || !neighbor.classList.contains('is-unlocked')) return;
          if (direction < 0) grid.insertBefore(li, neighbor);
          else grid.insertBefore(neighbor, li);
          button.focus();
        });
        controls.append(button);
      });
      footer.append(controls);
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
