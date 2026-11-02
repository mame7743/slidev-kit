# Phase 1のフォルダ整理

## 確定した構造と運用

- 設計・執筆ガイド・検証結果は `docs/phase1/` に集約。ファイル名は `phase1-design.md` / `phase1-usage.md` / `phase1-verification.md` のまま。
- 生成・入力検査・共通処理・ブラウザ検証は `scripts/phase1/` に集約。npm scripts名は維持し、実行先とテストのimportだけを更新。共通処理のリポジトリroot・レジストリ参照は階層に合わせて調整。
- 文書索引は [docs/README.md](../README.md)、スクリプトの役割は [scripts/README.md](../../scripts/README.md)。既存の拡張機能とPhase 1、開発記録を区別する。
- 生成元の執筆ガイドリンクを更新し、`npm run catalog` で22ファイルを再生成。`examples/phase1/`、`catalog/`、画像、公開パッケージ構造、ルートテーマ参照、`sync-theme` / `postinstall`、依存・lockfileは維持。デッキ基準の `theme: ../../` は変更しない。

## 今回の検証結果

- `git diff --check`：空白エラーなし。
- `npm run verify`：17ファイル79テストと `vue-tsc --noEmit` 成功。
- `npm run catalog:check`：22生成ファイル一致。
- `npm run phase1:check`：サンプルデッキの検査成功。
- `npm run build`：入力検査とSlidev 53.0.0のWebビルド成功（出力は `examples/phase1/dist/`）。
- 移動前の文書・スクリプトへの参照残りを検索し、残存なしを確認。
- インストール/prepackを伴うE2E、画像を上書きする `phase1:browser`、PDF exportは今回未実施。過去のブラウザ/PDF検証結果は [既存の検証記録](../phase1/phase1-verification.md) を参照。依存監査など既存の制約は今回の整理では解消しない。
