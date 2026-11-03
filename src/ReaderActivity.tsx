import { useAuth } from './auth';
import { useLibrary } from './store';
import { Empty, Icon } from './components';
import { dateLabel, daysBetween, loanStatus, money, today, totalLateEstimate } from './domain';
import { printFineReceipt } from './print';

export function ReaderFinance() {
  const { member } = useAuth(); const { data } = useLibrary();
  const fines = data.fines.filter(f => f.readerId === member?.readerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const estimate = data.loans.filter(l => l.readerId === member?.readerId && !l.cancelledAt).reduce((n, l) => n + totalLateEstimate(data, l), 0);
  return <section><div className="member-section-title"><h2>Khoản phạt & thanh toán</h2><span>{fines.filter(f => !f.paid).length} khoản chưa thanh toán</span></div><div className="reader-finance-note"><Icon name="CircleDollarSign" size={23} /><div><strong>Thanh toán tại quầy thư viện</strong><p>Mức phạt trả trễ: {money(data.settings.finePerDay)} / bản / ngày. Khoản phạt được ghi nhận khi trả sách; thủ thư xác nhận sau khi nhận tiền.</p>{estimate > 0 && <p>Ước tính sách chưa trả đang quá hạn: <strong>{money(estimate)}</strong>. Số này chưa nằm trong các khoản đã ghi nhận bên dưới.</p>}</div></div>{fines.length ? <div className="reader-ledger">{fines.map(f => <article key={f.id}><div><span className={`badge ${f.paid ? 'active' : 'overdue'}`}>{f.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span><h3>{money(f.amount)}</h3><p>{f.reason}</p><small>{f.id} · Phiếu {f.loanId} · Ghi nhận {dateLabel(f.createdAt)}</small></div><div>{f.paid ? <><strong>{f.receiptId ?? 'Bản ghi trước khi có phiếu thu'}</strong><p>{f.paidAt ? new Date(f.paidAt).toLocaleString('vi-VN') : 'Chưa ghi nhận ngày thu'}</p><p>{f.paymentMethod === 'transfer' ? 'Chuyển khoản' : f.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chưa ghi nhận phương thức'}{f.paymentReference && ` · ${f.paymentReference}`}</p><button className="public-text-link" onClick={() => printFineReceipt(data, f)}><Icon name="Printer" size={16} />In phiếu thu</button></> : <a className="public-text-link" href="#contact">Liên hệ quầy thanh toán<Icon name="ArrowUpRight" size={16} /></a>}</div></article>)}</div> : <Empty title="Chưa có khoản phạt được ghi nhận" description="Các khoản phát sinh sau khi trả sách sẽ hiển thị tại đây." />}</section>;
}

export function ReaderNotifications() {
  const { member } = useAuth(); const { data } = useLibrary(); const date = today();
  const loans = data.loans.filter(l => l.readerId === member?.readerId && !l.cancelledAt && loanStatus(l) !== 'returned');
  const requests = (data.requests ?? []).filter(r => r.readerId === member?.readerId && ['pending', 'ready'].includes(r.status) && r.expiresAt >= date);
  const debt = data.fines.filter(f => f.readerId === member?.readerId && !f.paid);
  const notices = [
    ...loans.filter(l => l.dueAt < date).map(l => ({ id: l.id, icon: 'AlertCircle' as const, title: `Phiếu ${l.id} đã quá hạn ${daysBetween(l.dueAt, date)} ngày`, text: `Vui lòng mang ${l.items.filter(i => !i.returnedAt).length} bản sách còn lại đến thư viện. Hạn trả: ${dateLabel(l.dueAt)}.`, href: '#account?tab=loans', label: 'Xem sách đang mượn', urgent: true })),
    ...loans.filter(l => l.dueAt >= date && daysBetween(date, l.dueAt) <= 3).map(l => ({ id: l.id, icon: 'Clock3' as const, title: `Sách đến hạn ${l.dueAt === date ? 'hôm nay' : dateLabel(l.dueAt)}`, text: `Phiếu ${l.id}. Kiểm tra điều kiện gia hạn trước ngày trả sách.`, href: '#account?tab=loans', label: 'Xem phiếu & gia hạn', urgent: false })),
    ...requests.filter(r => r.status === 'ready').map(r => ({ id: r.id, icon: 'BookOpen' as const, title: 'Sách của bạn đã sẵn sàng tại quầy', text: `${r.id} · Nhận ${r.copyIds.length} cuốn trước ${dateLabel(r.expiresAt)}. Mang theo mã thẻ ${member?.readerId}.`, href: '#account?tab=requests', label: 'Xem yêu cầu giữ sách', urgent: false })),
    ...debt.map(f => ({ id: f.id, icon: 'CircleDollarSign' as const, title: `Khoản phạt ${money(f.amount)} chưa thanh toán`, text: `${f.reason}. Thanh toán tại quầy trước khi mượn sách mới.`, href: '#account?tab=fines', label: 'Xem khoản phạt', urgent: true })),
  ];
  return <section><div className="member-section-title"><h2>Nhắc việc của bạn</h2><span>{notices.length} việc cần xem</span></div><p className="public-small-note">Nhắc việc được cập nhật từ phiếu mượn, yêu cầu giữ sách và khoản phạt hiện tại.</p>{notices.length ? <div className="reader-notices">{notices.map(n => <article key={n.id} className={n.urgent ? 'urgent' : ''}><span><Icon name={n.icon} size={22} /></span><div><h3>{n.title}</h3><p>{n.text}</p><a className="public-text-link" href={n.href}>{n.label}<Icon name="ArrowRight" size={16} /></a></div></article>)}</div> : <Empty title="Mọi thứ đã đâu vào đó" description="Nhắc trả sách, sách sẵn sàng nhận và khoản chưa thanh toán sẽ xuất hiện tại đây." />}</section>;
}
