type RenderSupport = 'hardware' | 'software' | 'unavailable';

/** Avoid building the detailed ThreeUI scene on CPU WebGL implementations. */
export function detectRenderSupport(): RenderSupport {
  const probe = document.createElement('canvas');
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    const options = { alpha: false, antialias: false, powerPreference: 'low-power' as const };
    context = (probe.getContext('webgl2', options) as WebGL2RenderingContext | null)
      ?? (probe.getContext('webgl', options) as WebGLRenderingContext | null);
    if (!context) return 'unavailable';
    const info = context.getExtension('WEBGL_debug_renderer_info');
    const name = String(context.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(name) ? 'software' : 'hardware';
  } catch {
    return 'unavailable';
  } finally {
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
