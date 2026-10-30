# クイズで巡る東大本郷：解答・解説ページ（仕様書 Ver. 1.0 対応）

HTML、CSS、JavaScript だけで動く、静的Webサイトの試作版です。クイズの問題・正解・解説・設置場所は **仮データ** です。

## ファイル構成
- `index.html`：キーワード7枠と進捗の一覧ページ
- `qr/answer_{番号}_{ランダム4字}.html`：各QRコード専用の解答・解説ページ（7件）
- `js/config.js`：問題文、正解、解説、キーワード、各ページのファイル名を設定
- `js/progress.js`：localStorage に訪問済みの問題IDを保存・取得
- `js/index.js`：一覧ページと進捗を表示
- `js/answer.js`：問題ページの表示と訪問履歴の自動記録
- `css/style.css`：共通スタイル
- `assets/images/`：サイト内で使う装飾イラスト（SVG）
- `QR_URL一覧.csv`：QRコードのリンク作成に使う相対URL一覧

## 動作確認
1. プロジェクトフォルダーで `python -m http.server 8000` を実行します。
2. ブラウザで `http://localhost:8000/index.html` を開きます。
3. `QR_URL一覧.csv` に載っているURLのいずれか（例 `http://localhost:8000/qr/answer_1_XXXX.html`）にアクセスします。
4. キーワード一覧に戻ると、アクセスした問題の文字が解放され、収集数が増えます。
5. 同じページを繰り返し開いても収集数は増えません。7ページすべて開くと完成した言葉が表示されます。

`file://` でHTMLファイルを直接開く場合、ブラウザによって localStorage の動作が異なるため、HTTPサーバー経由で確認してください。

## 公開時の手順
1. GitHub Pages、Netlify、一般的な静的Webホスティングなどに、このフォルダーの内容をそのまま配置します。
2. **公開URLと `QR_URL一覧.csv` の相対URLを組み合わせて**、7個のQRコードを作ります。
3. 問題文・正解・解説・キーワードは `js/config.js` を編集してください。ページのURLを変える場合は、実際のファイル名と `file` の値、QRコードのURLを必ずそろえてください。
4. このプロジェクトのクイズ内容は仮置きであり、現地のQR設置箇所と問題内容の確認が必要です。

## 保存仕様・注意
- 保存キー：`todai-hongo-quiz-progress-v1`
- 保存形式：訪問済み問題IDの配列（例 `[1, 3, 5]`）
- 各問題ページを開いた時点で自動保存します。訪問順に依存せず、番号順に一覧表示します。
- 進捗はブラウザ・端末間で同期されません。ブラウザデータ消去で失われる場合があります。
- 保存できない状態や保存データ破損時にはメッセージを表示し、ページ全体の表示は続けます。
- テストデータを初期化する場合は、ブラウザの開発者ツールで `localStorage.removeItem('todai-hongo-quiz-progress-v1')` を実行して一覧を再読込してください。
- 未訪問ページへの一覧からの直接リンクは表示しません。URLの推測やソース解析による解放の防止機能はありません（仕様書の実装対象外）。
- クイズは現地の歴史を踏まえた仮稿です。参加者への公開前に主催者が内容を確認してください。

## 確認した資料（クイズ仮稿の参考）
- [赤門：東京大学](https://www.u-tokyo.ac.jp/ja/about/campus-guide/b07_04_a.html)
- [安田講堂：東京大学](https://www.u-tokyo.ac.jp/adm/history/09_04_02_j.html)
- [三四郎池：東京大学](https://www.u-tokyo.ac.jp/focus/ja/features/z0508_00267.html)
- [総合図書館：東京大学](https://www.lib.u-tokyo.ac.jp/ja/library/contents/guide/general)
- [東京大学の創立：東京大学](https://www.u-tokyo.ac.jp/adm/history/09_01_01_j.html)
