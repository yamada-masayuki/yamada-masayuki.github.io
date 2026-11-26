(function () {
  'use strict';
  const { items: configuredItems, storageKey } = window.QUIZ_CONFIG;
  const spotById = new Map(configuredItems.map((item) => [item.id, item]));
  const progress = window.QuizProgress;
  const grid = document.getElementById('keyword-list');
  const completion = document.getElementById('completion');
  const warning = document.getElementById('storage-warning');
  let previousDisplay;

  function render(state) {
    const total = configuredItems.length;
    const count = state.ids.length;
    const items = state.ids.map((id) => spotById.get(id));
    items.push(...Array(total - count).fill(null));

    const fraction = document.getElementById('progress-count');
    const bar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-description');
    fraction.textContent = `${count} / ${total}`;
    bar.style.width = `${(count / total) * 100}%`;
    document.getElementById('progress-track').setAttribute('aria-valuenow', String(count));
    const summary = `${total}文字中${count}文字を発見しています`;
    progressText.textContent = summary;
    document.getElementById('progress-track').setAttribute('aria-label', summary);

    const cards = document.createDocumentFragment();
    items.forEach((item) => {
      const visited = item !== null;
      const record = visited ? state.records.get(item.id) : null;
      const li = document.createElement('li');
      li.className = `keyword-card ${visited ? 'is-unlocked' : 'is-locked'}`;
      li.style.setProperty('--rare-delay', `${cards.children.length * -0.72}s`);
      const header = document.createElement('div');
      header.className = 'keyword-card-header';
      const status = document.createElement('span');
      status.className = `keyword-status ${visited ? 'status-done' : 'status-waiting'}`;
      status.textContent = visited ? '発見！' : '未発見';
      header.append(status);

      const value = document.createElement('div');
      value.className = 'keyword-value';
      if (visited) {
        const badge = document.createElement('span');
        badge.className = 'keyword-number';
        badge.textContent = String(item.keywordNumber);
        value.append(badge, record.token);
      } else {
        value.textContent = '？';
        value.setAttribute('aria-label', '未発見の文字');
      }

      const footer = document.createElement('div');
      footer.className = 'keyword-card-footer';
      if (visited) {
        const link = document.createElement('a');
        link.href = `qr/${window.QuizRoutes.fileFor(item.id, record.suffix)}`;
        link.className = 'card-link';
        link.textContent = `${item.spot}のクイズをふり返る`;
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = ' ↗';
        link.append(arrow);
        footer.append(link);
      } else {
        const text = document.createElement('span');
        text.className = 'card-hint';
        text.textContent = 'QRコードを読み取って発見';
        footer.append(text);
      }
      li.append(header, value, footer);
      cards.append(li);
    });

    grid.replaceChildren(cards);
    completion.hidden = count !== total;
    if (count === total) window.QuizCelebration.activate();
    else grid.classList.remove('is-complete');

    let message = '';
    if (!state.available) {
      message = 'このブラウザでは進捗を読み取れません。通常モードで開くか、ブラウザの保存設定をご確認ください。';
    } else if (state.corrupted) {
      message = '保存済みの進捗の一部を読み取れませんでした。該当するクイズを開くと、文字を記録し直せます。';
    }
    warning.textContent = message;
    warning.hidden = !message;
  }

  function refresh() {
    const state = progress.read();
    const display = JSON.stringify([[...state.records], state.ids, state.available, state.corrupted]);
    if (display !== previousDisplay) {
      previousDisplay = display;
      render(state);
    }
  }

  refresh();
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(`${storageKey}:visit:`)) refresh();
  });
}());
