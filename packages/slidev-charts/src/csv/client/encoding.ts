export type CsvEncoding = 'auto' | 'utf-8' | 'shift_jis'

/**
 * CSVのバイト列を文字列へ変換する。
 * auto はUTF-8として厳密に読み、失敗した場合にShift-JISへフォールバックする。
 */
export function decodeCsvBytes(buffer: ArrayBuffer, encoding: CsvEncoding | string = 'auto'): string {
  const label = String(encoding).toLowerCase().replace('_', '-')
  if (label === 'shift-jis' || label === 'sjis') {
    return new TextDecoder('shift_jis').decode(buffer)
  }
  if (label === 'utf-8' || label === 'utf8') {
    return new TextDecoder('utf-8').decode(buffer)
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('shift_jis').decode(buffer)
  }
}
