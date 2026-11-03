export type BookshelfRenderer = {
  ready: Promise<void>;
  resize: () => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
};

export function createBookshelfRenderer(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  callbacks?: { neutralTheme?: boolean; libraryCollection?: boolean; staticArtwork?: boolean; onReady?: () => void; onError?: (message: string) => void },
): BookshelfRenderer;
