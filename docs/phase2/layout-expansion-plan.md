# Phase2 第2段階：レイアウト拡張計画（40候補 / 公開17ID）

40は**仕様候補の総数**であり実装数ではない。registryには実装・テンプレート・プレビュー・検証が揃った17IDだけを登録する。既存10IDと順序を維持し、7IDを末尾に追加した。次候補と保留は未登録・利用不可。

新IDの採用条件は、(1) 読む関係性が異なる、(2) 必須内容/slot契約が異なる、(3) 固有の配置・可読性検査を定義できること。色・左右・幅・density・用途名だけの違いはIDにしない。独立性が薄い候補を無理に実装せず、既存IDの例へ戻す判断も行う。

## 40候補の状態と仕様

slot欄の `—` はnamed slotなし。記載slotはすべて必須。次候補/保留の仕様は案であり公開APIではない。全候補のdensity案はrelaxed/normal/compact。

| No. | ID | 状態 | slots | variants | 情報量目安 / 独立性・判断 |
|---:|---|---|---|---|---|
| 1 | cover | 実装済（既存） | — | balanced, dramatic | H1・副題・発表者、開始の階層 |
| 2 | section | 実装済（既存） | — | balanced, dramatic | 章タイトルと短い目的 |
| 3 | content | 実装済（既存） | — | balanced | 本文・箇条書き3〜5項目 |
| 4 | split | 実装済（既存） | left, right | balanced, left, right | 説明と補足、各3項目 |
| 5 | comparison | 実装済（既存） | left, right | balanced, left, right | 同じ観点で3〜4項目比較 |
| 6 | cards | 実装済（既存） | first, second, third | balanced | 独立した3特徴、各本文2〜4行 |
| 7 | visual | 実装済（既存） | — | balanced | 画像1点と出典 |
| 8 | chart | 実装済（既存） | — | balanced | Mermaid、4〜8点と出典 |
| 9 | table | 実装済（既存） | — | balanced | 標準表3〜5列、3〜6行 |
| 10 | roadmap | 実装済（既存） | — | phases | 標準表3〜5フェーズ、3列 |
| 11 | agenda | 実装済（追加） | — | balanced | ol 3〜6項目、各補足1行。順序番号が主役 |
| 12 | summary | 実装済（追加） | evidence, request | balanced | 結論1〜2文、根拠/依頼各2〜3項目 |
| 13 | end | 実装済（追加） | — | balanced | H1、締め1行、連絡先1〜2行。最終ページの余白 |
| 14 | quote | 実装済（追加） | quote, attribution | balanced | 引用2〜4行、帰属1〜2行 |
| 15 | metrics | 実装済（追加） | first, second, third | balanced | 値/単位/名称/比較時点の3指標。値が最上位 |
| 16 | process | 実装済（追加） | first, second, third | balanced | 3工程、各説明2行。番号/方向/DOM順 |
| 17 | code | 実装済（追加） | code, explanation | balanced | fence 8〜14行、解説3項目。実行しない |
| 18 | figure | 次候補 | figure | balanced, left, right | 図1点、読取3項目と出典。図の面積を保証、旧props維持 |
| 19 | timeline | 次候補 | first, second, third | balanced | 3時点、日付/出来事/説明各1行。等間隔で実時間比例でない |
| 20 | quadrants | 次候補 | topleft, topright, bottomleft, bottomright | balanced | 2軸と4象限、各見出し+2項目。旧matrixとは別 |
| 21 | hierarchy | 保留 | — | balanced | Mermaid 2〜3階層/6〜9ノード。専用深さ検査がなければvisualへ |
| 22 | cycle | 保留 | first, second, third | balanced | 3段階各2行。終点→始点の矢印と読み順の仕様待ち |
| 23 | funnel | 保留 | first, second, third | balanced | 3段、母数/段階名/率。幅と数量の対応契約待ち、装飾だけなら不採用 |
| 24 | equation | 次候補 | formula, definitions | balanced | 数式1〜2本、変数3〜5。数式レンダラ検証が先 |
| 25 | code-diff | 次候補 | before, after | balanced | 各8〜12行、同一言語。コード専用横幅・改行検査 |
| 26 | code-output | 次候補 | code, output | balanced | コード8〜12行/出力6〜10行。実行しない |
| 27 | references | 保留 | — | balanced | 書誌4〜6件、資料名/URL/日付。長URLと通常リストとの差を検証 |
| 28 | glossary | 保留 | — | balanced | 表4〜6語、各定義1〜2行。tableで代替可能 |
| 29 | faq | 保留 | first, second, third | balanced | 3問、質問1行+回答2行。カード装飾なら統合 |
| 30 | checklist | 保留 | — | balanced | 5〜7項目各1行。普通の箇条書きに近い。独自状態構文は作らない |
| 31 | decision | 次候補 | options, criteria, decision | balanced | 候補2〜3/基準3/決定1〜2文。非対称3領域 |
| 32 | assumptions | 保留 | assumptions, validation | balanced | 前提3/検証と成立条件各3。対応線等がなければsplit |
| 33 | evidence-chain | 次候補 | claim, evidence, implication | balanced | 主張1文/根拠2〜3/示唆1文。依頼でなく推論の連鎖 |
| 34 | stakeholder-map | 保留 | — | balanced | 5〜7関係者と2軸。quadrantsとの差待ち |
| 35 | journey | 保留 | first, second, third | balanced | 3段階の行動/課題/機会。横断観点がなければprocess/表 |
| 36 | experiment | 次候補 | hypothesis, method, criteria | balanced | 仮説1〜2文/方法3/判定2。仮説→手段→判定 |
| 37 | architecture | 保留 | diagram, legend | balanced | Mermaid6〜9ノード/凡例3。境界・接続の専用検査待ち |
| 38 | dependency-map | 保留 | diagram, constraints | balanced | Mermaid6〜8ノード/制約3。循環・方向の固有要件待ち |
| 39 | risk-register | 保留 | — | balanced | 表4列3〜5件。用途名のみならtableへ |
| 40 | action-plan | 保留 | — | balanced | 表で作業/担当/期限/完了条件3〜5件。plan/roadmap/tableと重複 |

次候補9件・保留14件は実デッキで再評価する。`before-after`はcomparison、`three-features`はcards、画像左右はsplit/figureのvariant、bar/lineはchart、compact-tableはtableのdensityを使い、重複IDを増やさない。

## 最初の7IDの利用方法

対象はCorporate / EditorialのKitデッキ。新規5IDを旧テーマで使った場合のCorporate fallbackは旧テーマ対応の保証ではない。summary/endは旧テーマの既存wrapper props/slotsを温存する（旧frontmatter title方式を本文H1へ強制移行しない）。

ただしkit preset（corporate/editorial）ではKitSlideが本文Markdownだけを描画するため、frontmatterの`title`/`subtitle`/`note`/`takeaway`は描画されない。kit presetでこれらが残っている場合はビルド/開発時に`[slidev-kit] slide N: frontmatter title/... is ignored in the kit preset`とconsole警告を出す。kit preset利用者にとっては旧frontmatter方式から本文H1への移行が必要（旧テーマ利用時は従来どおりfrontmatter propsを描画）。

```yaml
---
theme: slidev-kit
themeConfig:
  variant: editorial # またはcorporate（デザイン）
layout: agenda
variant: balanced # スライド構造。追加7IDはbalancedだけ
density: normal # relaxed / normal / compact
---
```

本文は標準MarkdownとSlidevのnamed slotのみ。H1はちょうど1つ、すべてのnamed slotより前に置く。slotには見出しだけでなく実内容が必要。独自構文、title抽出、値の集計・着色、コード実行、自動縮小はしない。

| ID | 書き方・構造 | コピペできる実装例 |
|---|---|---|
| agenda | defaultにH1とol1個（3〜6項目）。番号は標準Markdownから表示 | [template](../../catalog/templates/agenda.md) |
| summary | defaultにH1+結論、下段evidence/request 2panel | [template](../../catalog/templates/summary.md) |
| end | defaultにH1+締め+連絡先。footerと離した中央配置 | [template](../../catalog/templates/end.md) |
| quote | quoteにblockquote1個、attributionに著者/資料名。帰属は下段 | [template](../../catalog/templates/quote.md) |
| metrics | first/second/third各H2に値+単位、本文に指標名と比較時点 | [template](../../catalog/templates/metrics.md) |
| process | first→second→thirdのDOM順。番号/方向はCSS装飾、工程名は重複生成しない | [template](../../catalog/templates/process.md) |
| code | codeに標準fence1個、explanationに解説。コード側が広い2panel、実行なし | [template](../../catalog/templates/code.md) |

[公開17枚の実装例](../../examples/phase2-expansion/slides.md)はレジストリから生成する。既存[Phase1 10枚](../../examples/phase1/slides.md)と[Phase2 10枚](../../examples/phase2/slides.md)は固定して本文/画像を保持する。

情報量は表の目安を基本とする。目安の超過だけで内容を削除・省略しない。runtimeは描画領域のはみ出しをconsole警告と`data-overflow`で知らせる（情報量の文字数推定はしない）。著者がスライド分割などを判断する。agenda項目数/必須slot/fence等の**構造契約違反はエラー**、単なる長い本文はoverflow警告でありcheckerの文字数上限エラーではない。

## 検証と生成

- `npm run catalog` / `npm run catalog:check`: 17テンプレート・カタログと10枚/17枚の生成サンプルを同期。未実装候補は出力しない。
- `npm run phase1:check` / `npm run phase2:check`: 既存10枚を保持して検査。
- `npm run phase2:expansion:check`: 17枚の生成一致と両preset契約。
- `npm run verify`: registry/schema・SSR・新契約positive/negativeとlegacy props/slots・型検査。
- `npm run phase2:expansion:browser`: 両presetの17枚/全CSS variant×density、新IDの実frontmatter全21例+境界2例、Mermaid/画像/コード、PDF各17頁。Corporate既存10画像pixel差0もassert。
- `node scripts/phase2/verify-cli-kit.mjs`: 隔離tarball installから既存両10枚に加えて両17枚の実CLI check/build。不正layout/variant/density/assetを拒否。
- `node scripts/phase2/verify-legacy-browser.mjs`: 旧default/mono/dark/acme各5IDを再検査。

新7IDのCorporate previewのみcatalogへ保存。既存画像は再生成しない。previewの再生成は`npm run phase1:browser`（既存10枚）と`npm run phase2:expansion:browser`（拡張7枚）で行う。検証成果物は`dist/phase2-expansion/{corporate,editorial}/runs/<run>/`、`latest.json`が成功/失敗とrunを指す。生成PDFの全ページ画質の完全保証はしない。[検証記録](expansion-verification.md)を参照。
