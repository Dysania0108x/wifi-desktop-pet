const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('all illustrated faces and poses have transparent PNGs on one artboard', () => {
  const dir = path.join(__dirname, '..', 'public', 'sprites', 'wifi-v3');
  const names = ['stand', 'blink', 'walk-0', 'walk-1', 'walk-2', 'walk-3', 'sit', 'sleep', 'petted', 'sniff-0', 'sniff-1', 'sniff-2', 'play-0', 'play-1', 'play-2', 'pet-0', 'pet-1', 'pet-2'];
  assert.deepEqual(fs.readdirSync(dir).sort(), names.map(n => n + '.png').sort());
  const seen = new Set();
  for (const pose of names) {
    const b = fs.readFileSync(path.join(dir, pose + '.png'));
    assert.equal(b.subarray(1, 4).toString(), 'PNG');
    assert.equal(b.readUInt32BE(16), 320);
    assert.equal(b.readUInt32BE(20), 315);
    assert.equal(b[25], 6); // truecolor with alpha
    seen.add(require('node:crypto').createHash('sha256').update(b).digest('hex'));
  }
  assert.equal(seen.size, names.length);
});
