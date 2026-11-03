/** RAF can carry an older timestamp than performance.now() after setup or resume. */
export function frameDeltaSeconds(timestamp: number, previousTimestamp: number): number {
  return Math.max(0, Math.min((timestamp - previousTimestamp) / 1000, 0.05));
}
