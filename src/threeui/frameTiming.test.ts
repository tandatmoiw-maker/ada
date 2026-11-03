import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { frameDeltaSeconds } from './frameTiming.ts';

const { MathUtils } = createRequire(import.meta.url)('three165') as {
  MathUtils: { damp: (current: number, target: number, speed: number, delta: number) => number };
};

test('an older first RAF timestamp cannot reverse book damping', () => {
  assert.equal(frameDeltaSeconds(1000, 25297.782), 0);
  let previous = 25297.782;
  let height = 0;
  let scale = 1;
  for (let frame = 0; frame < 120; frame += 1) {
    const timestamp = 1000 + frame * (1000 / 60);
    const delta = frameDeltaSeconds(timestamp, previous);
    height = MathUtils.damp(height, 1.32, 12, delta);
    scale = MathUtils.damp(scale, 1.09, 12, delta);
    previous = timestamp;
    assert.ok(Number.isFinite(height) && height >= 0 && height <= 1.32);
    assert.ok(Number.isFinite(scale) && scale >= 1 && scale <= 1.09);
  }
  assert.ok(Math.abs(height - 1.32) < 0.001);
});

test('long frame gaps remain bounded', () => {
  assert.equal(frameDeltaSeconds(32000, 1000), 0.05);
  assert.equal(frameDeltaSeconds(1000, 1000), 0);
});
