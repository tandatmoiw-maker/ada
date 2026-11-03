import { addDays, today } from './domain';
import type { Book, LibraryData, Loan, Reader } from './domain';

export function seedData(): LibraryData {
  const date = today();
  const titles = [
    ['Nhà giả kim', 'Paulo Coelho', 'Văn học', '#f0c851', 'NXB Văn học'],
    ['Đắc nhân tâm', 'Dale Carnegie', 'Kỹ năng sống', '#a43d2f', 'NXB Tổng hợp'],
    ['Rừng Na Uy', 'Haruki Murakami', 'Văn học', '#264b3e', 'NXB Hội Nhà văn'],
    ['Sapiens: Lược sử loài người', 'Yuval Noah Harari', 'Lịch sử', '#d9c6ae', 'NXB Tri thức'],
    ['Tư duy nhanh và chậm', 'Daniel Kahneman', 'Tâm lý học', '#e8e4db', 'NXB Thế giới'],
    ['Dế Mèn phiêu lưu ký', 'Tô Hoài', 'Thiếu nhi', '#3b796f', 'NXB Kim Đồng'],
    ['Atomic Habits', 'James Clear', 'Kỹ năng sống', '#d6c6b2', 'NXB Thế giới'],
    ['Hoàng tử bé', 'Antoine de Saint-Exupéry', 'Văn học', '#91b5c6', 'NXB Hội Nhà văn'],
    ['Lược sử thời gian', 'Stephen Hawking', 'Khoa học', '#273f65', 'NXB Trẻ'],
    ['Tuổi trẻ đáng giá bao nhiêu?', 'Rosie Nguyễn', 'Kỹ năng sống', '#d2a14a', 'NXB Hội Nhà văn'],
    ['Cây cam ngọt của tôi', 'José Mauro de Vasconcelos', 'Văn học', '#88a78b', 'NXB Hội Nhà văn'],
    ['Tâm lý học về tiền', 'Morgan Housel', 'Kinh tế', '#496557', 'NXB Thế giới'],
    ['Đi tìm lẽ sống', 'Viktor E. Frankl', 'Tâm lý học', '#8c9bae', 'NXB Tổng hợp'],
    ['Bố già', 'Mario Puzo', 'Văn học', '#342f35', 'NXB Văn học'],
    ['Vũ trụ trong vỏ hạt dẻ', 'Stephen Hawking', 'Khoa học', '#506b93', 'NXB Trẻ'],
    ['Chiến tranh tiền tệ', 'Song Hongbing', 'Kinh tế', '#9e443d', 'NXB Lao động'],
    ['Việt Nam sử lược', 'Trần Trọng Kim', 'Lịch sử', '#b19368', 'NXB Văn học'],
    ['Tôi thấy hoa vàng trên cỏ xanh', 'Nguyễn Nhật Ánh', 'Văn học', '#d9b94e', 'NXB Trẻ'],
  ];
  const books: Book[] = titles.map(([title, author, category, color, publisher], i) => ({ id: `B${i + 1}`, code: `S-${String(i + 1).padStart(4, '0')}`, title, author, category, color, publisher, isbn: `978604${String(1000000 + i * 137).padStart(7, '0')}`, year: 2020 + i % 6, addedAt: addDays(date, -90 + i * 4), copies: Array.from({ length: 5 + i % 7 }, (_, j) => ({ id: `S${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`, condition: j === 8 && i % 2 === 0 ? 'repair' : 'ready' })) }));
  const names = ['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Phương Linh', 'Phạm Đức Huy', 'Hoàng Thu Hà', 'Vũ Quang Minh', 'Đặng Ngọc Mai', 'Bùi Gia Bảo', 'Đỗ Khánh Vy', 'Ngô Tuấn Kiệt', 'Dương Thanh Trúc', 'Lý Hải Đăng', 'Nguyễn Bảo Ngọc', 'Trần Anh Khoa', 'Lê Minh Châu', 'Phan Nhật Hạ'];
  const readers: Reader[] = names.map((name, i) => ({ id: `DG-${String(i + 1).padStart(4, '0')}`, name, email: `docgia${i + 1}@example.com`, phone: `09${String(12340000 + i * 1387)}`, group: i % 4 === 0 ? 'Giảng viên' : 'Sinh viên', joinedAt: addDays(date, -100 + i * 4), expiresAt: addDays(date, i === 15 ? -5 : 365), active: i !== 14, color: ['#e9e3f3', '#dcebe6', '#f4e6d9', '#e0e9f4'][i % 4] }));
  const loans: Loan[] = [];
  const busy = new Set<string>();
  for (let i = 0; i < 44; i++) {
    const returned = i >= 12;
    const borrowedAt = addDays(date, i < 5 ? -i : -((i * 3) % 29 + 1));
    const dueAt = addDays(borrowedAt, 14);
    const items = [i % books.length, (i + 7) % books.length].map(bi => {
      const copy = books[bi].copies.find(c => c.condition === 'ready' && !busy.has(c.id))!;
      if (!returned) busy.add(copy.id);
      return { bookId: books[bi].id, copyId: copy.id, returnedAt: returned ? addDays(borrowedAt, Math.min(10, Math.max(1, -Math.round((Date.parse(borrowedAt) - Date.parse(date)) / 86400000)))) : null };
    });
    loans.push({ id: `PM-${String(1044 - i).padStart(5, '0')}`, readerId: readers[i % 14].id, borrowedAt, dueAt, renewals: 0, items, note: '' });
  }
  for (const entry of [{ index: 16, late: 5, offset: -2 }, { index: 19, late: 3, offset: -3 }, { index: 22, late: 2, offset: -7 }]) {
    const returnedAt = addDays(date, entry.offset);
    loans[entry.index].dueAt = addDays(returnedAt, -entry.late);
    loans[entry.index].borrowedAt = addDays(loans[entry.index].dueAt, -14);
    loans[entry.index].items.forEach(item => { item.returnedAt = returnedAt; });
  }
  return { version: 1, books, readers, loans, fines: [
    { id: 'PH-0003', readerId: readers[2].id, loanId: loans[16].id, amount: 20000, paid: false, createdAt: addDays(date, -2), reason: 'Trả trễ 5 ngày · 2 cuốn' },
    { id: 'PH-0002', readerId: readers[5].id, loanId: loans[19].id, amount: 12000, paid: false, createdAt: addDays(date, -3), reason: 'Trả trễ 3 ngày · 2 cuốn' },
    { id: 'PH-0001', readerId: readers[8].id, loanId: loans[22].id, amount: 8000, paid: true, createdAt: addDays(date, -7), reason: 'Trả trễ 2 ngày · 2 cuốn' },
  ], activities: [
    { id: 'A1', text: 'Nguyễn Minh Anh mượn 2 cuốn sách', kind: 'loan', at: new Date().toISOString() },
    { id: 'A2', text: 'Đỗ Khánh Vy trả 2 cuốn sách', kind: 'return', at: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'A3', text: 'Đã bổ sung đầu sách Tôi thấy hoa vàng trên cỏ xanh', kind: 'book', at: new Date(Date.now() - 55 * 60000).toISOString() },
  ], settings: { name: 'Thư viện Trung tâm', email: 'thuvien@example.com', address: '268 Lý Thường Kiệt, TP. Hồ Chí Minh', loanDays: 14, maxBooks: 5, finePerDay: 2000, maxRenewals: 2, renewalDays: 7 } };
}
