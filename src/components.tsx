import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cloneElement, createElement, isValidElement } from 'react';
import { icons } from './icon-data';
import { BookArtwork } from './BookArtwork';
import type { Book, Loan, LibraryData, Reader } from './domain';
import { addDays, today, loanStatus, initials, dateLabel } from './domain';

export type IconName = keyof typeof icons;
export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number; className?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{icons[name].map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i }))}</svg>; }
export function Logo() { return <span className="brand-mark"><svg width="23" height="25" viewBox="0 0 23 25" fill="none" aria-hidden="true"><path d="M4 3h16M4 10h12M4 17h7M4 3v19" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg></span>; }
export function Avatar({ reader, small = false }: { reader: Reader; small?: boolean }) { return <span className={`avatar ${small ? 'small' : ''}`} style={{ background: reader.color }}>{initials(reader.name)}</span>; }
export function Cover({ book, large = false }: { book: Book; large?: boolean }) { return <BookArtwork book={book} large={large} />; }
const statusNames = { returned: 'Đã trả', overdue: 'Quá hạn', active: 'Đang mượn' };
export function LoanBadge({ loan }: { loan: Loan }) { const status = loanStatus(loan); return <span className={`badge ${status}`}><span className="status-dot" />{statusNames[status]}</span>; }
export function ReaderBadge({ reader }: { reader: Reader }) { const expired = reader.expiresAt < today(); return <span className={`badge ${!reader.active ? 'neutral' : expired ? 'overdue' : 'active'}`}><span className="status-dot" />{!reader.active ? 'Đã khóa' : expired ? 'Hết hạn' : 'Hoạt động'}</span>; }
export function Empty({ title = 'Không tìm thấy kết quả', description = 'Thử thay đổi từ khóa hoặc bộ lọc.', action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="empty"><span><Icon name="Inbox" size={27} /></span><h3>{title}</h3><p>{description}</p>{action}</div>; }
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) { return <div className="search-input"><Icon name="Search" size={17} /><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button className="icon-button tiny" aria-label="Xóa tìm kiếm" onClick={() => onChange('')}><Icon name="X" size={14} /></button>}</div>; }
export function Pagination({ page, count, perPage = 8, onChange }: { page: number; count: number; perPage?: number; onChange: (p: number) => void }) { const pages = Math.max(1, Math.ceil(count / perPage)); const current = Math.min(page, pages); return <div className="pagination"><span>{count ? `${(current - 1) * perPage + 1}–${Math.min(current * perPage, count)} trong ${count} kết quả` : '0 kết quả'}</span><div><button className="page-button" aria-label="Trang trước" disabled={current <= 1} onClick={() => onChange(current - 1)}><Icon name="ChevronLeft" size={16} /></button>{Array.from({ length: pages }, (_, i) => <button key={i} className={`page-button ${current === i + 1 ? 'selected' : ''}`} aria-label={`Trang ${i + 1}`} aria-current={current === i + 1 ? 'page' : undefined} onClick={() => onChange(i + 1)}>{i + 1}</button>)}<button className="page-button" aria-label="Trang sau" disabled={current >= pages} onClick={() => onChange(current + 1)}><Icon name="ChevronRight" size={16} /></button></div></div>; }
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const target = ref.current; const focusable = () => Array.from(target?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
    (target?.querySelector<HTMLElement>('input:not([type="checkbox"])') ?? focusable()[0])?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'Tab') { const nodes = focusable(); const first = nodes[0], last = nodes[nodes.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = bodyOverflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className={`modal ${wide ? 'wide' : ''}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Đóng hộp thoại" onClick={onClose}><Icon name="X" size={20} /></button></header>{children}</div></div>;
}
export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const id = useId();
  const control = isValidElement<{ 'aria-labelledby'?: string }>(children) && typeof children.type === 'string' && ['input', 'select', 'textarea'].includes(children.type) ? cloneElement(children, { 'aria-labelledby': id }) : children;
  return <label className="field"><span id={id}>{label}</span>{control}{hint && <small>{hint}</small>}</label>;
}
export function CirculationChart({ data, days = 30 }: { data: LibraryData; days?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const count = days === 7 ? 7 : 10;
  const bucket = days / count;
  const groups = Array.from({ length: count }, (_, i) => {
    const from = addDays(today(), -days + Math.floor(i * bucket) + 1), to = addDays(today(), -days + Math.floor((i + 1) * bucket));
    return { from, to, borrow: data.loans.filter(l => l.borrowedAt >= from && l.borrowedAt <= to).reduce((n, l) => n + l.items.length, 0), returned: data.loans.reduce((n, l) => n + l.items.filter(x => x.returnedAt && x.returnedAt >= from && x.returnedAt <= to).length, 0) };
  });
  const max = Math.max(4, ...groups.flatMap(g => [g.borrow, g.returned])); const top = Math.ceil(max / 4) * 4;
  return <div className="chart-container"><div className="chart-legend"><span><i className="legend-borrow" />Sách mượn</span><span><i className="legend-return" />Sách trả</span><small>Đơn vị: cuốn</small></div><svg className="circulation-chart" viewBox="0 0 700 205" role="img" aria-label={`Biểu đồ số sách mượn và trả trong ${days} ngày qua`}>
    {[0, 1, 2, 3, 4].map(i => <g key={i}><text x="27" y={171 - i * 38} textAnchor="end" className="axis-label">{i * top / 4}</text><line x1="40" x2="690" y1={166 - i * 38} y2={166 - i * 38} stroke="#eaecef" strokeDasharray={i === 0 ? undefined : '3 4'} /></g>)}
    {groups.map((g, i) => { const x = 53 + i * (630 / count), w = Math.min(19, 200 / count); return <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}><rect x={x - 4} y="10" width={630 / count - 6} height="164" fill={hover === i ? '#f5f6f8' : 'transparent'} rx="4" /><rect x={x} y={166 - g.borrow / top * 152} width={w} height={g.borrow / top * 152} rx="3" fill="#ec815b" /><rect x={x + w + 4} y={166 - g.returned / top * 152} width={w} height={g.returned / top * 152} rx="3" fill="#d8dee5" /><text x={x + w} y="194" textAnchor="middle" className="axis-label">{g.to.slice(8, 10)}/{g.to.slice(5, 7)}</text><title>{dateLabel(g.from)}–{dateLabel(g.to)}: {g.borrow} sách mượn, {g.returned} sách trả</title></g>; })}
  </svg>{hover !== null && <div className="chart-tooltip">{dateLabel(groups[hover].from)}: {groups[hover].borrow} mượn · {groups[hover].returned} trả</div>}</div>;
}
