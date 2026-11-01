import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Type } from '@earendil-works/pi-ai'
import {
  deckInfo, getSlide, insertSlide, moveSlide, readProjectFile, removeSlide, updateSlide, writeProjectFile,
} from './deck.mjs'

const require = createRequire(import.meta.url)
const text = value => ({ content: [{ type: 'text', text: value }], details: {} })
const json = value => text(JSON.stringify(value, null, 2))

function reportCli() {
  // 同梱tarball / リポジトリ直インストール（npx github:）の両対応。
  try {
    const pkgPath = require.resolve('slidev-report/package.json')
    return join(dirname(pkgPath), 'src', 'cli.mjs')
  } catch {
    return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'slidev-report', 'src', 'cli.mjs')
  }
}

function report(root, args) {
  const result = spawnSync(process.execPath, [reportCli(), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  if (result.error) throw new Error(`slidev-report を起動できません: ${result.error.message}`)
  if (result.status !== 0) {
    throw new Error(`slidev-report ${args.join(' ')} が失敗しました（exit ${result.status}）。\n${(result.stderr || result.stdout || '').trim()}`)
  }
  return (result.stdout || '').trim()
}

function packageFile(name, file) {
  const candidates = []
  try {
    candidates.push(join(dirname(require.resolve(`${name}/package.json`)), file))
  } catch {
    // リポジトリ直インストール（npx github:）では隣のworkspaceを相対参照する。
    const sibling = join(dirname(fileURLToPath(import.meta.url)), '..', '..', name, file)
    if (existsSync(sibling)) candidates.push(sibling)
  }
  // テーマに同梱されている場合（slidev-template/node_modules/slidev-charts）を解決する。
  if (name === 'slidev-charts') {
    try {
      const themePkg = require.resolve('slidev-template/package.json')
      const bundled = join(dirname(themePkg), 'node_modules', 'slidev-charts')
      if (existsSync(join(bundled, 'package.json'))) candidates.push(join(bundled, file))
    } catch {}
  }
  const found = candidates.find((path) => existsSync(path))
  if (!found) throw new Error(`${name} が見つかりません。`)
  return found
}

export function createSlideTools(root, entry = 'slides.md') {
  const deckEntry = () => entry
  return [
    {
      name: 'deck_info',
      label: 'Deck info',
      description: 'デッキのタイトル、テーマ、スライド一覧、ref/ の参考資料一覧を取得する。',
      parameters: Type.Object({}),
      execute: async () => json(deckInfo(root, deckEntry())),
    },
    {
      name: 'list_slides',
      label: 'List slides',
      description: 'スライド番号、layout、title、行番号の一覧を取得する。',
      parameters: Type.Object({}),
      execute: async () => json(deckInfo(root, deckEntry()).slides),
    },
    {
      name: 'get_slide',
      label: 'Get slide',
      description: '指定スライドの frontmatter、本文、スピーカーノートを取得する。',
      parameters: Type.Object({ no: Type.Number({ minimum: 1 }) }),
      execute: async (_id, params) => json(getSlide(root, deckEntry(), params.no)),
    },
    {
      name: 'update_slide',
      label: 'Update slide',
      description: 'スライドの本文・ノート・frontmatter を部分更新する。frontmatter の値に null を渡すとキーを削除する。',
      parameters: Type.Object({
        no: Type.Number({ minimum: 1 }),
        content: Type.Optional(Type.String()),
        note: Type.Optional(Type.String()),
        frontmatter: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      execute: async (_id, params) => json(updateSlide(root, deckEntry(), params.no, params)),
    },
    {
      name: 'insert_slide',
      label: 'Insert slide',
      description: '指定スライドの直後に新しいスライドを挿入する。after=0 で先頭に挿入する。',
      parameters: Type.Object({
        after: Type.Number({ minimum: 0 }),
        content: Type.String(),
        note: Type.Optional(Type.String()),
        frontmatter: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      execute: async (_id, params) => json(insertSlide(root, deckEntry(), params.after, params)),
    },
    {
      name: 'remove_slide',
      label: 'Remove slide',
      description: '指定スライドを削除する。',
      parameters: Type.Object({ no: Type.Number({ minimum: 1 }) }),
      execute: async (_id, params) => json(removeSlide(root, deckEntry(), params.no)),
    },
    {
      name: 'move_slide',
      label: 'Move slide',
      description: 'スライドを before または after の位置へ移動する。両方は指定できない。',
      parameters: Type.Object({
        from: Type.Number({ minimum: 1 }),
        before: Type.Optional(Type.Number({ minimum: 1 })),
        after: Type.Optional(Type.Number({ minimum: 1 })),
      }),
      execute: async (_id, params) => {
        if ((params.before == null) === (params.after == null)) throw new Error('before または after のどちらか一方を指定してください。')
        return json(moveSlide(root, deckEntry(), params.from, params))
      },
    },
    {
      name: 'read_file',
      label: 'Read file',
      description: 'プロジェクト内のテキストファイルを読む。デッキ・CSV・ドキュメントの確認に使う。',
      parameters: Type.Object({ file: Type.String() }),
      execute: async (_id, params) => text(readProjectFile(root, params.file).content),
    },
    {
      name: 'write_file',
      label: 'Write file',
      description: 'プロジェクト内の .md/.csv/.json/.py/.ts/.vue/.txt を書き込む。デッキ本体は update_slide を優先する。',
      parameters: Type.Object({ file: Type.String(), content: Type.String() }),
      execute: async (_id, params) => {
        if (!/\.(md|csv|json|py|ts|vue|txt)$/i.test(params.file)) throw new Error('許可されていない拡張子です。')
        return json(writeProjectFile(root, params.file, params.content))
      },
    },
    {
      name: 'list_presets',
      label: 'List chart presets',
      description: '利用可能な Chart プリセットとCSVスキーマを取得する。',
      parameters: Type.Object({}),
      execute: async () => json(JSON.parse(readFileSync(packageFile('slidev-charts', 'src/presets/presets.json'), 'utf8'))),
    },
    {
      name: 'list_chart_themes',
      label: 'List chart themes',
      description: '利用可能な図表カラーテーマを取得する。',
      parameters: Type.Object({}),
      execute: async () => {
        const dir = packageFile('slidev-charts', 'src/themes')
        return json(readdirSync(dir).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)))
      },
    },
    {
      name: 'list_layouts',
      label: 'List layouts',
      description: 'テーマで利用可能な Slidev レイアウト名を取得する。',
      parameters: Type.Object({}),
      execute: async () => {
        const dir = packageFile('slidev-template', 'layouts')
        return json(readdirSync(dir).filter(name => name.endsWith('.vue')).map(name => name.slice(0, -4)))
      },
    },
    {
      name: 'validate_deck',
      label: 'Validate deck',
      description: 'デッキを検査する（slidev-kit build --check-only 相当）。frontmatter・layout・slot・画像/CSVパス・例文残骸を確認する。',
      parameters: Type.Object({}),
      execute: async () => text(report(root, ['check', deckEntry()])),
    },
    {
      name: 'build_deck',
      label: 'Build deck',
      description: 'slidev-kit build で静的HTMLを生成する。',
      parameters: Type.Object({}),
      execute: async () => text(report(root, ['build', deckEntry()])),
    },
    {
      name: 'export_pdf',
      label: 'Export PDF',
      description: 'slidev-kit pdf でPDFを出力する。WindowsではEdge、その他ではChromiumを検出する。',
      parameters: Type.Object({ output: Type.Optional(Type.String()) }),
      execute: async (_id, params) => {
        const args = ['export', deckEntry()]
        if (params.output) args.push('--output', params.output)
        return text(report(root, args))
      },
    },
  ]
}
