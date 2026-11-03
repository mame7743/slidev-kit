# チュートリアル: 公開レイアウト全体を確認する

基本レイアウトに追加レイアウトを加えた、公開17レイアウトの一覧fixtureです。

- **入力データ:** [`slides.md`](./slides.md) の生成fixture（全レイアウトで共通の技術報告データ）
- **説明する機能:** 公開レイアウト17種の入力構造・表示結果と、基本一覧に対する追加レイアウト
- **出力:** [PDF（17枚）](./exports/all-layouts.pdf)

## 見方

[`slides.md`](./slides.md)のfrontmatterとslotをPDFの各ページと照合します。基本10レイアウトだけを先に確認する場合は[基本レイアウト例](../core-layouts/README.md)へ進んでください。個々の用途と選び方は[レイアウトカタログ](../../catalog/README.md)を参照してください。

このファイルは自動生成fixtureです。直接編集せず、再生成とPDF出力をリポジトリルートで行います。

```sh
npm run catalog
npm run examples:pdf
```
