# `mame7743/slidev-template` をテンプレートとして使う

[`mame7743/slidev-template`](https://github.com/mame7743/slidev-template) の `templates/corporate` を、GitHub 上のテンプレートソースとして指定する例です。

```sh
slidev-kit init quarterly \
  --template=github:mame7743/slidev-template/templates/corporate#v0.1.0 \
  --define=affiliation=開発本部・開発部 \
  --define=author=山田太郎
```

Git とネットワークが必要です。`#v0.1.0` は利用するテンプレートの固定タグです。テンプレートを更新するときは、リポジトリ側で新しいタグを作り、利用側で参照タグを変更します。

生成後は内容を確認してから依存をインストールします。

```sh
cd quarterly
npm install
npm run dev
```

## 現在のテンプレートとの互換性

2026-11-01 時点の `v0.1.0` は、`template.json` で `kitDep` を宣言する一方、`templates/corporate/package.json` では `{{deckDep}}` を使っており、`npm install` 前にそのままでは解決しないトークンがあります。また、旧パッケージ名の依存指定が残っています。

そのため、現状この例は **GitHub からテンプレートを取得して生成する方法の例**です。実際に依存をインストールする前に、上流のテンプレートを現在の `slidev-kit` に合わせて更新する必要があります。テンプレート側では `slidev-kit` 依存を `{{kitDep}}` で指定し、manifest の token 宣言と一致させてください。
