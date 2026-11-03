import { useEffect, useRef, useState } from 'react';
import type { BookshelfRenderer } from './bookshelfRenderer.js';
import { libraryVolumes } from './collection';
import { detectRenderSupport } from './renderSupport';
import './bookshelf.css';

export type BookshelfProps = {
  className?: string;
  decorative?: boolean;
};

type SceneState = 'loading' | 'ready' | 'unavailable' | 'reduced-motion' | 'software-fallback';

const sourceLabels = [
  'selection-title', 'selection-note', 'counter', 'palette-label', 'page-label',
  'page-counter', 'detail-eyebrow', 'detail-title', 'detail-deck',
  'detail-binding', 'detail-format', 'detail-theme', 'detail-motif', 'live-region',
];

/** ThreeUI Community Bookshelf, with a static alternative for reduced motion/WebGL. */
export function Bookshelf({ className = '', decorative = false }: BookshelfProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<SceneState>('loading');

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let renderer: BookshelfRenderer | undefined;
    let starting = false;
    let inView = false;
    let renderSupport: ReturnType<typeof detectRenderSupport> | undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const stop = () => {
      renderer?.dispose();
      renderer = undefined;
    };

    const start = async () => {
      if (disposed || renderer || starting || !inView) return;
      if (motion.matches) {
        setState('reduced-motion');
        return;
      }
      renderSupport ??= detectRenderSupport();
      if (renderSupport !== 'hardware') {
        setState(renderSupport === 'software' ? 'software-fallback' : 'unavailable');
        return;
      }
      starting = true;
      setState('loading');
      try {
        const { createBookshelfRenderer } = await import('./bookshelfRenderer.js');
        if (disposed || motion.matches || !inView) return;
        const instance = createBookshelfRenderer(host, canvas, {
          neutralTheme: true,
          libraryCollection: true,
          staticArtwork: true,
          onReady: () => { if (!disposed && !motion.matches) setState('ready'); },
          onError: () => { if (!disposed && !motion.matches) setState('unavailable'); },
        });
        renderer = instance;
        await instance.ready;
        if (!disposed && renderer === instance) instance.setActive(inView);
      } catch {
        if (!disposed && !motion.matches) setState('unavailable');
      } finally {
        starting = false;
      }
    };

    const onMotionChange = () => {
      if (motion.matches) {
        stop();
        setState('reduced-motion');
      } else {
        void start();
      }
    };

    const resize = new ResizeObserver(() => renderer?.resize());
    resize.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (renderer) renderer.setActive(inView);
      else if (inView) void start();
    }, { rootMargin: '100px' });
    intersection.observe(host);
    motion.addEventListener('change', onMotionChange);
    if (motion.matches) setState('reduced-motion');

    return () => {
      disposed = true;
      resize.disconnect();
      intersection.disconnect();
      motion.removeEventListener('change', onMotionChange);
      stop();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`threeui-bookshelf ${className}`.trim()}
      data-state={state}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Tủ sách gỗ với bảy tác phẩm văn học và sách tri thức, minh họa bằng ThreeUI.'}
      aria-hidden={decorative || undefined}
    >
      <div className="threeui-bookshelf__static" aria-hidden="true">
        <div className="threeui-bookshelf__volumes">
          {libraryVolumes.map((book, index) => (
            <span key={book.title} className={`threeui-bookshelf__volume threeui-bookshelf__volume--${index}`} style={{ backgroundColor: book.color, color: book.foil }}>
              <small>FOLIO / {String(index + 1).padStart(2, '0')}</small>
              <span>{book.title}</span>
              <small>{book.author}</small>
            </span>
          ))}
        </div>
        <span className="threeui-bookshelf__ledge" />
      </div>
      <canvas ref={canvasRef} className="threeui-bookshelf__canvas" aria-hidden="true" />
      <div className="threeui-bookshelf__source-controls" hidden aria-hidden="true">
        <div id="loading" />
        <p id="fallback-status" />
        <section id="browse-ui" />
        <aside id="detail-panel"><div className="detail-controls"><p className="microcopy" /></div></aside>
        <div id="markers" />
        {sourceLabels.map(id => <span key={id} id={id} />)}
        {['previous', 'next', 'inspect', 'close-detail', 'reset-view', 'toggle-book', 'previous-page', 'next-page'].map(id => (
          <button key={id} id={id} type="button" tabIndex={-1} />
        ))}
        <span id="pointer-label"><span id="pointer-label-index" /><span id="pointer-label-title" /></span>
      </div>
    </div>
  );
}
