/* 訪問済みの問題IDを localStorage に保存する。認証・サーバー通信は行わない。 */
(function () {
  'use strict';
  const config = window.QUIZ_CONFIG;
  const key = config.storageKey;
  const allowedIds = new Set(config.items.map((item) => item.id));

  function normalizeIds(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id) => Number.isInteger(id) && allowedIds.has(id)))].sort((a, b) => a - b);
  }

  function read() {
    try {
      const text = window.localStorage.getItem(key);
      if (text === null) return { ids: [], available: true, corrupted: false };
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return { ids: [], available: true, corrupted: true };
      return { ids: normalizeIds(parsed), available: true, corrupted: false };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { ids: [], available: true, corrupted: true };
      }
      return { ids: [], available: false, corrupted: false };
    }
  }

  function markVisited(id) {
    if (!allowedIds.has(id)) return { ok: false, added: false, state: read() };
    const state = read();
    if (!state.available) return { ok: false, added: false, state };
    if (state.ids.includes(id) && !state.corrupted) {
      return { ok: true, added: false, state };
    }
    const nextIds = normalizeIds([...state.ids, id]);
    try {
      window.localStorage.setItem(key, JSON.stringify(nextIds));
      return { ok: true, added: !state.ids.includes(id), state: { ids: nextIds, available: true, corrupted: false } };
    } catch (error) {
      return { ok: false, added: false, state: { ...state, available: false } };
    }
  }

  window.QuizProgress = Object.freeze({ read, markVisited });
}());
