# examples の使い分け

用途の異なる例を同じ階層に置いています。公開レイアウトの有効状態は examples ではなく [自動生成のレイアウト判定表](../docs/layout-inventory.md) を参照してください。

| エントリ | 役割 | 自動テスト・検証の対象 |
|---|---|---|
| `design-contract.md` | 旧interfaceのデータ契約を説明する単体デッキ | 直接の対象外 |
| `design-contract/` | `designs/acme/` を含む実行可能なカスタムデザイン例 | `packages/core/tests/check-cli.test.mjs` と旧デザインのブラウザ検証で使用 |
| `design-library/` | デザインを共有packageとして配布する構成例 | 直接の対象外 |
| `phase1/` | 基本10IDのCorporateサンプル | `phase1.test.mjs`、`phase2-expansion.test.mjs`、`phase1:check`、`phase1:browser` で使用 |
| `phase2/` | 基本10IDをEditorialで描画するサンプル | `phase2.test.mjs`、`phase2:check`、`phase2:browser` で使用 |
| `phase2-expansion/` | 公開17IDすべてのサンプル | `phase2-expansion.test.mjs`、`phase2:expansion:check`、`phase2:expansion:browser` で使用 |
| `slidev-template/` | 外部GitHubテンプレートを指定する手順例 | 直接の対象外 |
| `template-library/` | 複数の社内テンプレートを配布する構成例 | 直接の対象外 |
