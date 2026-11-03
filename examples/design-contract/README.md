# チュートリアル: スライド本文を保ったまま独自デザインを適用する

同じ`slides.md`の内容を、デッキ側の`designs/acme/`に置いた部品で構成・装飾する例です。

- **入力データ:** [`slides.md`](./slides.md)の6枚と、[`package.json`](./package.json)のvariant・ヘッダー・フッター設定
- **説明する機能:** `PageRoot` / `DefaultPage` / `Header` / `Footer`を使うDesign interface、デッキ共通設定とスライド単位設定の分離
- **出力:** [完成PDF（6枚）](./exports/design-contract.pdf)

## 1. 入力とデザイン部品を見る

[`slides.md`](./slides.md)は本文・layout・slotを記述し、[`designs/acme/`](./designs/acme/)がページの配置とクロームを担当します。`package.json`の`themeConfig`ではvariant、組織名、分類、ページ番号などを設定します。本文の`showHeader: false`は1枚だけに適用する例です。

## 2. ビルドして出力する

この例のプロジェクトディレクトリで実行します。

```sh
npm install
npm run check
npm run build
npm run pdf
```

出力先は[`exports/design-contract.pdf`](./exports/design-contract.pdf)です。PDFと入力を照合し、同じ本文に対して共通ヘッダー・フッターとページ単位の例外がどう適用されるか確認してください。Chromiumが見つからない場合は`npx playwright install chromium`を実行します。
