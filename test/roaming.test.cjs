const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRoamer, planCall, planStroll } = require('../electron/roaming.cjs');

function fakeClock() {
  let nextId = 1;
  const timers = new Map();
  return {
    setTimeout(callback, delay) { const id = nextId++; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    next() { const [id, job] = timers.entries().next().value; timers.delete(id); job.callback(); return job.delay; },
    get count() { return timers.size; },
  };
}
function setup(x = 300) {
  const timers = fakeClock();
  const moves = [];
  const events = [];
  const area = { x: 0, y: 20, width: 1200, height: 780 };
  const bounds = { x, y: 600, width: 220, height: 190 };
  const control = { pointer: undefined };
  const roamer = createRoamer({
    getBounds: () => bounds, getWorkArea: () => area,
    getPointer: () => control.pointer, random: () => 0.75, timers,
    move(position) { Object.assign(bounds, position); moves.push(position); },
    emit: event => events.push(event),
  });
  return { timers, moves, events, bounds, roamer, control };
}
const snapshot = (behavior, facing = 'right') => ({ behavior, walking: behavior === 'walk', facing });

test('strolls use substantially more room, reverse away from an edge, and skip cramped areas', () => {
  const area = { x: -1200, y: 20, width: 1200, height: 780 };
  assert.deepEqual(planStroll({ x: -230, y: 610, width: 220, height: 190 }, area, 0.8, 0.1),
    { targetX: -478, facing: 'left' });
  assert.equal(planStroll({ x: 0, y: 0, width: 220, height: 190 }, { x: 0, y: 0, width: 249, height: 195 }, 0.3, 0.5), null);
});

test('desktop moves in small slow steps within 1.8 seconds, then visibly alternates poses', () => {
  const { timers, moves, events, bounds, roamer } = setup();
  assert.equal(timers.count, 0);
  roamer.setBlocked(false);
  assert.equal(timers.next(), 1800);
  assert.deepEqual(events, [snapshot('walk')]);
  for (let i = 0; i < 150 && events.length === 1; i++) assert.equal(timers.next(), 45);
  assert.equal(bounds.x, 730);
  assert.equal(moves.length, Math.ceil(430 / 3));
  assert.equal(moves[0].x, 303);
  assert.ok(moves.every(step => step.y === 600));
  assert.deepEqual(events[1], snapshot('sleep'));
  assert.ok(timers.next() > 4200);
  assert.equal(events.at(-1).behavior, 'idle');
  timers.next();
  for (let i = 0; i < 150 && events.at(-1).behavior === 'walk'; i++) timers.next();
  assert.notEqual(events.at(-1).behavior, 'sleep');
  assert.ok(['sit', 'sniff'].includes(events.at(-1).behavior));
  assert.equal(timers.count, 1);
});

test('pointer, pause and manual actions stop walking; leaving hover restarts soon', () => {
  const { timers, moves, events, roamer, control } = setup();
  roamer.setBlocked(false);
  control.pointer = { x: 400, y: 620 };
  timers.next();
  assert.equal(events.length, 0);
  control.pointer = undefined;
  timers.next();
  control.pointer = { x: 522, y: 620 };
  timers.next(); // next window position would slide underneath the cursor
  assert.equal(moves.length, 0);
  assert.deepEqual(events, [snapshot('walk'), snapshot('idle')]);
  control.pointer = undefined;
  timers.next();
  timers.next();
  assert.equal(moves.length, 1);
  roamer.setHovering(true);
  assert.equal(timers.count, 0);
  roamer.setHovering(false);
  assert.equal(timers.next(), 900);
  roamer.setBlocked(true);
  assert.deepEqual(events.at(-1), snapshot('idle'));
  assert.equal(timers.count, 0);
  roamer.setBlocked(false);
  assert.equal(timers.next(), 900);
  roamer.restart();
  assert.deepEqual(events.at(-1), snapshot('idle'));
  assert.equal(timers.next(), 2800);
});

test('play departs underneath a stationary pointer after the bow, and pauses if it moves over the pet', () => {
  const { timers, moves, events, roamer, control } = setup();
  roamer.setBlocked(false);
  roamer.setHovering(true);
  control.pointer = { x: 400, y: 620 };
  assert.equal(roamer.act('play'), true);
  assert.equal(events.length, 0);
  assert.equal(timers.next(), 650);
  assert.deepEqual(events, [snapshot('walk')]);
  assert.equal(timers.next(), 45);
  assert.equal(moves[0].x, 304);
  control.pointer = { x: 405, y: 620 };
  timers.next();
  assert.deepEqual(events.at(-1), snapshot('idle'));
  assert.equal(moves.length, 1);
  assert.equal(timers.count, 0);
});

test('call stops short of the cursor, has a near-cursor fallback, and obeys blocking', () => {
  const area = { x: 0, y: 20, width: 1200, height: 780 };
  const { timers, moves, events, bounds, roamer, control } = setup();
  control.pointer = { x: 830, y: 620 };
  assert.deepEqual(planCall(bounds, area, control.pointer), { targetX: 575, facing: 'right' });
  assert.deepEqual(planCall(bounds, area, { x: 400, y: 620 }), { targetX: 430, facing: 'right' });
  assert.equal(roamer.act('call'), false);
  roamer.setBlocked(false);
  assert.equal(roamer.act('call'), true);
  assert.equal(timers.next(), 520);
  for (let i = 0; i < 100 && events.at(-1).behavior === 'walk'; i++) timers.next();
  assert.equal(bounds.x, 575);
  assert.equal(moves.length, Math.ceil(275 / 3));
  assert.deepEqual(events.at(-1), snapshot('sniff'));
  assert.equal(roamer.act('rest'), true);
  assert.deepEqual(events.at(-1), snapshot('sleep'));
});
