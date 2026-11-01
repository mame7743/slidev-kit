/**
 * CSVはデッキ側の data/*.csv をプラグインが public/data/ へコピーし、
 * コンポーネントは fetch で取得する。テーマパッケージとデッキを分離するため、
 * ビルド時同梱（import.meta.glob）は使わない。
 */

export function normalizeCsvPath(src: string): string {
  return src
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^public\//, '')
    .replace(/^data\//, '')
}

/** public/data/ 配下のCSVを取得するときのURL。 */
export function csvFetchUrl(src: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}data/${normalizeCsvPath(src)}`
}

export type CsvManifest = { files: string[] }

export function parseManifest(payload: unknown): CsvManifest {
  if (payload && typeof payload === 'object' && Array.isArray((payload as { files?: unknown }).files)) {
    const files = (payload as { files: unknown[] }).files
      .filter((file): file is string => typeof file === 'string')
      .map((file) => file.replace(/^data\//, ''))
    return { files }
  }
  return { files: [] }
}

/** 利用可能なCSV一覧（エラー表示用）。存在しない場合は空配列。 */
export async function fetchAvailableCsv(): Promise<string[]> {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${base}data/manifest.json`)
    if (!response.ok) return []
    return parseManifest(await response.json()).files
  } catch {
    return []
  }
}
