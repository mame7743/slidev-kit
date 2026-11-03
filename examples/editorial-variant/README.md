# チュートリアル: 本文を変えずにデザインを切り替える

Corporateの基本レイアウト例と本文データを揃え、テーマvariantだけをEditorialにした比較用サンプルです。

- **入力データ:** [`slides.md`](./slides.md) の基本10レイアウトfixture
- **説明する機能:** `themeConfig.variant: editorial`によるデッキ全体のデザイン切り替え
- **出力:** [PDF（10枚）](./exports/editorial-variant.pdf)

## 見方

[`slides.md`](./slides.md)のvariant設定を確認し、[基本レイアウトPDF](../core-layouts/exports/core-layouts.pdf)と同じページの構造・見た目を比較します。比較時に本文とレイアウトfixtureは共通なので、差分をデザインvariantに絞れます。

このファイルは生成fixtureです。直接編集せず、再生成とPDF出力をリポジトリルートで行います。

```sh
node scripts/phase2/check-phase2.mjs --write
npm run examples:pdf
```
