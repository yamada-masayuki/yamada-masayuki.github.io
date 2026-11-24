(function () {
  'use strict';
  const pageId = Number(document.body.dataset.pageId);
  const item = window.QUIZ_CONFIG.items.find((value) => value.id === pageId);
  if (!item) {
    document.getElementById('answer-title').textContent = 'ページが見つかりません';
    document.getElementById('answer-main').hidden = true;
    return;
  }

  const readings = {
    赤門: 'あかもん', 建立: 'こんりゅう', 加賀藩: 'かがはん', 前田家: 'まえだけ',
    徳川家斉: 'とくがわいえなり', 溶姫: 'ようひめ', 創建: 'そうけん', 移築: 'いちく',
    御守殿門: 'ごしゅでんもん', 焼失: 'しょうしつ', 慣習: 'かんしゅう',
    関東大震災: 'かんとうだいしんさい', 建造物: 'けんぞうぶつ', 国宝: 'こくほう',
    重要文化財: 'じゅうようぶんかざい',
    正門: 'せいもん', 銀杏並木: 'いちょうなみき', 東京帝国大学: 'とうきょうていこくだいがく',
    総長: 'そうちょう', 濱尾新: 'はまおあらた', 襟: 'えり', 厳粛: 'げんしゅく',
    本多静六: 'ほんだせいろく',
    安田講堂: 'やすだこうどう', 大講堂: 'だいこうどう', 塔屋: 'とうや',
    高低差: 'こうていさ', 崖下: 'がけした', 崖: 'がけ',
    育徳園心字池: 'いくとくえんしんじいけ', 育徳園: 'いくとくえん', 心字池: 'しんじいけ',
    三四郎池: 'さんしろういけ', 三四郎: 'さんしろう', 夏目漱石: 'なつめそうせき',
    法文1号館: 'ほうぶんいちごうかん', 校舎群: 'こうしゃぐん',
    建築様式: 'けんちくようしき', 内田: 'うちだ', 尖頭: 'せんとう',
    大聖堂: 'だいせいどう', 意匠: 'いしょう', 鉄筋コンクリート構造: 'てっきんコンクリートこうぞう',
    融合: 'ゆうごう',
    総合図書館: 'そうごうとしょかん', 蔵書: 'ぞうしょ', 教訓: 'きょうくん',
    鉄骨鉄筋コンクリート造: 'てっこつてっきんコンクリートぞう', 頑丈: 'がんじょう',
    工学部広場: 'こうがくぶひろば', 前身: 'ぜんしん', 基部: 'きぶ',
    機械工学: 'きかいこうがく', 造船学: 'ぞうせんがく', 蒸気機関: 'じょうききかん',
    船舶: 'せんぱく', 近代工業: 'きんだいこうぎょう', 育成: 'いくせい',
  };
  // 長い語を優先し、「三四郎池」などを途中で分割しない。
  const terms = new RegExp(Object.keys(readings).sort((a, b) => b.length - a.length).join('|'), 'g');
  function putWithRuby(element, text) {
    const content = document.createDocumentFragment();
    let end = 0;
    for (const { 0: term, index } of text.matchAll(terms)) {
      content.append(text.slice(end, index));
      const ruby = document.createElement('ruby');
      const rt = document.createElement('rt');
      rt.textContent = readings[term];
      ruby.append(term, rt);
      content.append(ruby);
      end = index + term.length;
    }
    content.append(text.slice(end));
    element.replaceChildren(content);
  }

  // ページを開いた時点で自動的に解放する。ボタン操作は不要。
  const result = window.QuizProgress.markVisited(pageId);
  if (result.added) window.QuizCelebration.discovery();
  document.title = `${item.title} | クイズで巡る東大本郷`;
  const put = (id, value) => { document.getElementById(id).textContent = value; };
  const fields = {
    'answer-title': item.spot,
    'answer-question': item.question,
    'answer-correct': item.answer,
    'answer-explanation': item.explanation,
  };
  for (const [id, text] of Object.entries(fields)) {
    putWithRuby(document.getElementById(id), text);
  }
  putWithRuby(document.querySelector('.answer-breadcrumb span:last-child'), item.spot);
  document.getElementById('answer-illustration').src = `../assets/images/${item.icon}.svg`;

  const gallery = document.createElement('div');
  gallery.className = 'answer-block answer-gallery';
  gallery.hidden = true;
  const photos = document.createElement('div');
  photos.className = 'answer-photos';
  gallery.append(photos);
  document.querySelector('.correct-block').after(gallery);

  for (const photo of item.photos) {
    const figure = document.createElement('figure');
    figure.hidden = true;
    const image = document.createElement('img');
    image.alt = photo.alt;
    image.decoding = 'async';
    const figcaption = document.createElement('figcaption');
    const caption = document.createElement('p');
    putWithRuby(caption, photo.caption);
    const credit = document.createElement('small');
    credit.textContent = photo.credit;
    figcaption.append(caption, credit);
    figure.append(image, figcaption);
    photos.append(figure);
    image.addEventListener('load', () => {
      image.classList.toggle('is-portrait', image.naturalHeight > image.naturalWidth);
      figure.hidden = false;
      gallery.hidden = false;
    }, { once: true });
    image.src = `../assets/photos/${encodeURIComponent(photo.file)}`;
  }

  put('answer-letter-number', '発見した文字');
  const keyword = document.getElementById('answer-keyword');
  const badge = document.createElement('span');
  badge.className = 'keyword-number';
  badge.textContent = String(item.keywordNumber);
  keyword.replaceChildren(badge, ' ', item.token);
  if (!result.ok) {
    put('answer-record-message', '文字は表示されていますが、このブラウザには記録を保存できませんでした。');
  }
  if (!result.ok) {
    const warning = document.getElementById('storage-warning');
    warning.textContent = 'このブラウザに解放状態を保存できませんでした。文字は表示されていますが、一覧ページに記録されない可能性があります。';
    warning.hidden = false;
  }
}());
