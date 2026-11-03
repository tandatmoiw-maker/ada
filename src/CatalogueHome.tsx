import { lazy, Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import { useLibrary } from './store';
import { Cover, Icon } from './components';
import { availableCopies } from './domain';
import type { Book } from './domain';
const ShelfScene = lazy(() => import('./threeui/Bookshelf').then(m => ({ default: m.Bookshelf })));
type Props = { saved: string[]; toggle: (id: string) => void; add: (id: string) => void; card: (book: Book) => React.ReactNode };

export default function CatalogueHome({ card }: Props) {
  const { data } = useLibrary(); const [query, setQuery] = useState('');
  const picks = [data.books[0], data.books[7], data.books[10], data.books[8]].filter(Boolean);
  const featured = [data.books[7], data.books[0], data.books[2]].filter(Boolean);
  const total = data.books.reduce((n, b) => n + availableCopies(data, b.id).length, 0);
  const search = (e: FormEvent) => { e.preventDefault(); location.hash = `explore?q=${encodeURIComponent(query.trim())}`; };
  return <>
    <section className="catalogue-hero">
      <div className="edition-line"><span>FOLIO — THƯ VIỆN CỘNG ĐỒNG</span><span>ĐỌC · KHÁM PHÁ · KẾT NỐI</span></div>
      <div className="catalogue-hero-grid">
        <div className="catalogue-hero-copy"><span className="catalogue-eyebrow"><span />MỞ CỬA CHO MỌI SỰ TÒ MÒ</span><h1>Có cả một<br /><em>thế giới</em><br />trên kệ.</h1><p>Từ một trang sách, đi đến những nơi bạn chưa từng biết. Câu chuyện tiếp theo của bạn bắt đầu ở đây.</p><form className="hero-search" onSubmit={search}><Icon name="Search" size={21} /><input aria-label="Tìm sách từ trang chủ" placeholder="Tên sách, tác giả hoặc ISBN" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit" aria-label="Tìm sách"><Icon name="ArrowRight" size={21} /></button></form><div className="catalogue-hero-links"><a href="#explore">Khám phá {data.books.length} đầu sách<Icon name="ArrowUpRight" size={17} /></a><a href="#guide">Lần đầu đến Folio?</a></div></div>
        <div className="catalogue-poster"><div className="poster-top"><span>TỦ SÁCH MỞ</span><span>01 / FOLIO SELECTS</span></div><div className="poster-type" aria-hidden="true">ĐỌC<br /><span>ĐI.</span></div><div className="poster-books">{featured.map((b, i) => <a className={`poster-book poster-book-${i}`} key={b.id} href={`#book/${b.id}`} aria-label={`Khám phá ${b.title}`}><Cover book={b} large /></a>)}</div><div className="poster-bottom"><span>CHỌN MỘT CUỐN.<br />MANG VỀ MỘT THẾ GIỚI.</span><a href="#explore" aria-label="Khám phá tủ sách"><Icon name="ArrowUpRight" size={25} /></a></div></div>
      </div>
      <div className="library-facts"><div><strong>{String(data.books.length).padStart(2, '0')}</strong><span>đầu sách để khám phá</span></div><div><strong>{total}</strong><span>bản sách sẵn sàng</span></div><div><strong>{data.settings.loanDays}<small> ngày</small></strong><span>cho mỗi lượt mượn</span></div><a href="#guide"><Icon name="Library" size={22} /><span>Đến đọc tự do.<br /><strong>Không cần tài khoản.</strong></span><Icon name="ArrowUpRight" size={18} /></a></div>
    </section>
    <section className="public-section home-selection"><div className="public-section-heading"><div><span className="public-kicker">01 / BIÊN TẬP VIÊN CHỌN</span><h2>Một khởi đầu hay.</h2><p>Bốn cuốn sách, bốn cách nhìn thế giới.</p></div><a className="public-text-link" href="#explore">Xem toàn bộ kho sách<Icon name="ArrowUpRight" size={19} /></a></div><div className="public-book-grid">{picks.map(card)}</div></section>
    <section className="open-shelf-section"><div className="open-shelf-scene"><div className="shelf-label"><span>02 / GÓC KỆ FOLIO</span><Icon name="BookOpen" size={19} /></div><div className="shelf-viewport"><Suspense fallback={<div className="shelf-loading">Đang mở kệ sách…</div>}><ShelfScene decorative /></Suspense></div><div className="shelf-caption"><span>Một góc thư viện, trước khi bạn ghé.</span><span>FOLIO LIBRARY</span></div></div><div className="open-shelf-copy"><span className="public-kicker">ĐI THEO SỰ TÒ MÒ</span><h2>Bắt đầu từ<br />điều bạn thích.</h2><div className="catalogue-chapters">{[{ name: 'Văn học', text: 'Sống thêm những cuộc đời', n: '01' }, { name: 'Kỹ năng sống', text: 'Một thay đổi nhỏ, mỗi ngày', n: '02' }, { name: 'Khoa học', text: 'Đi tìm câu trả lời tiếp theo', n: '03' }].map(c => <a key={c.name} href={`#explore?category=${encodeURIComponent(c.name)}`}><span>{c.n}</span><div><h3>{c.name}</h3><p>{c.text}</p></div><Icon name="ArrowUpRight" size={22} /></a>)}</div></div></section>
    <section className="join-library"><div><span className="public-kicker">MỘT TẤM THẺ. NHIỀU CHUYẾN ĐI.</span><h2>Cuốn tiếp theo,<br />bạn chọn.</h2><p>Giữ sách trực tuyến, nhận tại quầy. Hoặc cứ ghé thư viện và để sự tò mò dẫn đường.</p><a className="public-button paper" href="#register">Trở thành độc giả<Icon name="ArrowUpRight" size={18} /></a><a className="join-secondary" href="#guide">Xem cách mượn sách</a></div><ol><li><span>01</span><div><strong>Chọn sách</strong><p>Tìm cuốn khiến bạn muốn mở trang đầu.</p></div></li><li><span>02</span><div><strong>Giữ một chỗ</strong><p>Gửi yêu cầu, theo dõi khi sách sẵn sàng.</p></div></li><li><span>03</span><div><strong>Ghé nhận. Mang về.</strong><p>Nhận sách và phiếu mượn tại thư viện.</p></div></li></ol></section>
  </>;
}
