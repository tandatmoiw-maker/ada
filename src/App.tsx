import { useEffect, useState } from 'react';
import { LibraryProvider, useLibrary, readView } from './store';
import type { View } from './store';
import { Icon, Logo } from './components';
import type { IconName } from './components';
import { loanStatus } from './domain';
import { Overview, Books, Readers, Loans, Fines, Reports, Settings } from './pages';
import { ModalHost } from './modals';
import { AuthProvider } from './auth';
import { ExperienceRouter } from './PublicExperience';
import CounterDesk from './CounterDesk';

const navigation: { view: View; label: string; icon: IconName; group: string }[] = [
  { view: 'overview', label: 'Tổng quan', icon: 'LayoutDashboard', group: 'workspace' },
  { view: 'books', label: 'Danh mục sách', icon: 'BookOpen', group: 'workspace' },
  { view: 'readers', label: 'Độc giả', icon: 'Users', group: 'workspace' },
  { view: 'loans', label: 'Mượn & trả', icon: 'ArrowLeftRight', group: 'workspace' },
  { view: 'fines', label: 'Tiền phạt', icon: 'CircleDollarSign', group: 'workspace' },
  { view: 'reports', label: 'Báo cáo & thống kê', icon: 'ChartNoAxesCombined', group: 'management' },
  { view: 'settings', label: 'Cài đặt thư viện', icon: 'Settings2', group: 'management' },
];
function Workspace() {
  const { data, view, navigate, syncView, open, toast, notify } = useLibrary();
  const [mobileNav, setMobileNav] = useState(false);
  const current = navigation.find(n => n.view === view) ?? { label: 'Lập phiếu tại quầy' };
  const overdue = data.loans.filter(l => loanStatus(l) === 'overdue').length;
  const unread = overdue + data.fines.filter(f => !f.paid).length;
  useEffect(() => { const listener = () => { const next = location.hash.slice(1).split('?')[0]; if (navigation.some(n => n.view === next) || next === 'counter') syncView(readView()); setMobileNav(false); }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, [syncView]);
  useEffect(() => { const listener = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open({ kind: 'search' }); } if (e.key === 'Escape') setMobileNav(false); }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, [open]);
  useEffect(() => { if (toast && !toast.error) { const timer = setTimeout(() => notify(''), 5000); return () => clearTimeout(timer); } }, [toast, notify]);
  useEffect(() => { const listener = (event: Event) => { const detail = (event as CustomEvent<{message: string; error?: boolean}>).detail; notify(detail.message, !!detail.error); }; window.addEventListener('folio-export', listener); return () => window.removeEventListener('folio-export', listener); }, [notify]);
  const go = (v: View) => { navigate(v); setMobileNav(false); window.scrollTo(0, 0); };
  const pages = { overview: Overview, books: Books, readers: Readers, loans: Loans, fines: Fines, reports: Reports, settings: Settings, counter: CounterDesk };
  const Page = pages[view];
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Đến nội dung chính</a>
    {mobileNav && <button className="nav-overlay" aria-label="Đóng điều hướng" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`} aria-label="Điều hướng chính">
      <button className="brand" onClick={() => go('overview')} aria-label="Folio, về tổng quan"><Logo /><span>folio<span className="brand-period">.</span></span><span className="brand-tag">library</span></button>
      <div className="workspace-label"><span className="workspace-icon"><Icon name="Library" size={19} /></span><div><strong>{data.settings.name}</strong><span>Không gian quản trị</span></div><Icon name="ShieldCheck" size={16} /></div>
      <nav>{['workspace', 'management'].map(group => <div className="nav-group" key={group}><p className="nav-caption">{group === 'workspace' ? 'Không gian làm việc' : 'Quản lý'}</p>{navigation.filter(n => n.group === group).map(n => <button key={n.view} aria-label={n.label} title={n.label} className={`nav-item ${view === n.view || (view === 'counter' && n.view === 'loans') ? 'active' : ''}`} aria-current={view === n.view ? 'page' : undefined} onClick={() => go(n.view)}><Icon name={n.icon} size={19} /><span>{n.label}</span>{n.view === 'loans' && overdue > 0 && <span className="nav-count">{overdue}</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" aria-label="Xem trang độc giả" title="Xem trang độc giả" onClick={() => { location.hash = 'home'; }}><Icon name="ExternalLink" size={19} /><span>Xem trang độc giả</span></button><button className="nav-item" aria-label="Trợ giúp và hướng dẫn" title="Trợ giúp và hướng dẫn" onClick={() => { open({ kind: 'help' }); setMobileNav(false); }}><Icon name="HelpCircle" size={19} /><span>Trợ giúp & hướng dẫn</span><Icon name="ArrowUpRight" size={14} /></button><button className="profile" aria-label="Tài khoản Linh Hoàng, quản trị viên" onClick={() => { open({ kind: 'profile' }); setMobileNav(false); }}><span className="admin-avatar">LH</span><span><strong>Linh Hoàng</strong><small>Quản trị viên</small></span><Icon name="ChevronDown" size={16} /></button></div>
      <button className="mobile-nav-close icon-button" aria-label="Đóng menu" onClick={() => setMobileNav(false)}><Icon name="X" /></button>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Mở menu điều hướng" aria-expanded={mobileNav} onClick={() => setMobileNav(true)}><Icon name="Menu" size={21} /></button><Icon name="Library" size={17} /><span>Không gian làm việc</span><span className="breadcrumb-divider">/</span><strong>{current.label}</strong></div><div className="topbar-actions"><button className="global-search" aria-label="Tìm kiếm trong thư viện" onClick={() => open({ kind: 'search' })}><Icon name="Search" size={17} /><span>Tìm nhanh...</span><kbd>Ctrl K</kbd></button><span className="topbar-separator" /><button className="icon-button notification-button" aria-label={`Thông báo, ${unread} mục cần xử lý`} onClick={() => open({ kind: 'notifications' })}><Icon name="Bell" size={20} />{unread > 0 && <i />}</button><button className="admin-avatar top-avatar" aria-label="Tài khoản quản trị" onClick={() => open({ kind: 'profile' })}>LH</button></div></header>
      <main className="main-content" id="main-content" tabIndex={-1}><Page /></main><footer className="app-footer"><span>Folio Library Management</span><span><i />Không gian quản trị thư viện</span></footer>
    </div>
    <ModalHost />
    {toast?.text && <div role={toast.error ? 'alert' : 'status'} className={`toast ${toast.error ? 'error' : ''}`}><Icon name={toast.error ? 'AlertCircle' : 'CheckCircle2'} size={20} /><span>{toast.text}</span><button className="icon-button tiny" aria-label="Đóng thông báo" onClick={() => notify('')}><Icon name="X" size={16} /></button></div>}
  </div>;
}
export default function App() { return <LibraryProvider><AuthProvider><ExperienceRouter admin={<Workspace />} /></AuthProvider></LibraryProvider>; }
