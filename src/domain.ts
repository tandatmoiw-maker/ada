export type Copy = { id: string; condition: 'ready' | 'repair' | 'lost' };
export type Book = { id: string; code: string; title: string; author: string; isbn: string; category: string; publisher: string; year: number; color: string; copies: Copy[]; addedAt: string };
export type Reader = { id: string; name: string; email: string; phone: string; group: string; joinedAt: string; expiresAt: string; active: boolean; color: string };
export type LoanItem = { bookId: string; copyId: string; returnedAt: string | null };
export type Loan = { id: string; readerId: string; borrowedAt: string; dueAt: string; renewals: number; items: LoanItem[]; note: string; channel?: 'counter' | 'reservation'; operator?: string; cancelledAt?: string; cancelReason?: string };
export type LoanRequest = { id: string; readerId: string; copyIds: string[]; createdAt: string; expiresAt: string; status: 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'declined'; note: string; loanId?: string; reason?: string };
export type Fine = { id: string; readerId: string; loanId: string; amount: number; paid: boolean; createdAt: string; reason: string; paidAt?: string; paymentMethod?: 'cash' | 'transfer'; paymentReference?: string; collectedBy?: string; receiptId?: string };
export type Settings = { name: string; email: string; address: string; loanDays: number; maxBooks: number; finePerDay: number; maxRenewals: number; renewalDays: number };
export type Activity = { id: string; text: string; at: string; kind: 'loan' | 'return' | 'book' | 'reader' | 'fine' };
export type LibraryData = { version: 1; books: Book[]; readers: Reader[]; loans: Loan[]; fines: Fine[]; activities: Activity[]; settings: Settings; requests?: LoanRequest[]; favorites?: Record<string, string[]> };

export const today = () => localDate(new Date());
export function localDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function paymentDay(fine: Fine) { return fine.paidAt && Number.isFinite(Date.parse(fine.paidAt)) ? localDate(new Date(fine.paidAt)) : ''; }
export function addDays(date: string, n: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return localDate(d); }
export function daysBetween(a: string, b: string) { return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000); }
export const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
export const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const uid = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const initials = (name: string) => name.split(' ').slice(-2).map(x => x[0]).join('');
export function loanStatus(loan: Loan, date = today()): 'returned' | 'overdue' | 'active' { return loan.items.every(i => i.returnedAt) ? 'returned' : loan.dueAt < date ? 'overdue' : 'active'; }
export function availableCopies(data: LibraryData, bookId: string, ignoreRequestId?: string, date = today()) { const busy = new Set(data.loans.filter(l => !l.cancelledAt).flatMap(l => l.items.filter(i => !i.returnedAt).map(i => i.copyId))); for (const r of data.requests ?? []) if (r.id !== ignoreRequestId && ['pending', 'ready'].includes(r.status) && r.expiresAt >= date) r.copyIds.forEach(id => busy.add(id)); return data.books.find(b => b.id === bookId)?.copies.filter(c => c.condition === 'ready' && !busy.has(c.id)) ?? []; }
export function activeCount(data: LibraryData, readerId: string) { return data.loans.filter(l => l.readerId === readerId).reduce((sum, l) => sum + l.items.filter(i => !i.returnedAt).length, 0); }
export function copyCommitment(data: LibraryData, copyId: string, date = today()): 'loan' | 'hold' | null {
  if (data.loans.some(l => !l.cancelledAt && l.items.some(i => i.copyId === copyId && !i.returnedAt))) return 'loan';
  if ((data.requests ?? []).some(r => ['pending', 'ready'].includes(r.status) && r.expiresAt >= date && r.copyIds.includes(copyId))) return 'hold';
  return null;
}
export function changeCopyCondition(source: LibraryData, copyId: string, condition: Copy['condition'], date = today()) {
  if (!['ready', 'repair', 'lost'].includes(condition)) throw new Error('Tình trạng bản sao không hợp lệ.');
  if (copyCommitment(source, copyId, date)) throw new Error('Bản sao đang mượn hoặc đang được giữ. Hãy xử lý phiếu trước khi thay đổi tình trạng.');
  if (!source.books.some(b => b.copies.some(c => c.id === copyId))) throw new Error('Không tìm thấy bản sao.');
  return { ...source, books: source.books.map(b => ({ ...b, copies: b.copies.map(c => c.id === copyId ? { ...c, condition } : c) })) };
}
export function reservedCount(data: LibraryData, readerId: string, ignoreRequestId?: string, date = today()) { return (data.requests ?? []).filter(r => r.readerId === readerId && r.id !== ignoreRequestId && ['pending', 'ready'].includes(r.status) && r.expiresAt >= date).reduce((n, r) => n + r.copyIds.length, 0); }
function activity(data: LibraryData, text: string, kind: Activity['kind']) { data.activities.unshift({ id: uid('AC'), text, kind, at: new Date().toISOString() }); data.activities = data.activities.slice(0, 100); }

export function createLoan(source: LibraryData, readerId: string, bookIds: string[], dueAt: string, note = '', date = today()) {
  const data = structuredClone(source);
  const reader = data.readers.find(r => r.id === readerId);
  if (!reader || !reader.active || reader.expiresAt < date) throw new Error('Thẻ độc giả chưa hoạt động hoặc đã hết hạn.');
  if (!bookIds.length || new Set(bookIds).size !== bookIds.length) throw new Error('Chọn ít nhất một đầu sách, mỗi đầu sách một bản.');
  if (dueAt <= date) throw new Error('Hạn trả phải sau ngày mượn.');
  if (activeCount(data, readerId) + reservedCount(data, readerId, undefined, date) + bookIds.length > data.settings.maxBooks) throw new Error(`Mỗi độc giả chỉ được mượn và giữ tối đa ${data.settings.maxBooks} cuốn cùng lúc.`);
  if (data.loans.some(l => l.readerId === readerId && loanStatus(l, date) === 'overdue')) throw new Error('Độc giả cần trả sách quá hạn trước khi mượn tiếp.');
  if (data.fines.some(f => f.readerId === readerId && !f.paid)) throw new Error('Độc giả cần thanh toán tiền phạt trước khi mượn tiếp.');
  const items = bookIds.map(bookId => { const copy = availableCopies(data, bookId, undefined, date)[0]; if (!copy) throw new Error('Một đầu sách đã hết bản có thể mượn.'); return { bookId, copyId: copy.id, returnedAt: null }; });
  const loan: Loan = { id: uid('PM-'), readerId, borrowedAt: date, dueAt, renewals: 0, items, note };
  data.loans.unshift(loan);
  activity(data, `${reader.name} mượn ${items.length} cuốn sách`, 'loan');
  return { data, loan };
}

export function returnBooks(source: LibraryData, loanId: string, copyIds: string[], damaged = false, date = today()) {
  const data = structuredClone(source);
  const loan = data.loans.find(l => l.id === loanId);
  if (!loan || !copyIds.length) throw new Error('Chọn sách cần trả.');
  if (new Set(copyIds).size !== copyIds.length || copyIds.some(id => !loan.items.some(i => i.copyId === id && !i.returnedAt))) throw new Error('Sách đã được trả hoặc không thuộc phiếu này.');
  for (const item of loan.items.filter(i => copyIds.includes(i.copyId))) {
    item.returnedAt = date;
    const copy = data.books.find(b => b.id === item.bookId)?.copies.find(c => c.id === item.copyId);
    if (damaged && copy) copy.condition = 'repair';
  }
  const amount = Math.max(0, daysBetween(loan.dueAt, date)) * copyIds.length * data.settings.finePerDay;
  if (amount > 0) data.fines.unshift({ id: uid('PH-'), readerId: loan.readerId, loanId, amount, paid: false, createdAt: date, reason: `Trả trễ ${daysBetween(loan.dueAt, date)} ngày · ${copyIds.length} cuốn` });
  activity(data, `${data.readers.find(r => r.id === loan.readerId)?.name} trả ${copyIds.length} cuốn sách`, 'return');
  return { data, amount };
}

export function renewLoan(source: LibraryData, loanId: string, date = today()) {
  const data = structuredClone(source);
  const loan = data.loans.find(l => l.id === loanId);
  if (!loan || loanStatus(loan, date) !== 'active') throw new Error('Chỉ gia hạn phiếu đang mượn và chưa quá hạn.');
  const reader = data.readers.find(r => r.id === loan.readerId);
  if (!reader?.active || reader.expiresAt < date) throw new Error('Thẻ đã khóa hoặc hết hạn. Liên hệ quầy để gia hạn thẻ trước.');
  if (data.fines.some(f => f.readerId === loan.readerId && !f.paid)) throw new Error('Thanh toán khoản phạt trước khi gia hạn sách.');
  if (loan.renewals >= data.settings.maxRenewals) throw new Error('Phiếu đã đạt số lần gia hạn tối đa.');
  loan.dueAt = addDays(loan.dueAt, data.settings.renewalDays); loan.renewals++;
  activity(data, `Gia hạn phiếu ${loan.id} đến ${dateLabel(loan.dueAt)}`, 'loan');
  return data;
}

export function deleteBook(source: LibraryData, bookId: string, date = today()) {
  const book = source.books.find(b => b.id === bookId);
  const copies = new Set(book?.copies.map(c => c.id));
  if ((source.requests ?? []).some(r => ['pending', 'ready'].includes(r.status) && r.expiresAt >= date && r.copyIds.some(id => copies.has(id)))) throw new Error('Sách đang được giữ cho độc giả. Hãy xử lý yêu cầu trước khi xóa.');
  if (source.loans.some(l => l.items.some(i => i.bookId === bookId))) throw new Error('Đầu sách đã có lịch sử mượn. Hãy giữ lại để bảo toàn dữ liệu.');
  const data = structuredClone(source); data.books = data.books.filter(b => b.id !== bookId); return data;
}
export function payFine(source: LibraryData, fineId: string, payment: { method: 'cash' | 'transfer'; operator: string; reference?: string } = { method: 'cash', operator: 'Quản trị viên' }, paidAt = new Date().toISOString()) {
  const data = structuredClone(source), fine = data.fines.find(f => f.id === fineId);
  if (!fine) throw new Error('Không tìm thấy khoản phạt.');
  if (fine.paid) throw new Error('Khoản phạt đã được thanh toán. Không ghi nhận hai lần.');
  if (!['cash', 'transfer'].includes(payment.method) || !payment.operator.trim()) throw new Error('Chọn phương thức và người thu hợp lệ.');
  if (payment.method === 'transfer' && (payment.reference?.trim().length ?? 0) < 3) throw new Error('Nhập mã tham chiếu chuyển khoản để đối soát.');
  if (!Number.isFinite(Date.parse(paidAt))) throw new Error('Thời điểm thanh toán không hợp lệ.');
  Object.assign(fine, { paid: true, paidAt, paymentMethod: payment.method, paymentReference: payment.reference?.trim() ?? '', collectedBy: payment.operator.trim(), receiptId: uid('PT-') });
  activity(data, `Thu ${money(fine.amount)} từ ${data.readers.find(r => r.id === fine.readerId)?.name} · ${fine.receiptId}`, 'fine');
  return data;
}
export function totalLateEstimate(data: LibraryData, loan: Loan) { return Math.max(0, daysBetween(loan.dueAt, today())) * loan.items.filter(i => !i.returnedAt).length * data.settings.finePerDay; }
