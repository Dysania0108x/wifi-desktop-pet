const { test } = require('node:test');
const assert = require('node:assert/strict');
test('tennis leads with the ball, then chase, contact and return', async () => {
  const { careScenes } = await import('../src/care.mjs');
  assert.deepEqual(careScenes.ball.map(step => step.phase), ['ready', 'chase', 'touch', 'return', 'finish']);
  assert.equal(careScenes.ball[1].mode, 'walk');
  assert.equal(careScenes.ball[3].mode, 'walk');
});
test('eating and drinking inspect first and clean up before the native timeout', async () => {
  const { careScenes } = await import('../src/care.mjs');
  assert.deepEqual(careScenes.food.map(step => step.phase), ['arrive', 'inspect', 'bite', 'finish']);
  assert.deepEqual(careScenes.water.map(step => step.phase), ['arrive', 'inspect', 'lap', 'finish']);
  for (const timeline of Object.values(careScenes)) {
    const length = timeline.reduce((ms, step) => ms + step.ms, 0);
    assert.ok(length > 3000 && length < 5000);
  }
});
