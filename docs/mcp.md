# MCP サーバー

`slidev-kit mcp` は stdio 経由でスライド操作ツールを公開します。MCP 対応クライアントから起動し、作業ディレクトリと対象デッキは環境変数で指定できます。

```json
{
  "mcpServers": {
    "slidev-kit": {
      "command": "npx",
      "args": ["slidev-kit", "mcp"],
      "env": {
        "SLIDEV_MCP_CWD": "/path/to/deck",
        "SLIDEV_MCP_ENTRY": "slides.md"
      }
    }
  }
}
```

提供ツールはデッキ情報取得、スライド編集、プロジェクト内ファイル操作、検証、ビルド、PDF出力です。任意のシェル実行ツールはありません。ファイル操作はプロジェクト内に制限されます。

MCP サーバーはツールを提供するだけで、モデルやシステムプロンプトは持ちません。AI に不慣れな利用者向けのプロンプト付き対話は `slidev-kit agent` を利用してください。
