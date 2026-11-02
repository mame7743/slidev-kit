#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// パッケージ内から実行されるため、テーマの場所は自身からの相対で解決する。
const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = existsSync(join(scriptDir, 'layouts')) ? scriptDir : resolve(scriptDir, '..')
const userRoot = process.cwd()
const { parseDeck, resolveDeckConfig, checkKitSlides, slideTokens, markdownImages } = await import(pathToFileURL(join(packageRoot, 'lib/deck-contract.mjs')).href)
const { isKitPreset } = await import(pathToFileURL(join(packageRoot, 'lib/kit-presets.mjs')).href)

const layouts = new Set(
  readdirSync(join(packageRoot, 'layouts'))
    .filter((file) => file.endsWith('.vue'))
    .map((file) => file.slice(0, -4)),
)
const variantDirs = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== 'standard')
        .map((entry) => entry.name)
    : []
const variants = new Set([...variantDirs(join(packageRoot, 'designs')), ...variantDirs(join(userRoot, 'designs'))])
const arrangementNames = new Set(
  Object.keys(JSON.parse(readFileSync(join(packageRoot, 'lib', 'layout', 'arrangements.json'), 'utf8'))),
)

const slotRules = {
  content: { allowed: ['second', 'third', 'fourth'], recommended: [] },
  summary: { allowed: ['evidence', 'request'], recommended: ['evidence', 'request'] },
  comparison: { allowed: ['left', 'right'], recommended: ['left', 'right'] },
  columns: { allowed: ['first', 'second', 'third'], recommended: ['first', 'second', 'third'] },
  figure: { allowed: ['figure'], recommended: ['figure'] },
  body: { allowed: [], recommended: [] },
  matrix: { allowed: [], recommended: [] },
  plan: { allowed: [], recommended: [] },
  cover: { allowed: [], recommended: [] },
  end: { allowed: [], recommended: [] },
}

// 見本・ひな形は例文を含むため、例文残骸チェックの対象外にする。
// テンプレートリポジトリのpackage.jsonから --samples=examples/slides.md,... として渡す。
// デッキでは指定しない（例文の残骸を検出する）。
const args = process.argv.slice(2)
const samplesArg = args.find((arg) => arg.startsWith('--samples='))
const sampleFiles = new Set(samplesArg ? samplesArg.slice('--samples='.length).split(',') : [])
const entryArgs = args.filter((arg) => !arg.startsWith('--'))

const examplePhrases = [
  'ポスト処理から自動化に着手する',
  '試行候補の評価例',
  '今回は候補Aを試行対象とする',
  '現行作業と標準化後の比較',
  '架空の評価例',
  '架空データによる記入例',
  '本資料の内容は架空です',
  'ひな形・例文を実際の内容に置き換える',
  '標準フォーマットの見本と記入例',
  '工程別工数の比較例',
  '月別の計画・実績の例',
  '試行の実施計画例',
  '標準化を支える仕組み',
  '作業が繰り返される',
  '出力書式を共通化できる',
  '小さく試行できる',
  '担当者ごとに結果を抽出',
  '図の配色と体裁を調整',
  '資料へコピーして報告',
  '必要な結果を一括抽出',
  '共通書式で図表を生成',
  '標準の欄に結果を配置',
  '現行資料と作業時間の確認',
  '標準フォーマットの試作',
  '実案件で試行',
  '効果と課題の整理',
  '報告工程が、この例では最大',
  '繰り返す図表作成を標準化',
  '候補A',
  '候補B',
  '候補C',
  '結論を1〜2文で記入',
  '事実を記入',
  '判断を記入',
  '図またはChartを配置',
  '資料タイトル',
  '所属・氏名',
  'YYYY-MM-DD',
  '見出し1',
  '見出し2',
  '見出し3',
]

const errors = []
const warnings = []
const error = (file, line, message) => errors.push(`${file}${line ? `:${line}` : ''}: ${message}`)
const warning = (file, line, message) => warnings.push(`${file}${line ? `:${line}` : ''}: ${message}`)
const lineAt = (text, index) => text.slice(0, index).split(/\r?\n/).length
const cleanValue = (value) => value?.trim().replace(/^['"]|['"]$/g, '')

function parseFrontmatter(block) {
  const get = (key) => {
    const match = block.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
    return match ? cleanValue(match[1]) : undefined
  }
  const variant = block.match(/^\s{2,}variant:\s*(.*)$/m)
  return {
    layout: get('layout'),
    density: get('density'),
    columns: get('columns'),
    textSize: get('textSize'),
    arrangement: get('arrangement'),
    ratio: get('ratio'),
    title: get('title'),
    takeaway: get('takeaway'),
    coverImage: get('coverImage'),
    colorSchema: get('colorSchema'),
    chart: get('chart'),
    chartType: get('chartType'),
    variant: variant ? cleanValue(variant[1]) : undefined,
  }
}

function checkAsset(file, line, label, raw, checkRelative = false) {
  if (!raw || /^(https?:|data:|blob:|mailto:|#)/.test(raw)) return
  const path = raw.split(/[?#]/)[0].trim()
  if (!path) return
  const candidates = []
  if (path.startsWith('/')) candidates.push(join(userRoot, 'public', path.slice(1)))
  // Only actual distributed theme assets are accepted; no namespace bypass.
  if (path.startsWith('/slidev-kit/') && !path.split('/').includes('..')) candidates.push(join(packageRoot, 'public', path.slice(1)))
  if (path.startsWith('data/')) candidates.push(join(userRoot, path), join(userRoot, 'public', path))
  if (path.startsWith('/data/')) candidates.push(join(userRoot, path.slice(1)))
  if (path.startsWith('public/')) candidates.push(join(userRoot, path))
  if (candidates.length === 0 && checkRelative) candidates.push(resolve(userRoot, dirname(file), path))
  if (candidates.length === 0) return
  if (!candidates.some((candidate) => existsSync(candidate))) {
    error(file, line, `${label}のパスがありません: ${raw}`)
  }
}

const rootMarkdown = readdirSync(userRoot)
  .filter((name) => name.endsWith('.md') && !['README.md', 'AGENTS.md', 'CLAUDE.md', 'HANDOFF.md'].includes(name))
const exampleMarkdown = existsSync(join(userRoot, 'examples'))
  ? readdirSync(join(userRoot, 'examples'))
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .map((name) => `examples/${name}`)
  : []
const mdFiles = entryArgs.length ? entryArgs : [...rootMarkdown, ...exampleMarkdown]

for (const file of mdFiles) {
  const text = readFileSync(join(userRoot, file), 'utf8')
  let deck, config
  try {
    deck = await parseDeck(text, resolve(userRoot, file))
    config = resolveDeckConfig(deck, resolve(userRoot, file))
  } catch (cause) {
    error(file, 1, cause.message)
    continue
  }
  const kit = isKitPreset(config.themeConfig.variant)
  let slides
  if (kit) {
    errors.push(...checkKitSlides(deck, file, config.themeConfig))
    slides = deck.slides.map((slide, index) => ({
      ...slide.frontmatter, body: slide.content, line: slide.start + 1, index: index + 1,
      images: markdownImages(slideTokens(slide)),
    }))
  } else {
    const blocks = [...text.matchAll(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*$/gm)]
    if (blocks.length === 0) {
      error(file, 1, 'frontmatterがありません')
      continue
    }

    slides = blocks.map((match, index) => {
      const bodyStart = match.index + match[0].length
      const bodyEnd = index + 1 < blocks.length ? blocks[index + 1].index : text.length
      return {
        ...parseFrontmatter(match[1]),
        body: text.slice(bodyStart, bodyEnd),
        bodyStart,
        line: lineAt(text, match.index),
        index: index + 1,
      }
    })
  }

  const headVariant = slides[0]?.variant
  const headColorSchema = slides[0]?.colorSchema
  const titles = new Map()
  let warnedDarkColorSchema = false

  for (const slide of slides) {
    const { layout } = slide
    if (!kit) {
      if (!layout) {
        error(file, slide.line, 'layoutがありません')
        continue
      }
      if (!layouts.has(layout)) error(file, slide.line, `不明なlayout: ${layout}`)

      const variant = slide.variant ?? headVariant ?? config.themeConfig.variant
      if (variant && !variants.has(variant)) error(file, slide.line, `不明なvariant: ${variant}`)
      const colorSchema = slide.colorSchema ?? headColorSchema
      if (variant === 'dark' && colorSchema !== 'dark' && !warnedDarkColorSchema) {
        warning(file, slide.line, 'variant: darkではcolorSchema: darkも指定してください')
        warnedDarkColorSchema = true
      }

      if (layout !== 'end' && !slide.title) error(file, slide.line, `${layout}にtitleがありません`)
      if (slide.textSize && !['large', 'medium', 'small'].includes(slide.textSize)) error(file, slide.line, `不明なtextSize: ${slide.textSize}`)
      if (slide.columns && !['2', '3'].includes(slide.columns)) error(file, slide.line, 'columnsは2または3を指定してください')
      if (slide.density && !['presentation', 'hybrid', 'reading'].includes(slide.density))
        error(file, slide.line, `不明なdensity: ${slide.density}`)
      if (layout === 'content') {
        if (slide.arrangement && !arrangementNames.has(slide.arrangement)) error(file, slide.line, `不明なarrangement: ${slide.arrangement}`)
        if (slide.ratio && !/^[1-9]:[1-9]$/.test(slide.ratio)) error(file, slide.line, 'ratioは7:3のような正の比率で指定してください')
      }

      if (slide.title) {
        if (titles.has(slide.title)) {
          error(file, slide.line, `titleが重複しています: ${slide.title}（${titles.get(slide.title)}枚目）`)
        } else {
          titles.set(slide.title, slide.index)
        }
      }

      const rule = slotRules[layout]
      const slots = [...slide.body.matchAll(/^::([a-zA-Z0-9_-]+)::\s*$/gm)].map((match) => match[1])
      if (rule) {
        for (const slot of slots) {
          if (!rule.allowed.includes(slot)) error(file, slide.line, `${layout}で使えないスロットです: ::${slot}::`)
        }
        const missing = rule.recommended.filter(
          (slot) => !slots.includes(slot) && !(layout === 'figure' && slot === 'figure' && slide.chart),
        )
        if (missing.length > 0) {
          warning(file, slide.line, `${layout}のスロットがありません: ${missing.map((slot) => `::${slot}::`).join(', ')}`)
        }
      }

      const hasFigure = layout === 'figure' && Boolean(slide.chart || slots.includes('figure'))
      if (hasFigure && !/^>\s*(データ|出典)\s*[:：]/m.test(slide.body)) {
        warning(file, slide.line, 'figureに出典行がありません（例: > データ: data/xxx.csv）')
      }
    }

    if (kit) {
      for (const src of slide.images) checkAsset(file, slide.line, '画像', src, true)
    }
    for (const match of (kit ? [] : slide.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g))) {
      checkAsset(file, lineAt(text, slide.bodyStart + match.index), '画像', match[1])
    }
    for (const match of slide.body.matchAll(/<Chart\b[\s\S]*?\/?>/g)) {
      const src = match[0].match(/(?:^|\s)src="([^"]+)"/)?.[1]
      if (src) checkAsset(file, lineAt(text, slide.bodyStart + match.index), 'Chart', src)
    }
    if (slide.coverImage) checkAsset(file, slide.line, 'coverImage', slide.coverImage)
    if (slide.chart) {
      checkAsset(file, slide.line, 'chart', slide.chart)
      if (layout !== 'figure') warning(file, slide.line, `chartはfigureレイアウトでのみ使用されます（現在: ${layout}）`)
    }
    if (slide.chartType && !['bar', 'line'].includes(slide.chartType)) {
      error(file, slide.line, `chartTypeはbarまたはlineで指定してください: ${slide.chartType}`)
    }
  }

  if (!sampleFiles.has(file)) {
    text.split(/\r?\n/).forEach((line, index) => {
      if (line.includes('check-ignore')) return
      for (const phrase of examplePhrases) {
        if (line.includes(phrase)) error(file, index + 1, `例文が残っています: 「${phrase}」`)
      }
    })
  }

  console.log(`${file}: ${slides.length} slides`)
}

if (warnings.length > 0) {
  console.log('\n警告:')
  for (const message of warnings) console.log(`  - ${message}`)
}
if (errors.length > 0) {
  console.error('\nエラー:')
  for (const message of errors) console.error(`  - ${message}`)
  process.exitCode = 1
} else {
  console.log('\nOK')
}
