import { AuthContext as Context } from './contexts';
import { useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useLibrary } from './store';
import { addDays, today, uid } from './domain';
import type { Reader } from './domain';

export type Member = { id: string; name: string; email: string; role: 'admin' | 'reader'; readerId?: string };
type Invitation = { readerId: string; hash: string; expiresAt: string };
const invitationKey = 'folio-reader-access-v1';
function readInvitations(): Invitation[] { const raw = localStorage.getItem(invitationKey); if (!raw) return []; const value = JSON.parse(raw); if (!Array.isArray(value)) throw new Error('Dữ liệu cấp thẻ không hợp lệ.'); return value; }
async function accessHash(token: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map(b => b.toString(16).padStart(2, '0')).join(''); }
type Account = Member & { salt: string; hash: string };
type Registration = { name: string; email: string; phone: string; password: string };
const accountsKey = 'folio-accounts-v1', sessionKey = 'folio-session-v1';
const hex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bytes));
}
async function newAccount(member: Member, password: string): Promise<Account> { const salt = hex(crypto.getRandomValues(new Uint8Array(16))); return { ...member, salt, hash: await passwordHash(password, salt) }; }
async function accounts(): Promise<Account[]> {
  const stored = localStorage.getItem(accountsKey);
  if (stored) { const parsed = JSON.parse(stored); if (!Array.isArray(parsed)) throw new Error('Không đọc được tài khoản trên thiết bị này.'); return parsed; }
  const initial = await Promise.all([
    newAccount({ id: 'ADMIN-DEMO', name: 'Linh Hoàng', email: 'admin@folio.vn', role: 'admin' }, 'Folio@2026'),
    newAccount({ id: 'READER-DEMO', name: 'Nguyễn Minh Anh', email: 'docgia@folio.vn', role: 'reader', readerId: 'DG-0001' }, 'Docgia@2026'),
  ]);
  localStorage.setItem(accountsKey, JSON.stringify(initial)); return initial;
}
function publicMember(account: Account): Member { const { id, name, email, role, readerId } = account; return { id, name, email, role, readerId }; }
function readSession(): Member | null {
  try { const raw = sessionStorage.getItem(sessionKey) ?? localStorage.getItem(sessionKey); if (!raw) return null; const value = JSON.parse(raw); return value.id && ['reader', 'admin'].includes(value.role) ? value : null; } catch { return null; }
}
export type Auth = { member: Member | null; signIn: (email: string, password: string, remember: boolean) => Promise<Member>; signUp: (input: Registration) => Promise<Member>; signOut: () => void; issueReaderAccess: (readerId: string) => Promise<{ url: string; expiresAt: string }>; activateReaderAccess: (token: string, email: string, password: string) => Promise<void>; changePassword: (current: string, next: string) => Promise<void> };

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, act, open } = useLibrary();
  const [member, setMember] = useState<Member | null>(readSession);
  const beginSession = (value: Member, remember = false) => { sessionStorage.removeItem(sessionKey); localStorage.removeItem(sessionKey); (remember ? localStorage : sessionStorage).setItem(sessionKey, JSON.stringify(value)); setMember(value); };
  const signIn = async (email: string, password: string, remember: boolean) => {
    const found = (await accounts()).find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || await passwordHash(password, found.salt) !== found.hash) throw new Error('Email hoặc mật khẩu chưa đúng. Kiểm tra lại và thử tiếp.');
    const value = publicMember(found); beginSession(value, remember); return value;
  };
  const signUp = async (input: Registration) => {
    const existing = await accounts(), email = input.email.trim().toLowerCase(), phone = input.phone.replace(/[\s()-]/g, '');
    if (existing.some(a => a.email.toLowerCase() === email)) throw new Error('Email này đã có tài khoản. Chọn đăng nhập để tiếp tục.');
    if (input.name.trim().length < 2 || !/^\+?[0-9]{9,13}$/.test(phone)) throw new Error('Nhập họ tên và số điện thoại hợp lệ.');
    if (input.password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
    if (data.readers.some(r => r.phone.replace(/[\s()-]/g, '') === phone || (r.email && r.email.toLowerCase() === email))) throw new Error('Thông tin này đã có hồ sơ thư viện. Liên hệ quầy để liên kết tài khoản.');
    const n = Math.max(0, ...data.readers.map(r => Number(r.id.replace('DG-', '')) || 0)) + 1;
    const reader: Reader = { id: `DG-${String(n).padStart(4, '0')}`, name: input.name.trim(), phone, email, group: 'Độc giả trực tuyến', joinedAt: today(), expiresAt: addDays(today(), 365), active: true, color: '#e4e8f3' };
    const account = await newAccount({ id: uid('USER-'), name: reader.name, email, role: 'reader', readerId: reader.id }, input.password);
    const before = localStorage.getItem(accountsKey);
    localStorage.setItem(accountsKey, JSON.stringify([...existing, account]));
    if (!act(d => ({ ...d, readers: [reader, ...d.readers] }), 'Đã tạo hồ sơ độc giả.')) { if (before === null) localStorage.removeItem(accountsKey); else localStorage.setItem(accountsKey, before); throw new Error('Chưa lưu được hồ sơ. Vui lòng thử lại.'); }
    const value = publicMember(account); beginSession(value); return value;
  };
  const issueReaderAccess = async (readerId: string) => {
    if (member?.role !== 'admin') throw new Error('Chỉ quản trị viên được cấp liên kết.');
    const reader = data.readers.find(r => r.id === readerId);
    if (!reader || !reader.active || reader.expiresAt < today()) throw new Error('Thẻ cần hoạt động và còn hiệu lực trước khi cấp tài khoản.');
    if ((await accounts()).some(a => a.readerId === readerId)) throw new Error('Thẻ này đã được liên kết với tài khoản trực tuyến.');
    const token = hex(crypto.getRandomValues(new Uint8Array(24))), hash = await accessHash(token);
    const expiresAt = new Date(Date.now() + 72 * 3600000).toISOString();
    const next = readInvitations().filter(i => i.readerId !== readerId && i.expiresAt >= new Date().toISOString());
    localStorage.setItem(invitationKey, JSON.stringify([...next, { readerId, hash, expiresAt }]));
    return { url: `${location.origin}${location.pathname}#activate?token=${encodeURIComponent(token)}`, expiresAt };
  };
  const activateReaderAccess = async (token: string, inputEmail: string, password: string) => {
    if (member) throw new Error('Đăng xuất tài khoản hiện tại trước khi kích hoạt thẻ.');
    const email = inputEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) throw new Error('Nhập email hợp lệ và mật khẩu ít nhất 8 ký tự.');
    const invitations = readInvitations(), hash = await accessHash(token), invitation = invitations.find(i => i.hash === hash);
    if (!invitation || invitation.expiresAt < new Date().toISOString()) throw new Error('Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng nhờ quầy cấp lại.');
    const reader = data.readers.find(r => r.id === invitation.readerId);
    if (!reader || !reader.active || reader.expiresAt < today()) throw new Error('Thẻ không còn hiệu lực. Liên hệ quầy để kiểm tra.');
    const existing = await accounts();
    if (existing.some(a => a.readerId === reader.id)) throw new Error('Thẻ đã kích hoạt. Vui lòng đăng nhập hoặc liên hệ quầy.');
    if (existing.some(a => a.email.toLowerCase() === email) || data.readers.some(r => r.id !== reader.id && r.email.toLowerCase() === email)) throw new Error('Email đã được sử dụng. Vui lòng chọn email khác.');
    const account = await newAccount({ id: uid('USER-'), name: reader.name, email, role: 'reader', readerId: reader.id }, password);
    const before = localStorage.getItem(accountsKey);
    localStorage.setItem(accountsKey, JSON.stringify([...existing, account]));
    if (!act(d => ({ ...d, readers: d.readers.map(r => r.id === reader.id ? { ...r, email } : r) }), 'Đã liên kết tài khoản, giữ nguyên lịch sử mượn.')) {
      if (before === null) localStorage.removeItem(accountsKey); else localStorage.setItem(accountsKey, before);
      throw new Error('Chưa lưu được thông tin thẻ. Vui lòng thử lại.');
    }
    // Account uniqueness also prevents reusing a link if consuming the invitation cannot be persisted.
    try { localStorage.setItem(invitationKey, JSON.stringify(invitations.filter(i => i.hash !== hash))); } catch { /* already linked */ }
    beginSession(publicMember(account));
  };
  const changePassword = async (current: string, next: string) => {
    if (!member) throw new Error('Vui lòng đăng nhập lại.');
    if (next.length < 8) throw new Error('Mật khẩu mới cần ít nhất 8 ký tự.');
    if (current === next) throw new Error('Mật khẩu mới cần khác mật khẩu hiện tại.');
    const existing = await accounts(), account = existing.find(a => a.id === member.id);
    if (!account || await passwordHash(current, account.salt) !== account.hash) throw new Error('Mật khẩu hiện tại chưa đúng.');
    const replacement = await newAccount(publicMember(account), next);
    localStorage.setItem(accountsKey, JSON.stringify(existing.map(a => a.id === member.id ? replacement : a)));
  };
  const signOut = () => { localStorage.removeItem(sessionKey); sessionStorage.removeItem(sessionKey); setMember(null); open(null); location.hash = 'home'; };
  return <Context.Provider value={{ member, signIn, signUp, signOut, issueReaderAccess, activateReaderAccess, changePassword }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('Missing AuthProvider'); return value; }
