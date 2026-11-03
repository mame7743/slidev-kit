# チュートリアル: 独自デザインをライブラリとして共有する

完成スライドではなく、デザイン実装を複数デッキに配布する構成を学びます。

- **入力データ:** [`acme/`](./acme/)以下のVue部品と`index.ts`、ライブラリの`package.json`
- **説明する機能:** Design interfaceの実装をGitHub packageにし、デッキからvariant entryで参照する方法
- **出力:** `@example/slidev-designs`として公開され、固定タグを指定した各デッキから再利用されるデザインライブラリ（この例自体は完成デッキ／PDFを出力しません）

## 1. ライブラリの入力を見る

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

## 2. デッキからライブラリを参照する

デッキ側は、Vite のvariant自動検出用に薄いエントリだけを置きます。

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

## `design-contract/designs/acme` との関係

このリポジトリ内の `acme/`（`index.ts`・`PageRoot.vue`・`DefaultPage.vue`・`Header.vue`・`Footer.vue`）は、[`examples/design-contract/designs/acme/`](../design-contract/designs/acme/) と同じ実装の複製です。現時点では両者の内容は一致していますが、自動同期はありません。

- `design-contract/designs/acme/`: 旧デザインの検査用 fixture。[`check-cli.test.mjs`](../../packages/core/tests/check-cli.test.mjs) と [`verify-legacy-browser.mjs`](../../scripts/phase2/verify-legacy-browser.mjs) が読みます。
- `design-library/acme/`: 配布 package の実体。[`scripts/e2e.mjs`](../../scripts/e2e.mjs) が `npm pack` して install します。

どちらかを変更したら、もう片方も同じ内容に更新してください。片方だけを変えると、e2e で検証する package と旧デザイン fixture がずれます。
