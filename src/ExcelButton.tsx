import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLibrary } from './store';
export function ExcelButton({ onClick, children, className = 'button secondary' }: { onClick: () => Promise<unknown>; children: ReactNode; className?: string }) {
  const [busy, setBusy] = useState(false); const { notify } = useLibrary();
  return <button className={className} disabled={busy} aria-busy={busy} onClick={async () => { setBusy(true); try { await onClick(); } catch (e) { notify(`Chưa xuất được tệp: ${(e as Error).message}`, true); } finally { setBusy(false); } }}>{busy ? 'Đang tạo Excel…' : children}</button>;
}
