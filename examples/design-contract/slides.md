---
theme: slidev-kit
layout: cover
title: デザインを替えても、内容はそのまま
subtitle: slides.md とテーマをつなぐ共通 interface
---

共通契約に沿ったデッキと、テーマ側の部品構成例です。

---
layout: content
columns: 2
textSize: medium
title: 共通データとテーマの役割
section: デザインシステム
---

## slides.md が持つ情報

- layout とタイトル
- 意味のある本文・slot
- 必要な場合だけスライド固有の表示指定

::second::

## テーマが決める表現

- 共通データを受け取る部品
- Header / Body / Footer の配置
- 色・フォント・余白

---
layout: comparison
title: 固定する契約、選べる表現
section: デザインシステム
---

::left::

## interface が固定

データの意味、props、slot、未指定時の振る舞いを共通化します。

::right::

## テーマが構成

契約されたデータと共通部品を組み合わせ、ページをデザインします。

---
layout: columns
columns: 3
title: 設定は適用範囲で分ける
section: デザインシステム
---

::first::

## テーマ既定

色や共通部品の標準的な見せ方を定義します。

::second::

## デッキ共通

`themeConfig.page` で分類表示やページ番号を調整します。

::third::

## スライド単位

必要なページだけ `showHeader: false` などを指定します。

---
layout: content
columns: 2
title: クロームを省いた本文ページ
section: デザインシステム
showHeader: false
---

本文の内容・layout・slot はそのままに、ページ単位でヘッダーを表示しない例です。フッターは通常通り表示します。

---
layout: end
title: 同じ内容を、異なるデザインで
subtitle: 共通 interface が再利用を支えます
---
