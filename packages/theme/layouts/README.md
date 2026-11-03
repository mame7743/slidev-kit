# レイアウト実装

直下の17ファイルは `packages/theme/registry/layouts.json` に登録された公開レイアウトです。`extras/` はregistry・catalog対象外ですが、Slidevのlayouts再帰走査によるbasename登録で手書き利用でき、既存テストでも使用します。catalogサンプルとpreviewは生成しません。公開状態と実装種別は [レイアウト判定表](../../../docs/layout-inventory.md) を参照してください。

## 追加手順

1. 公開するIDを `packages/theme/registry/layouts.json` に追加し、直下へ同名のVueファイルを置く。
2. `npm run catalog` と `npm run inventory` を実行してサンプル・判定表を更新する。
3. `npm run verify` と各check/browser検証を実行する。
