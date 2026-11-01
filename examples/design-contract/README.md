# Design contract example

同じ `slides.md` に対し、`designs/acme/` で `Root`・`DefaultPage`・`Header`・`Footer` を組み合わせたデザインを適用する例です。標準の表紙・エンドもそのまま使います。

GitHub から SlideKit をインストールして PDF を生成します。

```sh
npm install
npm run check
npm run build
npm run pdf
```

PDF は `exports/design-contract.pdf` に生成されます。Chromium が見つからない場合は `npx playwright install chromium` を実行してください。
