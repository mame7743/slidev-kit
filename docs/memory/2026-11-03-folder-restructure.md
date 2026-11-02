# 2026-11-03 レイアウトフォルダ再編

## 決定

- `packages/core/layouts/` 直下はregistry登録済みの公開17レイアウトだけにする。
- registry・catalog対象外の `body / columns / figure / matrix / plan` は削除せず `packages/core/layouts/extras/` に分離する。Slidevのlayouts再帰走査によるbasename登録で手書き利用でき、既存テストでも使用するが、catalogサンプルとpreviewは生成しない。
- 実装種別はフォルダを増やして表現せず、自動生成する `docs/layout-inventory.md` で `KitSlide専用 / hybrid / 旧interface` を判定する。
- `KitSlide.vue` と `ContentLayout.vue` は `packages/core/components/kit/` にまとめる。
- examplesは移動せず、`examples/README.md` で用途と自動検証対象を明示する。

## 運用

公開レイアウトを追加するときはregistryと同名wrapperを追加し、catalogとinventoryを生成する。公開状態の確認にフォルダ名や記憶を使わず、`npm run inventory` で生成される判定表を唯一の正とする。CI相当の確認では `npm run inventory:check` を既存のcatalog・phase・browser検証と併用する。

## 互換性

公開パス互換はこの再編の対象外だが、ファイルは削除していない。extrasはregistry外でも技術的に到達可能なため、公開17IDとの混同を避けて判定表を参照する。ルートsymlinkはSlidevテーマと配布構成の入口なので維持する。検証スクリプトのassert・対象・browser検査は弱めない。
