import type { CSSProperties } from 'react';
import type { Book } from './domain';
import './book-artwork.css';

// Original cover studies for the demo catalogue; these are not publisher covers.
const palettes = [
  ['#ffce3a', '#192c68', '#d94a2d'], ['#e34032', '#fff8dd', '#ffb7ac'],
  ['#103c31', '#faf1d4', '#e76348'], ['#efe9df', '#202d48', '#ed593d'],
  ['#f2f0e5', '#143ebf', '#e5c427'], ['#12746b', '#fff5cb', '#d2da76'],
  ['#ece9db', '#242b32', '#dd5c40'], ['#92bbef', '#173b70', '#ffe9a1'],
  ['#153ccc', '#fff9e5', '#b7d6ff'], ['#ffd24c', '#31228a', '#fff9d4'],
  ['#aee0ba', '#184b38', '#ff883d'], ['#134c42', '#f6e7b2', '#a9d1ae'],
];
function Motif({ index }: { index: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 };
  switch (index) {
    case 0: return <><circle cx="100" cy="131" r="31" fill="var(--cover-accent)" /><path d="M-10 205Q55 100 135 190T230 160V285H-10Z" fill="currentColor" /><path d="M-10 244Q70 170 160 238T230 208" stroke="var(--cover-bg)" fill="none" /></>;
    case 1: return <g {...common}>{[0, 1, 2, 3, 4].map(n => <path key={n} d={`M${32 + n * 13} 222v-59a${68 - n * 13} ${68 - n * 13} 0 0 1 ${136 - n * 26} 0v59`} />)}<circle cx="100" cy="230" r="7" fill="var(--cover-accent)" stroke="none" /></g>;
    case 2: return <><circle cx="120" cy="164" r="45" fill="var(--cover-accent)" /><g {...common}>{[0, 1, 2, 3, 4, 5].map(n => <path key={n} d={`M${25 + n * 29} 276V${125 + n % 3 * 12}m0 16l-17 24m17-7l18 22m-18 0l-14 22`} />)}</g></>;
    case 3: return <g {...common}><circle cx="100" cy="181" r="52" /><ellipse cx="100" cy="181" rx="28" ry="52" /><path d="M48 181h104m-97-24h90m-90 48h90m-45-76v104" /><circle cx="145" cy="139" r="14" fill="var(--cover-accent)" stroke="none" /></g>;
    case 4: return <><path d="M30 233V141h45v92m15 0V119h37v114m15 0v-65h31v65" fill="currentColor" /><path d="m30 217 55-58 38 26 50-64" stroke="var(--cover-accent)" strokeWidth="8" fill="none" /></>;
    case 6: return <g {...common}><circle cx="103" cy="183" r="37" fill="var(--cover-accent)" stroke="none" /><ellipse cx="103" cy="183" rx="76" ry="19" transform="rotate(-30 103 183)" /><path d="m37 132 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm111-22 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM70 244h7m-3-4v8m85-23h8m-4-4v8" /></g>;
    case 7: return <g {...common}><path d="M98 264V153m0 62-42-37m42 19 47-43m-47 28-18-34" strokeWidth="3" /><path d="M58 181q-32-7-29-33 30-2 29 33Zm84-18q6-31 30-28-1 26-30 28ZM80 155q-23-4-23-26 25-1 23 26Z" fill="currentColor" stroke="none" /><circle cx="58" cy="202" r="17" fill="var(--cover-accent)" stroke="none" /><circle cx="143" cy="193" r="20" fill="var(--cover-accent)" stroke="none" /><circle cx="98" cy="139" r="14" fill="var(--cover-accent)" stroke="none" /></g>;
    default: return <g {...common}><path d="M26 174q74-82 148 0-74 82-148 0Z" fill="var(--cover-accent)" stroke="none" /><path d="M100 129v119M52 152l96 46m-94 0 94-46" /><circle cx="100" cy="174" r="21" fill="var(--cover-bg)" /><circle cx="100" cy="174" r="6" fill="currentColor" /></g>;
  }
}
export function BookArtwork({ book, large = false }: { book: Book; large?: boolean }) {
  const index = Math.max(0, (Number(book.id.replace(/\D/g, '')) || book.title.length) - 1);
  const [fallback, preferredInk, accent] = palettes[index % palettes.length];
  const background = /^#[0-9a-f]{6}$/i.test(book.color) ? book.color : fallback;
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(n => parseInt(hex.slice(n, n + 2), 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const light = luminance(background), preferred = luminance(preferredInk);
  const contrast = (Math.max(light, preferred) + .05) / (Math.min(light, preferred) + .05);
  const ink = contrast >= 4.5 ? preferredInk : light > .179 ? '#000000' : '#ffffff';
  const motifs: Record<string, number> = { B1: 0, B2: 1, B3: 2, B4: 3, B5: 1, B6: 5, B7: 4, B8: 6, B9: 6, B10: 0, B11: 7, B12: 4, B13: 1, B14: 1, B15: 6, B16: 4, B17: 3, B18: 7 };
  return <span className={`book-cover original-cover cover-style-${index % 6} ${large ? 'large' : ''}`} style={{ '--cover-bg': background, '--cover-ink': ink, '--cover-accent': accent } as CSSProperties} aria-hidden="true">
    <svg viewBox="0 0 200 280" preserveAspectRatio="none"><rect width="200" height="280" fill="var(--cover-bg)" /><Motif index={motifs[book.id] ?? (book.category === 'Khoa học' ? 6 : book.category === 'Kinh tế' ? 4 : 1)} /></svg>
    <span className="cover-author">{book.author}</span><span className="cover-title">{book.title}</span><span className="cover-imprint">FOLIO / TỦ SÁCH CHỌN LỌC</span>
  </span>;
}
