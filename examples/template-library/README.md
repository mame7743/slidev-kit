# 社内テンプレートリポジトリの例

このディレクトリを GitHub リポジトリとしてタグ付けすると、複数のテンプレートを一つのライブラリで管理できます。各テンプレートは `template.json` と `slides.md` を持つディレクトリです。

```sh
slidev-kit init quarterly --template=github:YOUR_ORG/slidev-template/templates/corporate#v1.0.0
```

GitHub テンプレートのサブディレクトリを指定できます。生成プロジェクトには雛形と variant エントリがコピーされます。デザイン本体は `@example/slidev-designs` の固定タグを依存として使います。

`YOUR_ORG`、`@example`、`designDep` の既定値は社内リポジトリへ置くときに置き換えてください。テンプレートとデザインライブラリはそれぞれ独立したタグを切り、必要な更新だけをデッキに取り込む運用を想定しています。
