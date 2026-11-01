# CSVテンプレート

| ファイル | プリセット | 列 |
|---|---|---|
| `category.csv` | `bar-compare` / `donut` | `category,value` |
| `target.csv` | `target-trend` | `period,actual,target` |
| `timeseries.csv` | `grouped-bar` / `stacked-bar` | `period,series,value` |
| `donut.csv` | `donut` | `category,value` |

- 1行目をヘッダーにします。
- 1列目をラベル、残りを数値列にします。
- UTF-8 / UTF-8 BOMに対応します。
- 数値はカンマ区切り・末尾`%`を受け付けます。
