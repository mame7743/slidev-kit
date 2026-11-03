# チュートリアル: はじめての提案デッキ

5枚の提案資料を題材に、Markdownの入力からPDFの出力までを確認します。

- **入力データ:** [`slides.md`](./slides.md) に架空の問い合わせ状況・4週間の試行計画・判断依頼を記述
- **説明する機能:** スライド区切り、レイアウト指定、`::left::` / `::right::` / `::evidence::` / `::request::` の名前付きslot、Corporate variant
- **出力:** [完成PDF（5枚）](./exports/quickstart.pdf)

## 1. 入力を読む

[`slides.md`](./slides.md)を開き、frontmatterの`layout`と本文を見比べてください。各スライドは`---`で区切り、見出し・箇条書き・表などの内容をMarkdownで書いています。左右比較とまとめスライドでは名前付きslotに内容を割り当てています。

## 2. プレビューする

リポジトリのルートで実行します。

```sh
npx slidev examples/quickstart/slides.md
```

## 3. 出力と入力を比べる

[PDF](./exports/quickstart.pdf)で5枚の完成結果を確認し、元データのどのレイアウト・slotが各ページに反映されたかを見比べます。全デッキのPDFを再生成する場合はルートで`npm run examples:pdf`を実行します。

## 4. 自分のデッキにする

```sh
cp -R examples/quickstart examples/my-deck
npx slidev examples/my-deck/slides.md
```

コピー後は [`slides.md`](./slides.md) の架空データを自分の内容に置き換えます。`theme: ../../packages/theme`はこの例の場所からテーマへの相対パスなので、別の場所へコピーした場合はパスを合わせてください。

レイアウトやslotを1枚単位で探す場合は[レイアウトカタログ](../../catalog/README.md)、検査・PDF出力は[執筆ガイド](../../docs/phase1/phase1-usage.md)を参照してください。
