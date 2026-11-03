# チュートリアル: 基本レイアウトと入力の対応を見る

基本10レイアウトを一度に並べ、frontmatterと本文構造が出力にどう現れるか確認するサンプルです。

- **入力データ:** [`slides.md`](./slides.md) の生成fixture（共通の技術報告データを各レイアウトに配置）
- **説明する機能:** 基本10レイアウトとそれぞれが受け取るprops・slotの形
- **出力:** [PDF（10枚）](./exports/core-layouts.pdf)

## 見方

[`slides.md`](./slides.md)の各ページで`layout`、追加props、slot名を確認し、対応するPDFページの配置と照合します。ここはレイアウトの一覧を見るためのfixtureで、実案件の内容例や個別レイアウトの選び方は[レイアウトカタログ](../../catalog/README.md)を参照してください。

このファイルは自動生成されるため直接編集しないでください。再生成はリポジトリルートで実行します。

```sh
npm run catalog
npm run examples:pdf
```
