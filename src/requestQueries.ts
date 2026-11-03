import type { LibraryData, LoanRequest } from './domain.ts';
import { normalize, today } from './domain.ts';
export function requestStatusLabel(request: LoanRequest, date = today()) {
  if (['pending', 'ready'].includes(request.status) && request.expiresAt < date) return 'Hết hạn nhận';
  return { pending: 'Chờ thư viện chuẩn bị', ready: 'Sẵn sàng nhận', fulfilled: 'Đã nhận sách', cancelled: 'Đã hủy', declined: 'Thư viện từ chối' }[request.status];
}
export function matchingRequests(data: LibraryData, search: string) {
  const query = normalize(search);
  return (data.requests ?? []).filter(r => normalize(`${r.id} ${r.readerId} ${data.readers.find(x => x.id === r.readerId)?.name ?? ''} ${r.copyIds.join(' ')} ${r.copyIds.map(id => data.books.find(b => b.copies.some(c => c.id === id))?.title ?? '').join(' ')}`).includes(query));
}
