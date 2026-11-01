import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*$/gm

export function assertInside(root, path) {
  const target = resolve(root, path)
  const rel = relative(resolve(root), target)
  if (rel.startsWith('..') || rel.startsWith('/') || rel.startsWith('\\')) throw new Error(`プロジェクト外のパスは扱えません: ${path}`)
  return target
}

export function splitDeck(text) {
  const matches = [...text.matchAll(FRONTMATTER)]
  if (matches.length === 0) throw new Error('frontmatter 付きの Slidev Markdown ではありません。')
  return matches.map((match, index) => {
    const start = match.index
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length
    const bodyStart = start + match[0].length
    const rawBody = text.slice(bodyStart, end)
    const noteMatch = rawBody.match(/\n?<!--([\s\S]*?)-->\s*$/)
    const note = noteMatch ? noteMatch[1].trim() : ''
    const body = noteMatch ? rawBody.slice(0, noteMatch.index) : rawBody
    return {
      no: index + 1,
      line: text.slice(0, start).split(/\r?\n/).length,
      start,
      end,
      frontmatter: parseYaml(match[1]) ?? {},
      content: body.trim(),
      note,
      raw: text.slice(start, end),
    }
  })
}

export function formatSlide(slide) {
  const yaml = stringifyYaml(slide.frontmatter ?? {}, { lineWidth: 0 }).trimEnd()
  const body = String(slide.content ?? '').trim()
  const note = String(slide.note ?? '').trim()
  return `---\n${yaml}\n---\n\n${body}${body ? '\n' : ''}${note ? `\n<!--${note}-->\n` : ''}`
}

export function readDeck(root, entry = 'slides.md') {
  const path = assertInside(root, entry)
  if (!existsSync(path)) throw new Error(`デッキがありません: ${entry}`)
  const text = readFileSync(path, 'utf8')
  return { path, text, slides: splitDeck(text) }
}

export function writeDeck(path, text) {
  writeFileSync(path, text)
}

export function deckInfo(root, entry = 'slides.md') {
  const { path, slides } = readDeck(root, entry)
  return {
    entry,
    path,
    title: slides[0]?.frontmatter?.title ?? null,
    theme: slides[0]?.frontmatter?.theme ?? null,
    totalSlides: slides.length,
    slides: slides.map(slide => ({
      no: slide.no,
      line: slide.line,
      layout: slide.frontmatter.layout ?? null,
      title: slide.frontmatter.title ?? null,
      takeaway: slide.frontmatter.takeaway ?? null,
    })),
    reference: listReference(root),
  }
}

// ref/ はユーザが置く参考資料（md / txt / csv / pdf / pptx / docx / xlsx など）。
// 一覧は deck_info の reference でエージェントに渡す。テキスト系だけ read_file で読める。
const REFERENCE_EXTENSIONS = new Set(['md', 'txt', 'csv', 'pdf', 'pptx', 'docx', 'xlsx'])

export function listReference(root) {
  const dir = resolve(root, 'ref')
  const files = []
  if (!existsSync(dir)) return files
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (REFERENCE_EXTENSIONS.has(extname(entry.name).slice(1).toLowerCase())) files.push(full)
    }
  }
  walk(dir)
  return files.map((file) => relative(resolve(root), file).split(sep).join('/')).sort()
}

export function getSlide(root, entry, no) {
  const { slides } = readDeck(root, entry)
  const slide = slides[Number(no) - 1]
  if (!slide) throw new Error(`スライド ${no} はありません（全${slides.length}枚）。`)
  return {
    no: slide.no,
    line: slide.line,
    frontmatter: slide.frontmatter,
    content: slide.content,
    note: slide.note,
  }
}

export function updateSlide(root, entry, no, patch) {
  const { path, text, slides } = readDeck(root, entry)
  const slide = slides[Number(no) - 1]
  if (!slide) throw new Error(`スライド ${no} はありません（全${slides.length}枚）。`)
  const frontmatter = { ...slide.frontmatter }
  for (const [key, value] of Object.entries(patch.frontmatter ?? {})) {
    if (value === null) delete frontmatter[key]
    else frontmatter[key] = value
  }
  const next = formatSlide({
    frontmatter,
    content: patch.content ?? slide.content,
    note: patch.note ?? slide.note,
  })
  writeDeck(path, text.slice(0, slide.start) + next + text.slice(slide.end))
  return { path, no: Number(no), frontmatter }
}

export function insertSlide(root, entry, after, slide) {
  const { path, text, slides } = readDeck(root, entry)
  const index = Number(after)
  if (index < 0 || index > slides.length) throw new Error(`after は 0〜${slides.length} で指定してください。`)
  const block = formatSlide({
    frontmatter: slide.frontmatter ?? { layout: 'body', title: '新しいスライド' },
    content: slide.content ?? '',
    note: slide.note ?? '',
  })
  const at = index === 0 ? slides[0].start : slides[index - 1].end
  writeDeck(path, text.slice(0, at) + block + text.slice(at))
  return { path, no: index + 1 }
}

export function removeSlide(root, entry, no) {
  const { path, text, slides } = readDeck(root, entry)
  const slide = slides[Number(no) - 1]
  if (!slide) throw new Error(`スライド ${no} はありません（全${slides.length}枚）。`)
  writeDeck(path, text.slice(0, slide.start) + text.slice(slide.end))
  return { path, removed: Number(no), title: slide.frontmatter.title ?? null }
}

export function moveSlide(root, entry, from, target) {
  const { path, text, slides } = readDeck(root, entry)
  const source = slides[Number(from) - 1]
  if (!source) throw new Error(`スライド ${from} はありません（全${slides.length}枚）。`)
  const raw = text.slice(source.start, source.end)
  const without = text.slice(0, source.start) + text.slice(source.end)
  const nextSlides = splitDeck(without)
  const anchor = target.before ?? target.after
  const anchorIndex = Number(anchor) - 1
  if (!nextSlides[anchorIndex]) throw new Error(`移動先 ${anchor} はありません。`)
  const at = target.before ? nextSlides[anchorIndex].start : nextSlides[anchorIndex].end
  writeDeck(path, without.slice(0, at) + raw + without.slice(at))
  return { path, from: Number(from), before: target.before ?? null, after: target.after ?? null }
}

export function readProjectFile(root, file) {
  const path = assertInside(root, file)
  if (!existsSync(path)) throw new Error(`ファイルがありません: ${file}`)
  return { path, content: readFileSync(path, 'utf8') }
}

export function writeProjectFile(root, file, content) {
  const path = assertInside(root, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  return { path, bytes: Buffer.byteLength(content) }
}
