import { LibraryContext as Context } from './contexts';
import { useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LibraryData } from './domain';
import { libraryRepository } from './repository';
import { seedData } from './seed';

export type View = 'overview' | 'books' | 'readers' | 'loans' | 'fines' | 'reports' | 'settings' | 'counter';
export type ModalState = { kind: 'book' | 'reader' | 'loan' | 'return' | 'bookDetail' | 'readerDetail' | 'readerAccess' | 'payment' | 'loanDetail' | 'search' | 'notifications' | 'help' | 'profile' | 'confirm'; id?: string; title?: string; description?: string; confirm?: () => void } | null;
export type Store = { data: LibraryData; act: (fn: (d: LibraryData) => LibraryData, message: string) => boolean; modal: ModalState; open: (m: ModalState) => void; toast: { text: string; error: boolean } | null; notify: (text: string, error?: boolean) => void; view: View; navigate: (v: View, status?: string) => void; syncView: (v: View) => void };

const views: View[] = ['overview', 'books', 'readers', 'loans', 'fines', 'reports', 'settings', 'counter'];
export function readView(): View { const hash = location.hash.slice(1).split('?')[0] as View; return views.includes(hash) ? hash : 'overview'; }
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => { try { return { data: libraryRepository.load(), error: false }; } catch { return { data: seedData(), error: true }; } });
  const [data, setData] = useState(initial.data);
  const [toast, setToast] = useState<Store['toast']>(initial.error ? { text: 'Không đọc được dữ liệu trên máy. Đang hiển thị dữ liệu mẫu; hãy sao lưu trước khi ghi thay đổi.', error: true } : null);
  const [modal, setModal] = useState<ModalState>(null);
  const [view, setView] = useState<View>(readView);
  const open = useCallback((value: ModalState) => {
    if (value?.kind === 'loan') { setView('counter'); location.hash = 'counter' + (value.id ? `?reader=${encodeURIComponent(value.id)}` : ''); setModal(null); }
    else setModal(value);
  }, []);
  const notify = useCallback((text: string, error = false) => { setToast({ text, error }); }, []);
  const act = (fn: (d: LibraryData) => LibraryData, message: string) => { try { const next = fn(data); libraryRepository.save(next); setData(next); notify(message); return true; } catch (e) { notify(e instanceof Error ? e.message : 'Không thể lưu dữ liệu. Hãy thử lại.', true); return false; } };
  const navigate = (v: View, status?: string) => { setView(v); location.hash = v + (status ? `?status=${encodeURIComponent(status)}` : ''); open(null); };
  return <Context.Provider value={{ data, act, modal, open, toast, notify, view, navigate, syncView: setView }}>{children}</Context.Provider>;
}
export function useLibrary() { const value = useContext(Context); if (!value) throw new Error('Missing LibraryProvider'); return value; }
