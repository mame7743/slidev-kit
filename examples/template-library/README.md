# チュートリアル: 複数テンプレートをGitHubで配布する

テンプレートごとの初期デッキとpackage設定をまとめ、利用者がテンプレートを選んで新規プロジェクトを作る構成を学びます。

- **入力データ:** [`templates/corporate/template.json`](./templates/corporate/template.json)、同じフォルダーの`slides.md`・`package.json`
- **説明する機能:** `template.json`のtoken/prompt、サブディレクトリ指定、scaffold file、固定タグによるテンプレート版管理
- **出力:** `slidev-kit init`が作る`quarterly/`プロジェクト（PDFではなく、編集開始用のファイル一式）

## 1. 入力を読む

`template.json`でテンプレート名、説明、利用モード、置換tokenと追加promptを定義します。`slides.md`は初期スライド、`package.json`は生成先の依存・実行設定です。GitHubリポジトリとして公開する場合は、テンプレートごとに`templates/<name>/`を配置し、固定タグを付けます。

## 2. 利用側でテンプレートから作成する

`YOUR_ORG`は実際のGitHub組織名に置き換えて実行します。

```sh
slidev-kit init quarterly \
  --template=github:YOUR_ORG/slidev-template/templates/corporate#v1.0.0
```

生成後の`quarterly/`を確認し、必要な値や依存を調整してから`npm install`します。テンプレートとデザインライブラリは別々にタグ付けし、必要な更新だけを取り込む運用です。外部公開テンプレートの利用者側手順は[外部テンプレートの例](../slidev-template/README.md)を参照してください。
