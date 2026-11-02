# 開発用スクリプト

リポジトリルートから既存のnpm scriptsで実行します。

- `phase1/generate-catalog.mjs`：`npm run catalog` / `catalog:check`。レジストリからカタログ・テンプレート・サンプルを生成／照合。
- `phase1/check-phase1.mjs`：`npm run phase1:check`。Phase 1のデッキ入力検査。
- `phase1/phase1-lib.mjs`：上記とテスト・ブラウザ検証で共有するレジストリ読込・生成・検査処理。
- `phase1/verify-phase1-browser.mjs`：`npm run phase1:browser`。実ブラウザ・PDF検証。`catalog/previews/` の画像を更新するため、必要なときだけ実行。
- `sync-theme.mjs`：`postinstall`。ルートのローカルテーマ参照を同期。配置・役割は従来どおり。
- `e2e.mjs`：`npm run e2e`。隔離環境でinit・インストール・ビルドを検証。

公開パッケージの構造、`examples/phase1/` と `catalog/` の公開パスは変更しません。
