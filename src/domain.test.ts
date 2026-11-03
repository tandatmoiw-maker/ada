import test from 'node:test';
import assert from 'node:assert/strict';
import { availableCopies, copyCommitment, changeCopyCondition, payFine, createLoan, returnBooks, renewLoan, loanStatus, deleteBook } from './domain.ts';
import type { LibraryData } from './domain.ts';
import { createCounterLoan, createRequest, updateRequest } from './circulation.ts';
import { matchingRequests, requestStatusLabel } from './requestQueries.ts';

const date = '2026-11-01';
test('tìm yêu cầu theo tên sách hoặc mã bản sao, hiển thị hạn giữ đã hết', () => {
  const held = createRequest(fixture(), 'R1', ['B1'], '', date);
  assert.equal(matchingRequests(held.data, 'sach a').length, 1);
  assert.equal(matchingRequests(held.data, held.request.copyIds[0]).length, 1);
  assert.equal(matchingRequests(held.data, 'không có').length, 0);
  assert.equal(requestStatusLabel(held.request, '2026-11-05'), 'Hết hạn nhận');
});
function fixture(): LibraryData { return { version: 1, books: [{ id: 'B1', code: 'S-1', title: 'Sách A', author: 'Tác giả', isbn: '9786040000001', category: 'Văn học', publisher: '', year: 2026, color: '#fff', addedAt: date, copies: [{ id: 'C1', condition: 'ready' }, { id: 'C2', condition: 'ready' }, { id: 'C3', condition: 'repair' }] }, { id: 'B2', code: 'S-2', title: 'Sách B', author: 'Tác giả', isbn: '9786040000002', category: 'Văn học', publisher: '', year: 2026, color: '#fff', addedAt: date, copies: [{ id: 'C4', condition: 'ready' }] }], readers: [{ id: 'R1', name: 'An', email: 'an@example.com', phone: '0900000000', group: 'Sinh viên', joinedAt: date, expiresAt: '2027-01-01', active: true, color: '#fff' }], loans: [], fines: [], activities: [], settings: { name: 'Thư viện', email: 'a@example.com', address: '', maxBooks: 3, loanDays: 14, finePerDay: 2000, maxRenewals: 1, renewalDays: 7 } }; }

test('mượn giữ đúng bản sao khả dụng, không thay đổi dữ liệu nguồn', () => { const original = fixture(); const { data, loan } = createLoan(original, 'R1', ['B1'], '2026-11-15', '', date); assert.equal(loan.items[0].copyId, 'C1'); assert.equal(availableCopies(data, 'B1').length, 1); assert.equal(availableCopies(original, 'B1').length, 2); const second = createLoan(data, 'R1', ['B1'], '2026-11-15', '', date); assert.equal(second.loan.items[0].copyId, 'C2'); assert.throws(() => createLoan(second.data, 'R1', ['B1'], '2026-11-15', '', date), /hết bản/); });
test('trả từng phần giữ phiếu đang mượn và chỉ tăng tồn sách đã trả', () => { const created = createLoan(fixture(), 'R1', ['B1', 'B2'], '2026-11-15', '', date); const result = returnBooks(created.data, created.loan.id, ['C1'], false, '2026-11-05'); assert.equal(loanStatus(result.data.loans[0], '2026-11-05'), 'active'); assert.equal(availableCopies(result.data, 'B1').length, 2); assert.equal(availableCopies(result.data, 'B2').length, 0); assert.equal(result.amount, 0); });
test('trả trễ từng phần tính phạt riêng, từ hạn trả gốc, không thu trùng', () => { const created = createLoan(fixture(), 'R1', ['B1', 'B2'], '2026-11-03', '', date); const first = returnBooks(created.data, created.loan.id, ['C1'], false, '2026-11-05'); assert.equal(first.amount, 4000); const second = returnBooks(first.data, created.loan.id, ['C4'], false, '2026-11-06'); assert.equal(second.amount, 6000); assert.equal(second.data.fines.reduce((n, f) => n + f.amount, 0), 10000); assert.equal(loanStatus(second.data.loans[0], '2026-11-06'), 'returned'); assert.throws(() => returnBooks(second.data, created.loan.id, ['C1'], false, '2026-11-06'), /đã được trả/); });
test('bản trả hỏng được chuyển sang bảo trì và không thể mượn', () => { const created = createLoan(fixture(), 'R1', ['B2'], '2026-11-15', '', date); const result = returnBooks(created.data, created.loan.id, ['C4'], true, '2026-11-02'); assert.equal(availableCopies(result.data, 'B2').length, 0); assert.equal(result.data.books[1].copies[0].condition, 'repair'); });
test('không cho mượn khi thẻ hết hạn, có tiền phạt hoặc vượt giới hạn', () => { const expired = fixture(); expired.readers[0].expiresAt = '2026-10-31'; assert.throws(() => createLoan(expired, 'R1', ['B1'], '2026-11-15', '', date), /hết hạn/); const debt = fixture(); debt.fines.push({ id: 'F1', loanId: 'L1', readerId: 'R1', amount: 2000, paid: false, createdAt: date, reason: '' }); assert.throws(() => createLoan(debt, 'R1', ['B1'], '2026-11-15', '', date), /thanh toán/); const limit = fixture(); limit.settings.maxBooks = 1; assert.throws(() => createLoan(limit, 'R1', ['B1', 'B2'], '2026-11-15', '', date), /tối đa/); });
test('gia hạn đúng số ngày, chặn quá số lần và phiếu quá hạn', () => { const created = createLoan(fixture(), 'R1', ['B1'], '2026-11-03', '', date); const data = renewLoan(created.data, created.loan.id, date); assert.equal(data.loans[0].dueAt, '2026-11-10'); assert.throws(() => renewLoan(data, created.loan.id, date), /tối đa/); assert.throws(() => renewLoan(created.data, created.loan.id, '2026-11-04'), /chưa quá hạn/); });
test('chặn mượn khi còn phiếu quá hạn và bảo toàn đầu sách có lịch sử', () => { const created = createLoan(fixture(), 'R1', ['B1'], '2026-11-03', '', date); assert.throws(() => createLoan(created.data, 'R1', ['B2'], '2026-11-20', '', '2026-11-04'), /quá hạn/); assert.throws(() => deleteBook(created.data, 'B1'), /lịch sử/); assert.equal(deleteBook(fixture(), 'B2').books.length, 1); });
test('chặn ngày trả không hợp lệ và chọn trùng đầu sách', () => { assert.throws(() => createLoan(fixture(), 'R1', ['B1'], date, '', date), /sau ngày mượn/); assert.throws(() => createLoan(fixture(), 'R1', ['B1', 'B1'], '2026-11-15', '', date), /mỗi đầu sách/); });

test('người đến quầy chưa có tài khoản được lập hồ sơ và phiếu trong một lần lưu', () => {
  const original = fixture(); const result = createCounterLoan(original, { walkIn: { name: 'Nguyễn Khách Mới', phone: '0912345678' }, copyIds: ['C1', 'C2'], dueAt: '2026-11-15' }, date);
  assert.equal(result.reader.email, ''); assert.equal(result.loan.channel, 'counter'); assert.equal(result.loan.items.length, 2); assert.equal(result.data.readers.length, 2); assert.equal(original.readers.length, 1); assert.equal(availableCopies(result.data, 'B1').length, 0);
});
test('không tạo hồ sơ rác khi phiếu tại quầy không hợp lệ', () => {
  const original = fixture(); assert.throws(() => createCounterLoan(original, { walkIn: { name: 'Khách mới', phone: '0912345678' }, copyIds: ['C3'], dueAt: '2026-11-15' }, date), /không còn khả dụng/); assert.equal(original.readers.length, 1); assert.equal(original.loans.length, 0);
  assert.throws(() => createCounterLoan(original, { walkIn: { name: 'Khách', phone: '0900000000' }, copyIds: ['C1'], dueAt: '2026-11-15' }, date), /đã có hồ sơ/);
});
test('giữ sách online giữ đúng bản, ngăn lập phiếu thường và giải phóng khi hủy', () => {
  const result = createRequest(fixture(), 'R1', ['B1'], '', date); assert.equal(availableCopies(result.data, 'B1', undefined, date).length, 1);
  assert.throws(() => createCounterLoan(result.data, { readerId: 'R1', copyIds: ['C1'], dueAt: '2026-11-15' }, date), /không còn khả dụng/);
  const cancelled = updateRequest(result.data, result.request.id, 'cancelled', '', 'R1', date); assert.equal(availableCopies(cancelled, 'B1', undefined, date).length, 2);
});
test('bàn giao yêu cầu dùng đúng bản đang giữ và chỉ tạo một phiếu', () => {
  const result = createRequest(fixture(), 'R1', ['B1'], '', date); const ready = updateRequest(result.data, result.request.id, 'ready', '', undefined, date);
  const handed = createCounterLoan(ready, { readerId: 'R1', copyIds: result.request.copyIds, dueAt: '2026-11-15', requestId: result.request.id }, date);
  assert.equal(handed.data.requests![0].status, 'fulfilled'); assert.equal(handed.data.requests![0].loanId, handed.loan.id); assert.equal(handed.loan.channel, 'reservation'); assert.equal(availableCopies(handed.data, 'B1').length, 1);
  assert.throws(() => createCounterLoan(handed.data, { readerId: 'R1', copyIds: result.request.copyIds, dueAt: '2026-11-15', requestId: result.request.id }, date), /hết hiệu lực/);
});
test('độc giả không thể hủy yêu cầu của người khác, tổng giữ và mượn không vượt giới hạn', () => {
  const source = fixture(); source.settings.maxBooks = 1; const result = createRequest(source, 'R1', ['B1'], '', date);
  assert.throws(() => updateRequest(result.data, result.request.id, 'cancelled', '', 'R2', date), /độc giả khác/);
  assert.throws(() => createRequest(result.data, 'R1', ['B2'], '', date), /không vượt quá/);
});

test('mượn tại quầy tính cả sách đang giữ, bàn giao đúng yêu cầu không bị tính trùng', () => {
  const source = fixture(); source.settings.maxBooks = 1; const result = createRequest(source, 'R1', ['B1'], '', date);
  assert.throws(() => createCounterLoan(result.data, { readerId: 'R1', copyIds: ['C4'], dueAt: '2026-11-15' }, date), /đang mượn và giữ/);
  const handover = createCounterLoan(result.data, { readerId: 'R1', copyIds: result.request.copyIds, requestId: result.request.id, dueAt: '2026-11-15' }, date);
  assert.equal(handover.loan.items.length, 1);
});

test('bảo vệ bản sao đang giữ và đầu sách khỏi thay đổi phá vỡ bàn giao', () => {
  const held = createRequest(fixture(), 'R1', ['B1'], '', date);
  const copyId = held.request.copyIds[0];
  assert.equal(copyCommitment(held.data, copyId, date), 'hold');
  assert.throws(() => changeCopyCondition(held.data, copyId, 'repair', date), /đang được giữ/);
  assert.throws(() => deleteBook(held.data, 'B1', date), /đang được giữ/);
  const released = updateRequest(held.data, held.request.id, 'cancelled', '', 'R1', date);
  const changed = changeCopyCondition(released, copyId, 'lost', date);
  assert.equal(changed.books[0].copies.find(c => c.id === copyId)?.condition, 'lost');
  assert.equal(deleteBook(released, 'B1').books.length, 1);
  const loan = createLoan(fixture(), 'R1', ['B2'], '2026-11-15', '', date);
  assert.throws(() => changeCopyCondition(loan.data, 'C4', 'repair', date), /đang mượn/);
});

test('thu phạt lưu giao dịch để đối soát, không ghi nhận hai lần', () => {
  const source = fixture(); source.fines = [{ id: 'F1', readerId: 'R1', loanId: 'L1', amount: 12000, paid: false, createdAt: '2026-10-01', reason: 'Trả trễ' }];
  assert.throws(() => payFine(source, 'F1', { method: 'transfer', operator: 'Linh' }), /tham chiếu/);
  const result = payFine(source, 'F1', { method: 'transfer', operator: 'Linh', reference: 'BANK-001' }, '2026-11-01T08:00:00Z');
  assert.equal(result.fines[0].paidAt, '2026-11-01T08:00:00Z');
  assert.equal(result.fines[0].paymentReference, 'BANK-001');
  assert.equal(result.fines[0].collectedBy, 'Linh');
  assert.match(result.fines[0].receiptId!, /^PT-/);
  assert.equal(source.fines[0].paid, false);
  assert.throws(() => payFine(result, 'F1'), /hai lần/);
});
test('không gia hạn khi thẻ bị khóa hoặc độc giả còn nợ', () => {
  const source = createLoan(fixture(), 'R1', ['B2'], '2026-11-15', '', date).data;
  source.readers[0].active = false;
  assert.throws(() => renewLoan(source, source.loans[0].id, date), /Thẻ đã khóa/);
  source.readers[0].active = true;
  source.fines.push({ id: 'F1', readerId: 'R1', loanId: 'L1', amount: 2000, paid: false, createdAt: date, reason: 'Trả trễ' });
  assert.throws(() => renewLoan(source, source.loans[0].id, date), /khoản phạt/);
});
