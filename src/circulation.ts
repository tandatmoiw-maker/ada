import { activeCount, addDays, availableCopies, loanStatus, normalize, reservedCount, today, uid } from './domain.ts';
import type { LibraryData, Loan, LoanRequest, Reader } from './domain.ts';

export type WalkIn = { name: string; phone: string; email?: string; group?: string };
export function borrowerIssue(data: LibraryData, reader: Reader | undefined, date = today()) {
  if (!reader || !reader.active) return 'Thẻ độc giả đã khóa hoặc không tồn tại.';
  if (reader.expiresAt < date) return 'Thẻ độc giả đã hết hạn. Gia hạn thẻ trước khi mượn.';
  if (data.loans.some(l => l.readerId === reader.id && !l.cancelledAt && loanStatus(l, date) === 'overdue')) return 'Độc giả còn sách quá hạn cần hoàn trả.';
  if (data.fines.some(f => f.readerId === reader.id && !f.paid)) return 'Độc giả còn khoản phạt chưa thanh toán.';
  return '';
}
export function makeWalkInReader(data: LibraryData, input: WalkIn, date = today()): Reader {
  const phone = input.phone.replace(/[\s()-]/g, '');
  if (input.name.trim().length < 2) throw new Error('Nhập đầy đủ họ tên người mượn.');
  if (!/^\+?[0-9]{9,13}$/.test(phone)) throw new Error('Số điện thoại cần có 9–13 chữ số.');
  if (data.readers.some(r => r.phone.replace(/[\s()-]/g, '') === phone)) throw new Error('Số điện thoại đã có hồ sơ. Chuyển sang “Đã có thẻ” để chọn đúng người mượn.');
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Email chưa đúng định dạng.');
  if (input.email && data.readers.some(r => r.email && r.email.toLowerCase() === input.email!.trim().toLowerCase())) throw new Error('Email đã được dùng cho một độc giả khác.');
  const number = Math.max(0, ...data.readers.map(r => Number(r.id.replace('DG-', '')) || 0)) + 1;
  return { id: `DG-${String(number).padStart(4, '0')}`, name: input.name.trim(), phone, email: input.email?.trim() ?? '', group: input.group ?? 'Khách tại quầy', joinedAt: date, expiresAt: addDays(date, 365), active: true, color: '#e1e9f0' };
}
export type CounterInput = { readerId?: string; walkIn?: WalkIn; copyIds: string[]; dueAt: string; note?: string; operator?: string; requestId?: string };
export function createCounterLoan(source: LibraryData, input: CounterInput, date = today()) {
  const data = structuredClone(source);
  const request = input.requestId ? (data.requests ?? []).find(r => r.id === input.requestId) : undefined;
  if (input.requestId && (!request || !['pending', 'ready'].includes(request.status) || request.expiresAt < date)) throw new Error('Yêu cầu giữ sách đã hết hiệu lực.');
  const reader = input.walkIn ? makeWalkInReader(data, input.walkIn, date) : data.readers.find(r => r.id === input.readerId);
  const issue = borrowerIssue(data, reader, date); if (issue) throw new Error(issue);
  if (!reader) throw new Error('Chọn người mượn.');
  if (!input.copyIds.length || new Set(input.copyIds).size !== input.copyIds.length) throw new Error('Chọn các bản sách khác nhau để lập phiếu.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt) || !Number.isFinite(Date.parse(input.dueAt)) || input.dueAt <= date) throw new Error('Hạn trả phải sau ngày mượn.');
  if (activeCount(data, reader.id) + reservedCount(data, reader.id, input.requestId, date) + input.copyIds.length > data.settings.maxBooks) throw new Error(`Vượt giới hạn ${data.settings.maxBooks} cuốn đang mượn và giữ cho một độc giả.`);
  if (request && (request.readerId !== reader.id || request.copyIds.length !== input.copyIds.length || request.copyIds.some(id => !input.copyIds.includes(id)))) throw new Error('Người nhận hoặc sách không khớp yêu cầu giữ sách.');
  const items = input.copyIds.map(copyId => {
    const book = data.books.find(b => b.copies.some(c => c.id === copyId));
    if (!book || !availableCopies(data, book.id, input.requestId, date).some(c => c.id === copyId)) throw new Error(`Bản ${copyId} không còn khả dụng. Kiểm tra lại danh sách sách.`);
    return { bookId: book.id, copyId, returnedAt: null };
  });
  if (input.walkIn) data.readers.unshift(reader);
  const loan: Loan = { id: uid('PM-'), readerId: reader.id, borrowedAt: date, dueAt: input.dueAt, renewals: 0, items, note: input.note?.trim() ?? '', channel: request ? 'reservation' : 'counter', operator: input.operator ?? 'Linh Hoàng' };
  data.loans.unshift(loan);
  if (request) { request.status = 'fulfilled'; request.loanId = loan.id; }
  data.activities.unshift({ id: uid('AC'), text: `Lập phiếu tại quầy: ${reader.name} mượn ${items.length} cuốn`, at: new Date().toISOString(), kind: 'loan' });
  return { data, loan, reader };
}
export function createRequest(source: LibraryData, readerId: string, bookIds: string[], note = '', date = today()) {
  const data = structuredClone(source); const reader = data.readers.find(r => r.id === readerId);
  const issue = borrowerIssue(data, reader, date); if (issue) throw new Error(issue);
  if (!bookIds.length || new Set(bookIds).size !== bookIds.length) throw new Error('Chọn ít nhất một đầu sách, mỗi đầu sách một cuốn.');
  const existing = (data.requests ?? []).filter(r => r.readerId === readerId && ['pending', 'ready'].includes(r.status) && r.expiresAt >= date);
  if (activeCount(data, readerId) + existing.reduce((n, r) => n + r.copyIds.length, 0) + bookIds.length > data.settings.maxBooks) throw new Error(`Tổng sách đang mượn và đang giữ không vượt quá ${data.settings.maxBooks} cuốn.`);
  const copyIds = bookIds.map(id => { const c = availableCopies(data, id, undefined, date)[0]; if (!c) throw new Error('Một đầu sách vừa hết bản sẵn có. Hãy chọn sách khác.'); return c.id; });
  const request: LoanRequest = { id: uid('YC-'), readerId, copyIds, createdAt: date, expiresAt: addDays(date, 2), status: 'pending', note: note.trim() };
  data.requests = [request, ...(data.requests ?? [])];
  return { data, request };
}
export function updateRequest(source: LibraryData, id: string, status: 'ready' | 'cancelled' | 'declined', reason = '', readerId?: string, date = today()) {
  const data = structuredClone(source), request = data.requests?.find(r => r.id === id);
  if (!request || !['pending', 'ready'].includes(request.status)) throw new Error('Yêu cầu đã được xử lý.');
  if (readerId && request.readerId !== readerId) throw new Error('Không thể thay đổi yêu cầu của độc giả khác.');
  if (status === 'ready' && request.expiresAt < date) throw new Error('Yêu cầu đã hết hạn.');
  request.status = status; request.reason = reason.trim(); return data;
}
export function searchBook(data: LibraryData, query: string) { const q = normalize(query.trim()); return data.books.filter(b => normalize(`${b.title} ${b.author} ${b.code} ${b.isbn} ${b.copies.map(c => c.id).join(' ')}`).includes(q)); }
