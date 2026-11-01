export declare class CsvError extends Error {
  row?: number
  column?: string
}
export declare function parseCsv(text: string): { headers: string[]; records: Record<string, unknown>[] }
export declare function validateRecords(records: Record<string, unknown>[], schema: unknown, options?: { schemaName?: string }): Record<string, unknown>[]
export declare function parseAndValidate(text: string, schema: unknown, options?: { schemaName?: string }): { headers: string[]; records: Record<string, unknown>[] }
