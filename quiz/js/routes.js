/* QRのURL形式を共有する。個別ページのファイル名一覧は配信しない。 */
(function () {
  'use strict';
  const spots = new Map(window.QUIZ_CONFIG.items.map((item) => [item.id, item]));

  function isSuffix(suffix) {
    return typeof suffix === 'string' && suffix.length === 4 && /^[a-z0-9]+$/i.test(suffix);
  }

  function parseFile(file) {
    const match = /^answer_([1-9]\d*)_([A-Za-z0-9]{4})\.html$/.exec(file);
    if (!match || match[0] !== file) return null;
    const id = Number(match[1]);
    const suffix = match[2];
    const spot = spots.get(id);
    if (!spot) return null;
    return { spot, suffix, file };
  }

  function fileFor(id, suffix) {
    return `answer_${id}_${suffix}.html`;
  }

  function dataFileFor(file) {
    return file.replace(/\.html$/, '.json');
  }

  window.QuizRoutes = Object.freeze({ isSuffix, parseFile, fileFor, dataFileFor });
}());
