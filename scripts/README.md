# 開発用スクリプト

リポジトリルートから既存のnpm scriptsで実行します。

- `phase1/generate-catalog.mjs`：`npm run catalog` / `catalog:check`。レジストリからカタログ・テンプレート・サンプルを生成／照合。
- `phase1/check-phase1.mjs`：`npm run phase1:check`。Phase 1のデッキ入力検査。
- `phase1/phase1-lib.mjs`：上記とテスト・ブラウザ検証で共有するレジストリ読込・生成・検査処理。
- `phase1/verify-phase1-browser.mjs`：`npm run phase1:browser`。実ブラウザ・PDF検証。`catalog/previews/` の画像を更新するため、必要なときだけ実行。
- `sync-theme.mjs`：`postinstall`。ルートのローカルテーマ参照を同期。配置・役割は従来どおり。
- `e2e.mjs`：`npm run e2e`。GitHub root packageの隔離環境でinit・インストール・ビルドを検証（CLI tarballの試験ではない）。
- `phase2/verify-cli-distribution.mjs`：`node scripts/phase2/verify-cli-distribution.mjs [--baseline]`。HEADのpackagesをtmpへ展開し、現在のCLI manifestでpack→tarball内容assert→隔離install→installed Slidevで両preset画像build。baselineはpublic除外時のENOENTをassertする。実checkoutのCLIではpackしない。結果は `dist/phase2-distribution/`。CLI checker込みのE2Eではない（[制約](../docs/phase2/distribution-legacy-verification.md)）。
- `phase2/verify-legacy-browser.mjs`：`node scripts/phase2/verify-legacy-browser.mjs`。default/mono/dark/acme × cover/content/comparison/summary/endの実Chromium検証。生成fixture・PNG・reportは `dist/phase2-legacy/` のみ。

- `phase2/verify-cli-kit.mjs`：`node scripts/phase2/verify-cli-kit.mjs`。現在のpackagesをtmpへコピーしてpackし、隔離インストールした実 `slidev-kit build` で両presetの正常入力・不正入力を検査する（[詳細](../docs/phase2/cli-contract-verification.md)）。
- `phase2/verification-run.mjs`：配布・実CLI・legacy検証のrun別出力と最新状態を管理する。各baseの `latest.json` が `success` の場合だけ、そのreport参照を最新成功の根拠にする。固定パスに残る古いreportは履歴であり、最新結果として使わない。

公開パッケージの構造、`examples/phase1/` と `catalog/` の公開パスは変更しません。
