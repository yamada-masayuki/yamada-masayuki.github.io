/* 地点ごとに発見した文字と回答URLの識別子を保存する。 */
(function () {
  'use strict';
  const { storageKey, items } = window.QUIZ_CONFIG;
  const { isSuffix } = window.QuizRoutes;
  const allowedIds = new Set(items.map((item) => item.id));
  const recordKey = (id) => `${storageKey}:visit:${id}`;

  function isToken(value) {
    return typeof value === 'string' && [...value].length === 1 && value.trim() !== '';
  }

  function read() {
    const records = new Map();
    let corrupted = false;
    try {
      for (const id of allowedIds) {
        const value = window.localStorage.getItem(recordKey(id));
        if (value === null) continue;
        try {
          const record = JSON.parse(value);
          if (isToken(record?.token) && isSuffix(record.suffix) && Number.isFinite(record.visitedAt)) {
            records.set(id, record);
          } else {
            corrupted = true;
          }
        } catch {
          corrupted = true;
        }
      }
    } catch {
      return { ids: [], records: new Map(), available: false, corrupted: false };
    }

    const ids = [...records.keys()].sort((a, b) => records.get(a).visitedAt - records.get(b).visitedAt);
    return { ids, records, available: true, corrupted };
  }

  function markVisited(id, suffix, token) {
    if (!allowedIds.has(id) || !isSuffix(suffix) || !isToken(token)) return { ok: false, added: false };
    const state = read();
    if (!state.available) return { ok: false, added: false };
    const existing = state.records.get(id);
    if (existing?.token === token && existing.suffix === suffix) return { ok: true, added: false };
    try {
      const visitedAt = existing?.visitedAt ?? (performance.timeOrigin + performance.now());
      window.localStorage.setItem(recordKey(id), JSON.stringify({ suffix, token, visitedAt }));
      return { ok: true, added: !existing };
    } catch {
      return { ok: false, added: false };
    }
  }

  function clear() {
    for (const id of allowedIds) window.localStorage.removeItem(recordKey(id));
    window.localStorage.removeItem(`${storageKey}-celebration-seen-v1`);
  }

  window.QuizProgress = Object.freeze({ read, markVisited, clear, isToken });
}());
