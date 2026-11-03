import { matchingRequests, requestStatusLabel } from './requestQueries';
import type { LibraryData, Loan } from './domain.ts';
import { addDays, paymentDay, availableCopies, loanStatus, today } from './domain.ts';
import type { Workbook, Worksheet, CellValue } from 'exceljs';

type Column = { label: string; width: number; format?: string };
type SheetSpec = { name: string; title: string; subtitle: string; columns: Column[]; rows: CellValue[][] };
const dateValue = (date: string | null) => date ? new Date(`${date.slice(0, 10)}T12:00:00Z`) : null;
export const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const fileTitles: Record<string, string> = { 'danh-muc-sach': 'Danh mục sách', 'doc-gia': 'Danh sách độc giả', 'phieu-muon': 'Danh sách phiếu mượn', 'tien-phat': 'Theo dõi tiền phạt', 'yeu-cau-giu-sach': 'Yêu cầu giữ sách trực tuyến' };
function styleSheet(sheet: Worksheet, spec: SheetSpec, index: number) {
  sheet.properties.defaultRowHeight = 24;
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
  sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 } };
  sheet.columns = spec.columns.map(c => ({ width: c.width }));
  sheet.getCell('A2').value = spec.title;
  sheet.getCell('A2').font = { name: 'Arial', size: 17, bold: true, color: { argb: 'FF243C44' } };
  sheet.getRow(2).height = 30;
  sheet.getCell('A3').value = spec.subtitle;
  sheet.getCell('A3').font = { name: 'Arial', size: 10, color: { argb: 'FF7A8791' } };
  sheet.getRow(3).height = 23;
  if (spec.rows.length) sheet.addTable({ name: `FolioTable${index + 1}`, ref: 'A5', headerRow: true, totalsRow: false, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: spec.columns.map(c => ({ name: c.label, filterButton: true })), rows: spec.rows });
  else { sheet.getRow(5).values = spec.columns.map(c => c.label); sheet.getCell('A6').value = 'Không có dữ liệu trong phạm vi đã chọn.'; }
  sheet.getRow(5).height = 29;
  sheet.getRow(5).eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF29464D' } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; cell.border = { right: { style: 'thin', color: { argb: 'FFFFFFFF' } } }; });
  for (let row = 6; row <= spec.rows.length + 5; row++) {
    sheet.getRow(row).height = 27;
    sheet.getRow(row).eachCell({ includeEmpty: true }, (cell, col) => { cell.font = { name: 'Arial', size: 10, color: { argb: 'FF445562' } }; cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' }; const format = spec.columns[col - 1]?.format; if (format) cell.numFmt = format; else if (typeof cell.value === 'number') cell.numFmt = '#,##0'; });
  }
  sheet.headerFooter.oddFooter = '&LFolio Library&CTrang &P / &N';
  sheet.pageSetup.printTitlesRow = '5:5';
  sheet.pageSetup.printArea = `A1:${String.fromCharCode(64 + spec.columns.length)}${Math.max(7, spec.rows.length + 5)}`;
}
export async function buildWorkbook(specs: SheetSpec[]): Promise<Workbook> {
  const module = await import('exceljs'); const ExcelJS = module.default ?? module;
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Folio Library'; workbook.created = new Date();
  for (const [index, spec] of specs.entries()) styleSheet(workbook.addWorksheet(spec.name, { properties: { tabColor: { argb: index === 0 ? 'FF29464D' : 'FF9DAFAD' } } }), spec, index);
  return workbook;
}
export async function downloadExcel(workbook: Workbook, name: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer); const url = URL.createObjectURL(new Blob([bytes], { type: excelType }));
  const link = document.createElement('a'); link.href = url; link.download = `${name}.xlsx`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportExcel(name: string, rows: (string | number)[][]) {
  try {
    const [headers, ...body] = rows;
    const columns = headers.map(label => ({ label: String(label), width: /Tên sách|Đầu sách|Lý do|Sách$/.test(String(label)) ? 43 : /Email/.test(String(label)) ? 32 : /Họ tên|Độc giả|Tác giả/.test(String(label)) ? 28 : /ISBN/.test(String(label)) ? 23 : 20, format: /Ngày|Hạn/.test(String(label)) ? 'dd/mm/yyyy' : /Số tiền|phạt.*₫/.test(String(label)) ? '#,##0" ₫"' : undefined }));
    const values = body.map(row => row.map((value, index) => columns[index]?.format === 'dd/mm/yyyy' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dateValue(value) : value));
    await downloadExcel(await buildWorkbook([{ name: 'Dữ liệu', title: fileTitles[name] ?? `Phiếu ${name}`, subtitle: `Folio Library — xuất ngày ${new Date().toLocaleDateString('vi-VN')} — ${body.length} dòng dữ liệu`, columns, rows: values }]), `${name}-${today()}`);
    window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: 'Đã xuất file Excel .xlsx.' } }));
  } catch (e) { window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: `Chưa xuất được Excel: ${(e as Error).message}`, error: true } })); }
}
export async function exportLoan(data: LibraryData, loan: Loan) {
  try {
    const reader = data.readers.find(r => r.id === loan.readerId)!;
    const workbook = await buildWorkbook([{ name: 'Phiếu mượn', title: `Phiếu mượn ${loan.id}`, subtitle: `${reader.name} — thẻ ${reader.id} — ngày mượn ${loan.borrowedAt} — hạn trả ${loan.dueAt}`, columns: [{ label: 'Tên sách', width: 44 }, { label: 'Mã bản sao', width: 22 }, { label: 'Ngày mượn', width: 20, format: 'dd/mm/yyyy' }, { label: 'Hạn trả', width: 20, format: 'dd/mm/yyyy' }, { label: 'Ngày đã trả', width: 20, format: 'dd/mm/yyyy' }], rows: loan.items.map(i => [data.books.find(b => b.id === i.bookId)?.title ?? '', i.copyId, dateValue(loan.borrowedAt), dateValue(loan.dueAt), dateValue(i.returnedAt)]) }]);
    await downloadExcel(workbook, loan.id); window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: 'Đã xuất phiếu mượn Excel.' } }));
  } catch (e) { window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: (e as Error).message, error: true } })); }
}
export async function buildLibraryReport(data: LibraryData, from: string, to: string) {
  const within = (date: string) => date >= from && date <= to;
  const loans = data.loans.filter(l => !l.cancelledAt && within(l.borrowedAt));
  const returned = data.loans.flatMap(l => l.items.filter(i => i.returnedAt && within(i.returnedAt)).map(i => ({ loan: l, item: i })));
  const status = { active: 'Đang mượn', overdue: 'Quá hạn', returned: 'Đã trả' };
  const specs: SheetSpec[] = [
    { name: 'Tổng quan', title: 'Báo cáo hoạt động thư viện', subtitle: `${data.settings.name} — từ ${from.split('-').reverse().join('/')} đến ${to.split('-').reverse().join('/')}`, columns: [{ label: 'Chỉ số', width: 42 }, { label: 'Giá trị', width: 22 }, { label: 'Đơn vị', width: 18 }, { label: 'Phạm vi', width: 58 }], rows: [
      ['Phiếu mượn được lập', loans.length, 'phiếu', 'Theo ngày lập phiếu trong kỳ'], ['Sách được mượn', loans.reduce((n, l) => n + l.items.length, 0), 'cuốn', 'Theo ngày lập phiếu trong kỳ'], ['Sách hoàn trả', returned.length, 'cuốn', 'Theo ngày trả thực tế trong kỳ'], ['Độc giả có mượn', new Set(loans.map(l => l.readerId)).size, 'người', 'Độc giả duy nhất có phiếu trong kỳ'], ['Phiếu quá hạn hiện tại', data.loans.filter(l => loanStatus(l) === 'overdue').length, 'phiếu', 'Tại thời điểm xuất báo cáo'], ['Tiền phạt phát sinh trong kỳ', data.fines.filter(f => within(f.createdAt)).reduce((n, f) => n + f.amount, 0), 'VND', 'Theo ngày ghi nhận khoản phạt'], ['Tiền thực thu trong kỳ', data.fines.filter(f => f.paid && within(paymentDay(f))).reduce((n, f) => n + f.amount, 0), 'VND', 'Theo ngày thanh toán; không cộng bản ghi cũ thiếu ngày thu'], ['Tiền phạt còn phải thu hiện tại', data.fines.filter(f => !f.paid).reduce((n, f) => n + f.amount, 0), 'VND', 'Tại thời điểm xuất báo cáo'],
    ] },
    { name: 'Phiếu mượn', title: 'Chi tiết phiếu mượn trong kỳ', subtitle: `${from} đến ${to} — đối chiếu theo mã phiếu`, columns: [{ label: 'Mã phiếu', width: 22 }, { label: 'Mã độc giả', width: 18 }, { label: 'Người mượn', width: 29 }, { label: 'Ngày mượn', width: 18, format: 'dd/mm/yyyy' }, { label: 'Hạn trả', width: 18, format: 'dd/mm/yyyy' }, { label: 'Số cuốn', width: 12 }, { label: 'Trạng thái', width: 20 }, { label: 'Người lập', width: 22 }], rows: loans.map(l => [l.id, l.readerId, data.readers.find(r => r.id === l.readerId)?.name ?? '', dateValue(l.borrowedAt), dateValue(l.dueAt), l.items.length, status[loanStatus(l)], l.operator ?? 'Linh Hoàng']) },
    { name: 'Sách hoàn trả', title: 'Sách được hoàn trả trong kỳ', subtitle: 'Một dòng tương ứng một bản sách đã trả', columns: [{ label: 'Mã phiếu', width: 22 }, { label: 'Mã bản sao', width: 20 }, { label: 'Tên sách', width: 45 }, { label: 'Người mượn', width: 29 }, { label: 'Hạn trả', width: 18, format: 'dd/mm/yyyy' }, { label: 'Ngày trả', width: 18, format: 'dd/mm/yyyy' }], rows: returned.map(({ loan, item }) => [loan.id, item.copyId, data.books.find(b => b.id === item.bookId)?.title ?? '', data.readers.find(r => r.id === loan.readerId)?.name ?? '', dateValue(loan.dueAt), dateValue(item.returnedAt)]) },
    { name: 'Kho sách', title: 'Tình trạng kho sách', subtitle: 'Ảnh chụp số liệu tại thời điểm xuất báo cáo', columns: [{ label: 'Mã đầu sách', width: 17 }, { label: 'Tên sách', width: 45 }, { label: 'Tác giả', width: 30 }, { label: 'Thể loại', width: 22 }, { label: 'Tổng bản', width: 15 }, { label: 'Khả dụng', width: 15 }, { label: 'Bảo trì', width: 15 }, { label: 'Đã mất', width: 15 }], rows: data.books.map(b => [b.code, b.title, b.author, b.category, b.copies.length, availableCopies(data, b.id).length, b.copies.filter(c => c.condition === 'repair').length, b.copies.filter(c => c.condition === 'lost').length]) },
    { name: 'Tiền phạt', title: 'Tiền phạt phát sinh trong kỳ', subtitle: 'VND — mỗi dòng là một khoản phạt được ghi nhận', columns: [{ label: 'Mã phạt', width: 22 }, { label: 'Mã phiếu', width: 22 }, { label: 'Người mượn', width: 29 }, { label: 'Ngày ghi nhận', width: 19, format: 'dd/mm/yyyy' }, { label: 'Số tiền', width: 19, format: '#,##0" ₫"' }, { label: 'Trạng thái', width: 23 }, { label: 'Lý do', width: 40 }], rows: data.fines.filter(f => within(f.createdAt)).map(f => [f.id, f.loanId, data.readers.find(r => r.id === f.readerId)?.name ?? '', dateValue(f.createdAt), f.amount, f.paid ? 'Đã thanh toán' : 'Chưa thanh toán', f.reason]) },
    { name: 'Sổ thu tiền', title: 'Giao dịch thu tiền trong kỳ', subtitle: 'Theo ngày thu thực tế. Bản ghi cũ thiếu ngày thu không được cộng vào kỳ.', columns: [{ label: 'Mã phiếu thu', width: 23 }, { label: 'Ngày thu', width: 19, format: 'dd/mm/yyyy' }, { label: 'Mã phạt', width: 22 }, { label: 'Người nộp', width: 29 }, { label: 'Số tiền', width: 19, format: '#,##0" ₫"' }, { label: 'Phương thức', width: 21 }, { label: 'Tham chiếu', width: 30 }, { label: 'Người thu', width: 25 }], rows: data.fines.filter(f => f.paid && within(paymentDay(f))).map(f => [f.receiptId ?? f.id, dateValue(paymentDay(f)), f.id, data.readers.find(r => r.id === f.readerId)?.name ?? '', f.amount, f.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt', f.paymentReference ?? '', f.collectedBy ?? '']) },
  ];
  return buildWorkbook(specs);
}
export async function exportLibraryReport(data: LibraryData, days: number) { try { await downloadExcel(await buildLibraryReport(data, addDays(today(), -days + 1), today()), `bao-cao-thu-vien-${today()}`); window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: 'Đã xuất báo cáo Excel với 6 trang tính.' } })); } catch (e) { window.dispatchEvent(new CustomEvent('folio-export', { detail: { message: `Chưa xuất được báo cáo: ${(e as Error).message}`, error: true } })); } }

export function exportLoanRequests(data: LibraryData, search = '') {
  return exportExcel('yeu-cau-giu-sach', [['Mã yêu cầu', 'Mã độc giả', 'Độc giả', 'Sách', 'Mã bản sao', 'Số cuốn', 'Ngày tạo', 'Hạn nhận', 'Trạng thái', 'Phiếu bàn giao', 'Lý do'], ...matchingRequests(data, search).map(r => [r.id, r.readerId, data.readers.find(x => x.id === r.readerId)?.name ?? '', r.copyIds.map(id => data.books.find(b => b.copies.some(c => c.id === id))?.title ?? '').join('; '), r.copyIds.join('; '), r.copyIds.length, r.createdAt, r.expiresAt, requestStatusLabel(r), r.loanId ?? '', r.reason ?? ''])]);
}
