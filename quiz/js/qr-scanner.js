/* 全ページ共通QRリーダー：カメラ映像と選択した写真は端末内でのみ解析する。 */
(function () {
  'use strict';
  const config = window.QUIZ_CONFIG;
  const script = document.currentScript;
  // /quiz/ のようなサブディレクトリでも動作するよう、JSの設置位置からサイトルートを求める。
  const siteRoot = new URL('../', script.src);
  const knownPages = new Map(config.items.map((item) => {
    const page = new URL(`qr/${item.file}`, siteRoot);
    return [page.pathname, { title: item.spot, url: page.href }];
  }));

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scan-cta';
  button.innerHTML = '<span class="scan-cta-icon" aria-hidden="true">▣</span><span>次のQRコードを読み取る</span><span aria-hidden="true">→</span>';
  const anchor = document.querySelector('.unlock-panel .primary-button') || document.querySelector('.progress-panel');
  if (!anchor) return;
  anchor.insertAdjacentElement('afterend', button);

  const modal = document.createElement('div');
  modal.id = 'scanner-modal';
  modal.className = 'scanner-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'scanner-title');
  modal.innerHTML = `
    <div class="scanner-dialog">
      <div class="scanner-heading">
        <div><span class="section-kicker">SCAN THE NEXT CODE</span><h2 id="scanner-title">QRコードを読み取る</h2></div>
        <button type="button" class="scanner-close" aria-label="読み取り画面を閉じる">×</button>
      </div>
      <div class="scanner-preview">
        <video id="scanner-video" muted playsinline autoplay aria-label="QRコード読み取り用のカメラ映像"></video>
        <div class="scanner-guide" aria-hidden="true"><span class="scanner-target"></span></div>
        <p class="scanner-preview-hint">四角の中にQRコードを合わせてください</p>
      </div>
      <p id="scanner-status" class="scanner-status" role="status" aria-live="polite">カメラの起動を準備しています。</p>
      <div class="scanner-actions">
        <button type="button" class="scanner-action scanner-retry" hidden>カメラを再試行</button>
        <button type="button" class="scanner-action scanner-pick">写真から読み取る</button>
        <input class="scanner-file" type="file" accept="image/*" hidden aria-label="QRコード画像を選択">
        <button type="button" class="scanner-action scanner-stop">閉じる</button>
      </div>
      <p class="scanner-note">読み取れるのはこのクイズの7つのQRコードだけです。映像や写真をサーバーへ送信しません。</p>
    </div>`;
  document.body.append(modal);

  const video = modal.querySelector('#scanner-video');
  const preview = modal.querySelector('.scanner-preview');
  const status = modal.querySelector('#scanner-status');
  const retry = modal.querySelector('.scanner-retry');
  const fileInput = modal.querySelector('.scanner-file');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let open = false;
  let stream = null;
  let frameId = 0;
  let generation = 0;
  let lastFrame = 0;
  let previousFocus = null;
  let detector = null;

  // URLは文字列の前方一致ではなく、同一オリジン＋登録済みパスで厳密に照合する。
  function matchUrl(raw) {
    if (typeof raw !== 'string') return null;
    let parsed;
    try { parsed = new URL(raw.trim()); } catch (error) { return null; }
    if (parsed.origin !== siteRoot.origin || parsed.username || parsed.password || parsed.protocol !== siteRoot.protocol) return null;
    return knownPages.get(parsed.pathname) || null;
  }

  function say(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  function stopCamera() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    preview.classList.remove('is-live');
  }

  function closeScanner() {
    if (!open) return;
    open = false;
    generation++;
    stopCamera();
    modal.hidden = true;
    document.body.classList.remove('scanner-is-open');
    fileInput.value = '';
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }

  function onDetected(raw) {
    const found = matchUrl(raw);
    if (!found) {
      say('このクイズのQRコードではありません。別のコードを読み取ってください。', true);
      return false;
    }
    say(`${found.title}の解説ページへ移動します。`);
    closeScanner();
    window.location.assign(found.url);
    return true;
  }

  function createDetector() {
    if (typeof window.jsQR === 'function') return true;
    if (typeof window.BarcodeDetector !== 'function') return false;
    try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); return true; }
    catch (error) { return false; }
  }

  async function decodeFrame(source, width, height) {
    if (!context) return null;
    const maxSide = 1100;
    const ratio = Math.min(1, maxSide / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    if (typeof window.jsQR === 'function') {
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const found = window.jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
      return found ? found.data : null;
    }
    if (detector) {
      const codes = await detector.detect(canvas);
      return codes.find((code) => code.format === 'qr_code')?.rawValue || null;
    }
    return null;
  }

  async function inspect(timestamp, token) {
    if (!open || !stream || token !== generation) return;
    if (timestamp - lastFrame > 170 && video.readyState >= 2 && video.videoWidth > 0) {
      lastFrame = timestamp;
      try {
        const decoded = await decodeFrame(video, video.videoWidth, video.videoHeight);
        if (!open || token !== generation) return;
        if (decoded && onDetected(decoded)) return;
      } catch (error) {
        // 一時的なフレーム取得失敗ではカメラを止めず、次のフレームを試す。
        console.warn('QR frame decode error:', error);
      }
    }
    if (open && token === generation && stream) frameId = requestAnimationFrame((time) => { void inspect(time, token); });
  }

  async function startCamera() {
    const token = ++generation;
    stopCamera();
    retry.hidden = true;
    say('カメラを起動しています。必要な場合は使用を許可してください。');
    if (!createDetector()) {
      say('QR読み取りプログラムを読み込めませんでした。通信環境を確認し、ページを再読み込みしてください。', true);
      retry.hidden = false;
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !context) {
      say('この環境ではカメラを起動できません。HTTPSのページでお試しください。', true);
      retry.hidden = false;
      return;
    }
    let acquired = null;
    try {
      try {
        acquired = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (error) {
        if (error.name !== 'OverconstrainedError' && error.name !== 'NotFoundError') throw error;
        acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }
      if (!open || token !== generation) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      video.srcObject = stream;
      await video.play();
      if (!open || token !== generation) return;
      preview.classList.add('is-live');
      say('カメラをQRコードに向けてください。');
      lastFrame = 0;
      frameId = requestAnimationFrame((time) => { void inspect(time, token); });
    } catch (error) {
      if (!open || token !== generation) return;
      stopCamera();
      retry.hidden = false;
      const messages = {
        NotAllowedError: 'カメラの使用が許可されませんでした。ブラウザの設定で許可するか、写真から読み取ってください。',
        NotFoundError: '使用できるカメラが見つかりません。写真から読み取ってください。',
        NotReadableError: 'ほかのアプリがカメラを使用している可能性があります。閉じてから再試行してください。',
        SecurityError: 'カメラを使用できません。HTTPSで開いているか確認してください。'
      };
      say(messages[error.name] || 'カメラを起動できませんでした。写真からの読み取りもお試しください。', true);
    }
  }

  function showScanner() {
    if (open) return;
    open = true;
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('scanner-is-open');
    modal.querySelector('.scanner-close').focus();
    void startCamera();
  }

  async function inspectFile(file) {
    if (!file || !open) return;
    if (!file.type.startsWith('image/')) { say('画像ファイルを選択してください。', true); return; }
    if (file.size > 20 * 1024 * 1024) { say('画像が大きすぎます。20MB以下の写真を選択してください。', true); return; }
    if (!createDetector()) { say('QR読み取りプログラムを読み込めませんでした。', true); return; }
    const token = ++generation;
    stopCamera();
    retry.hidden = false;
    say('選択した画像を解析しています。');
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      });
      const decoded = await decodeFrame(image, image.naturalWidth, image.naturalHeight);
      if (!open || token !== generation) return;
      if (!decoded) say('QRコードが見つかりませんでした。明るく鮮明な写真で再度お試しください。', true);
      else onDetected(decoded);
    } catch (error) {
      if (open && token === generation) say('画像を読み取れませんでした。別の写真をお試しください。', true);
    } finally {
      URL.revokeObjectURL(objectUrl);
      fileInput.value = '';
    }
  }

  button.addEventListener('click', showScanner);
  modal.querySelector('.scanner-close').addEventListener('click', closeScanner);
  modal.querySelector('.scanner-stop').addEventListener('click', closeScanner);
  retry.addEventListener('click', () => { void startCamera(); });
  modal.querySelector('.scanner-pick').addEventListener('click', () => { fileInput.click(); });
  fileInput.addEventListener('change', () => { void inspectFile(fileInput.files[0]); });
  modal.addEventListener('mousedown', (event) => { if (event.target === modal) closeScanner(); });
  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); closeScanner(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not([disabled])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (open && document.hidden) {
      generation++;
      stopCamera();
      retry.hidden = false;
      say('カメラを停止しました。再開する場合は「カメラを再試行」を押してください。');
    }
  });
  window.addEventListener('pagehide', () => { generation++; stopCamera(); });
}());
