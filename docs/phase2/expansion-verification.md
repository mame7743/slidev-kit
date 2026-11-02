# Phase2 第2段階：17ID検証記録

## 実施結果

公開順序は既存10IDの後にagenda/summary/end/quote/metrics/process/code。既存Phase1/Phase2の10枚本文と既存previewは変更していない。registry/schema整合は既存AJV検査を継続し、schemaの拡張は不要だった。

| コマンド | 結果 |
|---|---|
| `npm run verify` | 21ファイル / 130 tests成功、vue-tsc成功 |
| `npm run catalog:check` | 37生成ファイル一致 |
| `npm run phase1:check` | 固定10枚成功 |
| `npm run phase2:check` | Editorial固定10枚一致・契約成功 |
| `npm run phase2:expansion:check` | 生成17枚一致、両preset契約成功 |
| `npm run phase2:expansion:browser` | 両preset全17ID、各69 CSS組合せ、各23実frontmatter例成功 |
| `node scripts/phase2/verify-cli-kit.mjs` | 作業ツリーのtarballを隔離installし、既存両10枚+拡張両17枚の実CLI check/build成功、不正入力各4種を拒否 |
| `node scripts/phase2/verify-legacy-browser.mjs` | default/mono/dark/acme × cover/content/comparison/summary/endの20例成功 |

単体テストは実SFCをコンパイルしたSSRで両preset/7wrapper/3density/slot転送の順序と単一性を検査し、legacy summary/endのtitle/subtitle/note/takeaway/section/default/evidence/requestも保持。構造契約はpositive/negative、H1重複・順序、必須/空/重複/未知slot、heading-only/comment-only、fence内slot風文字、agenda 3/6項目境界、end締め/連絡先、長い値と14行コードを検査。既存10IDのH1契約は強化していない。

## 実ChromiumとPDF

各presetで:

- 17枚のタイトル/色/slot数/非空/overflow、画像ロード・Mermaidラベル/出典非重複、コード描画を確認。
- 登録variant × densityの69 CSS属性組合せ。新7IDは**実frontmatter**全21例と境界2例（`123,456 時間`、14行コード）を追加し、data属性への伝播と描画を確認。
- 新IDのslot全文一致（空白正規化）、DOM順、単一性、panel相互非重複。processの見出し順・metricsの値の文字階層・quoteのblockquote・agendaのol・codeのpreを検査。
- 意図的に長文を追加しoverflow警告/data-overflowを確認。全文を保持していることをassert。
- 実Slidev PDFを各17頁で出力。各頁16:9、PDF Contentsが単一stream/参照またはarrayの双方をlookupし、非空content streamを確認。
- Corporate既存10枚は既存catalog previewをRGBAで照合し**異なるpixel channel数0**。既存previewを書き換えず、新7previewだけ保存。
- 上流の既存許可診断 `Failed to patch FloatingVue…` と `Wake Lock permission request denied` は報告へ記録。その他pageerror/console.error/HTTP400以上は失敗にする。最終unexpectedBrowserErrorsは両方空。

途中の検証失敗は原因修正後に再実行した。工程panelの疑似要素矢印がscrollWidthを増やす問題は親gridの装飾へ移動。slot全文比較はtextContentではブロック間区切りを失うためinnerTextで比較。PDF Contentsは単一streamでも有効なのでarray専用呼出しをやめ、両形式で実データ長を検査する。検査自体を省略/常時成功にはしていない。

## 最終成果物

各base配下`latest.json`のstatusとreportを入口にする。過去のfailed runも隔離して保持し、最新成功と混同しない。

- Corporate: `dist/phase2-expansion/corporate/runs/2026-11-02T16-28-19.800Z-9aafac70/`
- Editorial: `dist/phase2-expansion/editorial/runs/2026-11-02T16-30-06.716Z-43e55023/`
- CLI: `dist/phase2-cli-kit/runs/2026-11-02T16-28-19.131Z-eabb25af/`
- Legacy: `dist/phase2-legacy/runs/2026-11-02T16-17-05.374Z-77f29387/`

browser runには`report.json`/`status.json`/`dev-server.log`/`slides.md`/`matrix.md`/`previews/*.png`/`boundary-{metrics,code}.png`/`catalog.pdf`がある。CLI runには4デッキのbuild出力とコマンド別logを保存。

## 目視

画像読取でCorporateの`catalog/previews/{agenda,metrics,process,code,quote,end}.png`、Editorialのsummary previewと最終runの`boundary-code.png`を確認。番号と方向が本文にかからない、値が本文より大きい、引用と帰属が分離、締め/連絡先がfooterと分離、14行コードが欠落せず解説と重ならないことを確認した。

## 残制約

- 画質の全頁・全内容に対する完全保証ではない。PDFは構造/非空streamを検査し、代表PNGを目視した。PDF全34頁をラスタ化して目視する検証は未実施。
- 固定slot数/3指標/3工程の契約。任意slot・可変カード・コード実行・数値抽出は対象外。
- 情報量は目安。静的文字数で内容を省略/削除/縮小しない。長い任意入力で警告が出ないことまでは保証しない。
- 次候補9件/保留14件は未実装。40IDが利用可能とは表記しない。
- 新7previewはCorporate runが生成するだけで、コミット済み画像との回帰比較は未実装（既存10枚のみpixel差0をassert）。再実行で画像が変わり得るため、差分が出たら目視確認する。
- kit presetで旧frontmatterの`title`/`takeaway`等を使った場合、描画されず警告になる（互換描画はしない）。検証はconsole警告と本文未描画を1例だけ確認し、旧テーマ経路の描画は従来テストのmockで担保。
- `end`の契約はトップレベル段落2以上を要求する（締めと連絡先を同一段落のハードブレイクで書くと却下）。
- 独立レビューは別途必要。この記録は実装者の検証結果。
