# Phase2第1段階 検証結果

## 実行済み

- `npx vitest run packages/core/tests/phase2.test.mjs packages/core/tests/phase1.test.mjs`: 12 tests成功。
- `npm run verify`: 18ファイル84 tests + Vue/TypeScript型検査成功。
- `npm run catalog:check`: 22生成ファイル一致。`npm run phase1:check` / `npm run phase2:check`: 成功。
- `npm run build`: Corporateサンプルbuild成功（`examples/phase1/dist/`）。
- `npx slidev build examples/phase2/slides.md --out dist/phase2`: Editorialサンプルbuild成功。Slidevのoutはデッキ相対なので実際の出力先は `examples/phase2/dist/phase2/`。
- `npm run phase2:browser`: 実Chromiumで両preset各10枚の表示/DOM/slot/表行数/画像ロード/overflow/色を確認。全16構造variant × 3密度 = 48組/preset（計96組）で本文不変・境界内を確認。
- 同ブラウザ検査でMermaid shadow root内のラベル文字列重複なし、ラベル間の矩形重複なし、タイトル/出典との非重複、preset色を確認。長文挿入によるoverflow警告と入力保持も成功。
- Slidev実PDF出力をpdf-libで解析し、両preset各10ページ、16:9、content stream存在を確認。
- Corporate全10枚の新旧PNGをChromium canvasでRGBA比較。既存 `catalog/previews/` と各1440×810で完全一致、変更pixelは全て0。結果は `dist/phase2-verification/corporate/visual-regression.json`。

## 成果物

- `dist/phase2-verification/corporate/report.json`
- `dist/phase2-verification/editorial/report.json`
- 同各フォルダの `previews/{cover,section,content,split,comparison,cards,visual,chart,table,roadmap}.png`
- 同各フォルダの `catalog.pdf` / `dev-server.log`
- `dist/phase2-browser.log`: 再検証時の標準出力/標準エラー

代表画像としてEditorialのcover/chart、Corporateのcomparisonを目視し、白地/墨色/朱色、余白、ラベル、本文が意図通りであることを確認した。画像生成だけではなく上記DOM/実SVG/PDF検査を併用した。既存catalog・Phase1本文・previewには変更なし。

## 既知の制約と失敗修正履歴

- 初回のテスト専用SFC loaderのCommonJS default import処理を修正。初回型検査のpresetモジュール宣言不足を `.d.mts` 追加で修正。修正後は全て成功。
- Slidev 53上流の既存許可対象 `Failed to patch FloatingVue ... Popper` と `Wake Lock permission request denied` はreportに記録する。許可リスト追加なし、それ以外のbrowser error/HTTP errorは0。
- 全variant/densityのブラウザ検証はPhase1と同じくDOM属性を変更してCSSを実行する。入力からの分岐は実SFCのSSRテストと実デッキの各初期設定で検査する。SSR互換性テストの旧interface子コンポーネントはstubであり、旧デザイン全体のブラウザ再検査ではない。
- 任意の入力/図の衝突を完全保証しない。PDFの全ページピクセル検査は対象外。フォントはOS環境に依存する。

## 独立レビュー

- 今回の差分に起因する修正必須の新規不具合は確認されなかった。親セッションでも84テスト・型検査・カタログ照合・両デッキ入力検査・両ビルドを再実行し、代表画像を目視した。
- 既存の配布上の懸念：`packages/cli/package.json` の `files` にルート `public` がなく、prepackでコピーした画像とVite aliasの参照先が公開tarballで一致するか未検証。公開前にtarball内容と画像付きデッキの隔離ビルドを確認する。今回のEditorial固有asset追加やmanifest変更に起因する問題ではない。
- 非preset指定時の7 IDのCorporate fallbackと、Mermaid setupが設定を返さない挙動の不整合は既存事項。今回の両presetの検証対象とは区別する。
- 同一マウント後のpreset切替とMermaid再描画、旧デザイン全体の実ブラウザ互換性は未検証。
