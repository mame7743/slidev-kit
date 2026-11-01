import { parse } from '@vue/compiler-dom'
import JSON5 from 'json5'

function withoutFences(text) {
  const lines = text.split(/\r?\n/)
  let fence
  return lines.map(line => {
    const match = line.match(/^\s*(`{3,}|~{3,})/)
    if (match) {
      if (!fence) fence = match[1]
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = undefined
      return ''
    }
    return fence ? '' : line
  }).join('\n').replace(/`[^`\n]*`/g, '')
}

function findTags(text) {
  const tags = []
  let index = 0
  while (index < text.length) {
    const match = /<Chart\b/ig.exec(text.slice(index))
    if (!match) break
    const start = index + match.index
    const name = 'Chart'
    const next = text[start + match[0].length]
    if (next && !/[\s/>]/.test(next)) { index = start + match[0].length; continue }
    let quote = ''
    let braces = 0
    let end = -1
    for (let i = start + match[0].length; i < text.length; i++) {
      const char = text[i]
      if (quote) {
        if (char === quote && text[i - 1] !== '\\') quote = ''
        continue
      }
      if (char === '"' || char === "'" || char === '`') { quote = char; continue }
      if (char === '{' || char === '[') braces++
      else if (char === '}' || char === ']') braces--
      else if (char === '>' && braces === 0) { end = i; break }
    }
    if (end < 0) throw new Error('Chart タグが閉じられていません。')
    const tag = text.slice(start, end + 1)
    if (!/\/\s*>$/.test(tag)) throw new Error(`${name} は自己終了タグ（<${name} ... />）で記述してください。`)
    tags.push({ tag, name, line: text.slice(0, start).split('\n').length })
    index = end + 1
  }
  return tags
}

function literal(exp, name, line) {
  try {
    return JSON5.parse(exp)
  } catch {
    throw new Error(`Chart の :${name} は静的なリテラルで指定してください（${line}行目）。`)
  }
}

function propsOf(node, line) {
  const props = {}
  for (const prop of node.props ?? []) {
    if (prop.type === 6) {
      if (!prop.name || prop.name.startsWith('v-')) continue
      props[prop.name] = prop.value ? prop.value.content : true
      continue
    }
    if (prop.type === 7 && prop.name === 'bind') {
      if (!prop.arg || prop.arg.type !== 4) throw new Error(`Chart の v-bind は属性名を指定してください（${line}行目）。`)
      const name = prop.arg.content
      const exp = prop.exp?.content
      if (!exp) throw new Error(`Chart の :${name} に値がありません（${line}行目）。`)
      props[name] = literal(exp, name, line)
    }
  }
  return props
}

export function scanMarkdown(text) {
  const source = withoutFences(text)
  return findTags(source).map(({ tag, name, line }) => {
    let ast
    try {
      ast = parse(tag, { comments: false })
    } catch (error) {
      throw new Error(`Chart タグを解析できません（${line}行目）: ${error.message}`)
    }
    const node = ast.children.find(child => child.type === 1)
    if (!node) throw new Error(`Chart タグを解析できません（${line}行目）。`)
    return { tag: name, props: propsOf(node, line), line }
  })
}
