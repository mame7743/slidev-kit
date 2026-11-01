export declare function assertInside(root: string, path: string): string
export declare function splitDeck(text: string): any[]
export declare function formatSlide(slide: any): string
export declare function readDeck(root: string, entry?: string): { path: string; text: string; slides: any[] }
export declare function writeDeck(path: string, text: string): void
export declare function deckInfo(root: string, entry?: string): any
export declare function listReference(root: string): string[]
export declare function getSlide(root: string, entry: string | undefined, no: number): any
export declare function updateSlide(root: string, entry: string | undefined, no: number, patch: any): any
export declare function insertSlide(root: string, entry: string | undefined, after: number, slide: any): any
export declare function removeSlide(root: string, entry: string | undefined, no: number): any
export declare function moveSlide(root: string, entry: string | undefined, from: number, target: any): any
export declare function readProjectFile(root: string, file: string): { path: string; content: string }
export declare function writeProjectFile(root: string, file: string, content: string): { path: string; bytes: number }
