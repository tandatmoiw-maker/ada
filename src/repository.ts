import type { LibraryData } from './domain';
import { seedData } from './seed';

/** Replace this adapter with HTTP requests when the backend is ready. */
export interface LibraryRepository { load(): LibraryData; save(data: LibraryData): void; }
const key = 'folio-library-v1';
export const libraryRepository: LibraryRepository = {
  load() { const raw = localStorage.getItem(key); if (!raw) return seedData(); const parsed = JSON.parse(raw) as LibraryData; if (parsed.version !== 1 || !Array.isArray(parsed.books) || !Array.isArray(parsed.loans)) throw new Error('Dữ liệu lưu trên máy không hợp lệ.'); return parsed; },
  save(data) { localStorage.setItem(key, JSON.stringify(data)); },
};

export function downloadFile(name: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([type.startsWith('text/csv') ? '\uFEFF' + text : text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
}
