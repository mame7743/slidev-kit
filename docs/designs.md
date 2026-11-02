# デザイン variant と interface 契約

各 Slidev プロジェクトの `designs/<variant>/index.ts` に Design を定義すると、同梱デザインを上書きできます。Vite 設定がプロジェクト直下の variant を検出し、組み込み variant より優先して読み込みます。

```text
my-deck/
  designs/acme/
    index.ts
    PageRoot.vue
    DefaultPage.vue   # 一般ページの部品を配置
    Header.vue        # 任意の差し替え
    CoverPage.vue     # 任意の差し替え
    EndPage.vue       # 任意の差し替え
```

## 公開17IDの組み込みpreset

`themeConfig.variant: corporate | editorial` は、公開17ID共通のKitSlide構造にsemantic tokensと装飾を適用します。Editorialは白地・墨色・朱色、Corporateは従来の見た目を維持します。両方とも既存Designレジストリに登録され、Viteのプロジェクトデザイン検出を変更しません。

スライド直下の `variant` は配置の指定であり、デザイン名ではありません。`cover/content/comparison/summary/end` はdefault/mono/dark/custom指定時に旧interface実装を維持します。その他12IDはKitSlide専用であり、両preset以外ではCorporateへフォールバックします。custom DesignでKitSlide DOM自体を差し替える契約はありません。

公開レイアウトのwrapperは `packages/core/layouts/*.vue`、共通描画は `packages/core/components/kit/KitSlide.vue` と `ContentLayout.vue` にあります。registry・catalog対象外の旧wrapperは `packages/core/layouts/extras/` に分離しています。extrasはSlidevのlayouts再帰走査によるbasename登録で手書き利用でき、既存テストでも使用しますが、catalogサンプルとpreviewは生成しません。公開状態と実装種別の判定は [自動生成のレイアウト判定表](layout-inventory.md) を唯一の正とします。

詳細は [Phase2利用ガイド](phase2/README.md) を参照してください。

## 共通 interface

kit は `slides.md` の frontmatter・本文から、layout が解釈したデータを interface の型に正規化してテーマへ渡します。契約の型は `slidev-kit/interface/design` から利用できます。

- `GeneralPageData`: `header`・`footer` の情報、`takeaway`、`chrome`（表示可否）
- `CoverPageData`: title / subtitle / author / date / image など
- `EndPageData`: title / subtitle / note
- `HeaderData` / `FooterData`: 共通部品に渡す情報と optional な表示設定

ページの意味・props・slot は共通契約で固定し、**部品の配置や組み合わせはテーマ側の `DefaultPage.vue`、`CoverPage.vue`、`EndPage.vue` で構成**します。標準構成は kit が提供する `slidev-kit/designs/standard/DefaultPage.vue` です。独自 `DefaultPage` を省略すれば標準構成が使われます。

```ts
import type { Design } from 'slidev-kit/interface/design.ts'
import PageRoot from './PageRoot.vue'
import DefaultPage from './DefaultPage.vue'
import Header from './Header.vue'

const design: Design = { Root: PageRoot, DefaultPage, Header }
export default design
```

`DefaultPage.vue` は `page: GeneralPageData` を受け取り、本文を default slot で受け取ります。共通部品を使って好きな順序・構成にできます。

```vue
<script setup lang="ts">
import type { GeneralPageData } from 'slidev-kit/interface/design.ts'
import PageBody from 'slidev-kit/designs/standard/PageBody.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

defineProps<{ page: GeneralPageData }>()
</script>

<template>
  <Header v-if="page.chrome.showHeader" v-bind="page.header" />
  <main class="my-page-body"><PageBody :takeaway="page.takeaway"><slot /></PageBody></main>
  <Footer v-if="page.chrome.showFooter" v-bind="page.footer" />
</template>
```

Header の契約 props は `title`・`section`・`organization`・`classification`・`options`、Body は `takeaway` と default slot、Footer は `department`・`documentId`・`revision`・`pageNumber`・`options` です。未指定値は省略表示し、`options` の項目が `false` ならその情報を表示しないのが標準の振る舞いです。部品を差し替えない場合は標準部品を使えます。

## optional 設定の置き場所

`package.json` の `slidev.themeConfig` でデッキ全体の表示方針を指定します。テーマ実装は既定値を持てます。

```json
{
  "slidev": {
    "themeConfig": {
      "variant": "acme",
      "organization": "Example Inc.",
      "department": "企画部",
      "classification": "社外秘",
      "documentId": "PLAN-001",
      "revision": "Rev.2",
      "page": {
        "header": { "enabled": true, "title": true, "section": true, "organization": true, "classification": true },
        "footer": { "enabled": true, "department": true, "documentId": true, "pageNumber": true }
      }
    }
  }
}
```

優先順位は **テーマの標準値 → デッキ全体の `themeConfig.page` → スライド個別の指定**です。特定スライドだけヘッダー／フッターを省く場合は frontmatter に `showHeader: false` / `showFooter: false` を指定します。表示を抑制しても interface のデータ契約は変わりません。

## 表紙・エンド・全体スタイル

`CoverPage.vue` と `EndPage.vue` は `page: CoverPageData` / `page: EndPageData` と default slot を受け取り、独立して差し替えられます。一般ページ全体の置き換えも可能ですが、`DefaultPage.vue` は interface のデータ契約を守って構成します。

`PageRoot.vue` はデザイン全体の外枠と CSS 変数（色・フォント・余白など）を定義します。variant は全スライドに適用されます。スライドごとの `variant` frontmatter では切り替わりません。

## デザインを共有ライブラリとして管理する

デザイン本体は GitHub 上の Node package にし、各デッキからタグ固定で依存させます。variant 自動検出のため、デッキには薄いエントリだけ置きます。

```ts
// designs/acme/index.ts（各デッキ）
export { default } from '@company/slidev-designs/acme'
```

共有 package は `exports` で variant を公開し、`slidev-kit` と `vue` は peer dependency にします。package には `PageRoot.vue`、`DefaultPage.vue` などを置きます。package の `package.json` と更新例は [`examples/design-library/`](../examples/design-library/) を参照してください。

デッキの package では GitHub tag を指定します。

```json
{
  "devDependencies": {
    "@company/slidev-designs": "github:company/slidev-designs#v1.2.0"
  }
}
```

更新時は tag を明示的に上げて `npm install` します。自動で最新版に追従させず、社内フォーマット変更をレビュー・検証してから各デッキに反映できます。`slides.md` はデータ契約を守る限り変更不要です。

## テンプレートと共有ライブラリの使い分け

`slidev-kit init` のテンプレートは作成時にファイルをコピーするスターターです。一方、共有デザイン package は依存バージョンを更新すると既存デッキにも反映できます。複数のスターターを同じ GitHub repo に置く場合は、`--template=github:owner/repo/path/to/template#tag` の形式でサブディレクトリを選びます。実例は [`examples/template-library/`](../examples/template-library/) にあります。
