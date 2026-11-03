# チュートリアル: GitHub上のテンプレートを指定する

ローカルのテンプレートではなく、GitHub上の固定タグ・サブディレクトリからデッキを作る例です。

- **入力データ:** GitHubの[`mame7743/slidev-template` `templates/corporate` `v0.1.0`](https://github.com/mame7743/slidev-template)、`affiliation`と`author`の値
- **説明する機能:** `--template=github:...`による取得、サブディレクトリとタグの指定、`--define`による値の入力
- **出力:** `quarterly/`として生成されるプロジェクト（生成元テンプレートで互換修正が必要。下記参照）

## 1. 入力元と値を指定する

Gitとネットワークが必要です。`#v0.1.0`は再現可能性のための固定タグです。

```sh
slidev-kit init quarterly --template=github:mame7743/slidev-template/templates/corporate#v0.1.0 --define=affiliation=開発本部・開発部 --define=author=山田太郎
```

## 2. 生成先を確認する

コマンドは`quarterly/`にテンプレートファイルを生成します。依存をインストールしてプレビューする前に、内容・置換値・package設定を確認してください。

```sh
cd quarterly
npm install
npm run dev
```

## 現在のテンプレートとの互換性

2026-11-01時点の`v0.1.0`は、`template.json`で`kitDep`を宣言する一方、`templates/corporate/package.json`では`{{deckDep}}`を使っており、`npm install`前にそのままでは解決しないtokenがあります。また、旧パッケージ名の依存指定が残っています。そのため、この例で確認できるのはGitHubから取得して生成する手順までです。実際にプレビューするには、上流で依存tokenをmanifestに合わせ、現在の`slidev-kit`に更新する必要があります。
