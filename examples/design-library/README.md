# 共有デザインライブラリの例

このディレクトリは、Slidev Kit の Design interface を使うテーマ実装を、各デッキから再利用可能な GitHub package として管理する構成例です。

```text
slidev-designs/
  package.json                 # exports: { "./acme": "./acme/index.ts" }
  acme/
    index.ts
    PageRoot.vue
    DefaultPage.vue
    Header.vue
    Footer.vue
```

デッキ側は、Vite の variant 自動検出用に薄いエントリだけを置きます。

```ts
// designs/acme/index.ts
export { default } from '@example/slidev-designs/acme'
```

`package.json` では実際の社内 GitHub リポジトリと**固定タグ**を依存に指定します。

```json
{
  "dependencies": {
    "@example/slidev-designs": "github:YOUR_ORG/slidev-designs#v1.0.0"
  }
}
```

ライブラリ側の `package.json` で `exports` を定義し、`slidev-kit` と `vue` は peer dependency にします。デッキには同じ `designs/acme/index.ts` を置いたまま、依存のタグを更新して `npm install` すればデザインを更新できます。自動で最新版に追従させず、レビュー後に明示的にタグを上げる運用が安全です。

テンプレートは初期ファイルのコピー、デザインライブラリは更新可能な依存です。両者を分けることで、社内フォーマットの変更後も `slides.md` は維持し、既存デッキへデザイン更新を届けられます。
