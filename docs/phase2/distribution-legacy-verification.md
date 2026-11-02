# 配布asset・旧デザイン互換の追加検証（2026-11-03）

## 範囲と変更

Phase2第1段階後の配布懸念と旧デザインの実行経路だけを検証した。production変更は `packages/cli/package.json` の `files` に `public` を追加する1項目のみ。依存バージョン・lock・layout・registry・既存example・catalog/previewsは変更しない。40候補や次の7IDは今回未実装であり、registryへ未検証IDを追加しない。

## CLI tarballのasset再現

再実行（リポジトリルート）:

```sh
node scripts/phase2/verify-cli-distribution.mjs --baseline
node scripts/phase2/verify-cli-distribution.mjs
```

スクリプトは `mkdtemp` 配下へ `git archive HEAD packages` を展開し、CLI manifestだけ現在の作業ツリー版に置換する。baselineはそこから `public` whitelistを除外する。**実checkoutのpackages/cliではnpm packを実行しない**。prepack/postpackのコピー・削除は一時ディレクトリだけで起きる。macOSの `/var` / `/private/var` はrealpathへ正規化する。生成されたtarballを別consumerへ通常のnpm installで導入し、consumerのinstalled `@slidev/cli` から画像付きCorporate/Editorial各10枚をbuildする。外部への出力ではなくconsumer内へbuild後、成果物をdistへコピーし、一時ディレクトリをcleanupする。

- 修正前: bundled `node_modules/slidev-core/public/slidev-kit/pipeline.svg` は存在するが、CLI rootの `public/slidev-kit/pipeline.svg` はtarballにない。両presetともexit 1。Vite aliasの参照先はCLI rootなので、次のエラーになる。
  - `[plugin vite:asset] Error: ENOENT: no such file or directory, open '<consumer>/node_modules/slidev-kit/public/slidev-kit/pipeline.svg'`
- 修正後: 両箇所の画像をtarball file listでassert。両presetともexit 0、各HTML生成をassert。10枚はparserでも確認する。
- npm cache変更・追加依存・依存バージョン更新は行わない。consumerはroot manifestのSlidev/Vueバージョンを用いるが、transitive依存はnpm install時の解決に従う（checkoutのlock再現試験ではない）。

成果物は `dist/phase2-distribution/{baseline,fixed}/runs/<run-id>/` 配下の `report.json`、`tarball-files.json`、番号付きpack/install/buildログ、`{corporate,editorial}/` のWeb build。各baseの `latest.json` は開始時 `running`、成功時だけ `success` とreport参照、失敗時 `failed` に更新する。過去の固定パスの成果物は履歴であり、最新成功の根拠にしない。tarballとconsumer自体は一時生成物として削除する。

## 初回検証時の課題: slidev-kit build E2Eとは別

**後続対応済み:** 以下はchecker修正前の履歴。入力契約整合と実CLI tarball E2Eの現在の結果は [CLI入力契約の検証](./cli-contract-verification.md) を参照。本スクリプト自体は引き続き配布assetだけを独立検証する。

この検証は **CLI tarballの配布assetsとinstalled Slidev buildの検証** であり、`slidev-kit build` のエンドツーエンド成功を主張しない。既存の `scripts/e2e.mjs` もGitHub root packageの試験であり、今回のCLI tarball検証とは別。

強化を試みてconsumerで次を実行したところ、既存CLI checkerがPhase1/2の入力契約を拒否し、画像buildまで到達しなかった。manifest修正の有無とは独立した既存課題として切り分け、今回はcheckerを変更しないことを親と合意した。

```sh
# 上記と同じconsumer、corporate.mdはPhase1サンプルのthemeだけslidev-kitへ変更
node node_modules/slidev-kit/bin/cli.mjs build corporate.md --out dist/corporate
```

具体例（`dist/phase2-distribution/cli-checker-rejection.log`）:

```text
corporate.md: 10 slides
エラー:
  - corporate.md:1: coverにtitleがありません
  - corporate.md:1: 不明なdensity: normal
  - corporate.md:131: 画像のパスがありません: /slidev-kit/pipeline.svg
```

同様のtitle/density拒否が10ID全体で発生する。KitはMarkdown見出しとnormal密度を使う一方、旧checkerは従来のtitle props・density等の契約を検査する。次の7ID追加前に入力契約整合の対応要否を検討すべき重要課題。恒久的なチェック回避機能や、通すための入力改変は追加していない。

## 旧デザインの実Chromium検証

```sh
node scripts/phase2/verify-legacy-browser.mjs
```

- default / mono / dark / examples/design-contractのcustom acmeを、各5枚（cover / content / comparison / summary / end）の代表fixtureで確認。fixtureはdist内だけに生成し、acmeのdesignsは例からそのままコピーする。Vue SFCの型importがNode解決を使うため、fixture内 `node_modules/slidev-kit` にcheckoutへのローカルsymlinkを置く。これはtarball配布検査とは別のcheckout互換検査。
- 表示中の `.slide-page.theme-*` が存在し、KitSlideではないことをassert。cover/content/comparisonのlegacy branch、summary/endの従来経路を実ブラウザで実行する。
- タイトル・subtitle・本文・second/left/right/evidence/request slot・takeaway・end note、代表的な旧DOM構造、各paletteの背景/accentを確認し、各ページをPNG保存する。acmeの本文ページでは独自headerもassert。
- 全4 design × 5 IDで予期しないconsole error / pageerror / HTTP >=400は0。既存許可対象の `Failed to patch FloatingVue ... Popper` と `Wake Lock permission request denied` だけreportに残し、それ以外を握りつぶさない。
- `dist/phase2-legacy/latest.json` から成功runを参照する。`runs/<run-id>/report.json`、各designの `{cover,content,comparison,summary,end}.png` と `dev-server.log`、生成fixtureが成果物。開始・失敗時はlatestが以前の成功reportを参照せず、run間で生成物を混在させない。代表dark content / acme comparisonを目視し、本文と左右slot、背景色、見出し、クロームが表示されることを確認した。

これは新たなgolden画像とのピクセル比較、旧layout全件・全props・任意本文でのoverflow保証、全OSフォント、PDF互換、同一マウントでのdesign動的切替の検査ではない。旧デザイン全体を刷新していない。

## 既存チェック

- `npm run verify`: 18 files / 84 tests成功、Vue/TypeScript型検査成功。
- `npm run catalog:check`: 22生成ファイル一致。
- `npm run phase1:check`: 成功。
- `npm run phase2:check`: 成功。

初回ハーネス実行ではnpm lifecycle出力とJSONの混在、fixtureの画像パス誤記、非表示slideのselector、custom SFC型解決、macOS一時パスのrealpath不整合を修正した。これらは検証スクリプト側の修正で、production修正を増やしていない。CLI wrapperでのchecker拒否は上述のとおり未修正・残課題として記録する。
