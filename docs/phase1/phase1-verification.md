# Phase 1 検証結果

実施日: **2026-11-02**。macOS / Node.js **26.8.1** / npm **11.19.0** / Slidev **53.0.0** / Vue **3.5.44** / Playwright Chromium **1.61.1**。プロジェクトの最低Node.jsバージョンは22.12。最低バージョンと他OSでの実機検証は未実施です。

## 実行結果

| コマンド | 結果 |
|---|---|
| `npm run verify` | 17テストファイル、79テスト成功。`vue-tsc --noEmit` 成功 |
| `npm run catalog:check` | 説明・テンプレート・デッキの22生成ファイルが定義と一致 |
| `npm run phase1:check` | 10枚のID、variant、density、slot、見出し、YAML検査成功 |
| `npm run build` | 検査とSlidevのWebビルド成功 |
| `npm run export` | `dist/phase1.pdf` 出力成功 |
| `npm run phase1:browser` | 実Chromiumで10レイアウトを表示、スクリーンショット生成、PDF検査成功 |
| `git diff --check` | 差分の空白エラーなし |

`phase1:browser` の検査内容:

- 独立したSlidev dev serverを起動し、各レイアウトの見出し・必須パネル・表の行数・Mermaid SVG・画像読み込みを確認。
- 対応variantと3種類のdensityの組み合わせを実DOMの属性に適用し、CSSの収まりと本文不変を確認。VueのFrontmatterからの属性反映は通常デッキ、各組み合わせの入力可否は単体テストでも検査。
- chartのSVGが見出し・出典注記に重ならないこと、Corporateアクセント色が適用されることを検査。
- 故意に長文を追加し、はみ出し警告と入力内容の保持を確認。
- Slidev標準のPDF exporterで出力後、pdf-libで**10ページ・全ページ16:9・各ページの内容ストリーム**を検査。

さらに生成済みPDFをmacOS PDFKitで画像化・文字抽出し、全10枚のコンタクトシートで日本語・図・表・グラフ・フッターを確認しました。初回に見つかったグラフの軸ラベルと注記の重なりは修正済みです。この画像化は今回の手動検証であり、リポジトリの必須依存やCIには追加していません。

## 確認用の生成物

- ブラウザの各ページ: [`catalog/previews/`](../../catalog/previews/)
- 通常のPDF: `dist/phase1.pdf`
- 検証時のPDF: `dist/phase1-verification/catalog.pdf`
- ブラウザ/PDFの機械可読結果: `dist/phase1-verification/report.json`
- 開発サーバーログ: `dist/phase1-verification/dev-server.log`

`dist/` はGit管理外です。再現にはREADMEのコマンドを使用してください。

## 既知の診断と限界

- Slidev 53 / Shiki Twoslashの初期化時に `Failed to patch FloatingVue TypeError: Cannot read properties of undefined (reading 'Popper')` が出ます。今回の10枚の表示・Mermaid・PDFは検証済みですが、Twoslashのホバー機能までは検証していません。
- ヘッドレスChromiumでは `Wake Lock permission request denied` が出ます。描画・PDFには影響しません。
- ブラウザ検証は上の2診断だけを別欄へ記録し、その他のconsole error / page error / HTTPエラーでは失敗します。「全コンソール診断なし」を意味する結果ではありません。
- サンプル以外の任意コンテンツ、全フォント環境、複雑なMermaid図に対する収まり・文字重なり・最小フォントサイズの完全検証は行いません。最終PDFの人間による確認が必要です。
- Phase 1は既存CLIの検査規約を変更せず、標準 `slidev` コマンドと専用 `phase1:check` を使用します。既存の対話init、AI、外部デザイン配布、MCPの統合E2Eは今回未実施です。

## 依存監査：未解決

`npm audit --json` は**8件（critical 1 / high 4 / moderate 3）**を報告し、監査は成功扱いにしていません。Slidev系の推移依存（DOMPurify、image-size等）を含みます。VueはSlidevの要求と揃う3.5.44へ更新しましたが、監査全体は未解決です。

npmの自動修正提案にはSlidev **52.6.0へのダウングレード**が含まれるため、APIの互換性を確認せず `npm audit fix --force` は行っていません。第三者の未検証Markdown・HTML・画像を処理したり、開発サーバーを外部公開したりする前に、依存修正と再検証が必要です。

参考アドバイザリ:

- https://github.com/advisories/GHSA-cmwh-pvxp-8882
- https://github.com/advisories/GHSA-55q2-fjhq-7xh7
- https://github.com/advisories/GHSA-5p2g-fcmc-qvqq

Talk、40レイアウト、独自Gantt、Pi Agentの新規実装はPhase 1の検証対象外です。
