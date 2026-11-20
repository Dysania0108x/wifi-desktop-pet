'use strict';

const { clampPosition } = require('./position.cjs');

const initialDelay = 1800;
const reentryDelay = 900;
const activityDelay = 2800;
const tickMs = 45;
const minRoom = 36;
const poses = ['sniff', 'sit', 'sleep'];
const duration = { sniff: [1500, 2400], sit: [2400, 3800], sleep: [4200, 6500] };

function planStroll(bounds, area, directionRoll, distanceRoll, range = [220, 500]) {
  const position = clampPosition(bounds, bounds, area);
  const room = {
    left: position.x - area.x,
    right: area.x + Math.max(0, area.width - bounds.width) - position.x,
  };
  const preferred = directionRoll < 0.5 ? 'left' : 'right';
  const other = preferred === 'left' ? 'right' : 'left';
  const facing = room[preferred] >= range[0] || room[preferred] >= room[other] ? preferred : other;
  if (room[facing] < minRoom) return null;
  const distance = Math.floor(range[0] + distanceRoll * (range[1] - range[0]));
  return {
    targetX: position.x + (facing === 'left' ? -1 : 1) * Math.min(room[facing], distance),
    facing,
  };
}

function containsPoint(bounds, point) {
  return Boolean(point) && point.x >= bounds.x && point.x < bounds.x + bounds.width
    && point.y >= bounds.y && point.y < bounds.y + bounds.height;
}

function planCall(bounds, area, pointer) {
  const center = area.x + (area.width - bounds.width) / 2;
  const fallback = () => planStroll(bounds, area, center < bounds.x ? 0 : 1, 0.5, [95, 165]);
  if (!pointer || containsPoint(bounds, pointer)) return fallback();
  const facing = pointer.x < bounds.x + bounds.width / 2 ? 'left' : 'right';
  const targetX = facing === 'left'
    ? Math.max(bounds.x - 470, pointer.x + 35)
    : Math.min(bounds.x + 470, pointer.x - bounds.width - 35);
  const clamped = clampPosition({ x: targetX, y: bounds.y }, bounds, area).x;
  if ((clamped - bounds.x) * (facing === 'left' ? -1 : 1) < minRoom) return fallback();
  return { targetX: clamped, facing };
}

function createRoamer({
  getBounds, getWorkArea, move, emit, getPointer = () => undefined, random = Math.random, timers = globalThis,
}) {
  let blocked = true;
  let hovering = false;
  let armedOnce = false;
  let hasWalked = false;
  let timer;
  let stroll;
  let facing = 'right';
  let behavior = 'idle';
  let previousPose;
  let explicit = false;

  function publish(next) {
    if (next === behavior) return;
    behavior = next;
    emit({ behavior, walking: behavior === 'walk', facing });
  }
  function stop() {
    timers.clearTimeout(timer);
    timer = undefined;
    explicit = false;
    stroll = undefined;
    publish('idle');
  }
  function schedule(callback, delay) {
    timer = timers.setTimeout(callback, delay);
  }
  function restart(delay = activityDelay) {
    stop();
    if (!blocked && !hovering) schedule(begin, delay);
  }
  function begin() {
    const bounds = getBounds();
    if (!bounds) return;
    if (containsPoint(bounds, getPointer())) { restart(reentryDelay); return; }
    const plan = planStroll(bounds, getWorkArea(bounds), random(), random());
    if (!plan) { pose(); return; }
    startWalk(plan, 3);
  }
  function startWalk(plan, speed, escapePointer) {
    stroll = { ...plan, speed, escapePointer };
    facing = stroll.facing;
    publish('walk');
    schedule(tick, tickMs);
  }
  function pose(force) {
    stroll = undefined;
    if (blocked || (hovering && !explicit)) { stop(); return; }
    // Get the pet moving before its first nap; avoid replaying the same pose.
    const available = (hasWalked ? poses : poses.slice(0, 2)).filter(p => p !== previousPose);
    const next = force || available[Math.floor(random() * available.length)];
    previousPose = next;
    publish(next);
    const [min, max] = duration[next];
    schedule(() => restart(Math.floor(650 + random() * 1550)), Math.floor(min + random() * (max - min)));
  }
  function tick() {
    const bounds = getBounds();
    if (!bounds || !stroll) { restart(); return; }
    const delta = stroll.targetX - bounds.x;
    const step = Math.max(-stroll.speed, Math.min(stroll.speed, delta));
    const next = clampPosition({ x: bounds.x + step, y: bounds.y }, bounds, getWorkArea(bounds));
    const point = getPointer();
    const sameStartingPointer = explicit && stroll.escapePointer && point
      && point.x === stroll.escapePointer.x && point.y === stroll.escapePointer.y;
    if (next.x === bounds.x || (!sameStartingPointer
      && (containsPoint(bounds, point) || containsPoint({ ...bounds, ...next }, point)))) {
      restart(reentryDelay);
      return;
    }
    move(next);
    if (next.x === stroll.targetX) {
      hasWalked = true;
      pose(explicit ? 'sniff' : undefined);
    } else schedule(tick, tickMs);
  }
  return {
    restart,
    setBlocked(value) {
      if (blocked === value) return;
      blocked = value;
      restart(armedOnce ? reentryDelay : initialDelay);
      if (!blocked) armedOnce = true;
    },
    setHovering(value) {
      if (hovering === value) return;
      hovering = value;
      // Entering cancels autonomous/explicit movement; leaving a native action starts it
      // only if it did not already start inside the existing hover.
      if (!hovering && explicit) return;
      restart(reentryDelay);
    },
    act(action) {
      if (blocked) return false;
      if (action === 'rest') {
        stop();
        explicit = true;
        pose('sleep');
        return true;
      }
      const bounds = getBounds();
      if (!bounds) return false;
      const area = getWorkArea(bounds);
      const pointer = getPointer();
      const plan = action === 'call' ? planCall(bounds, area, pointer)
        : planStroll(bounds, area, random(), random(), [150, 270]);
      if (!plan) return false;
      stop();
      explicit = true;
      const escapePointer = containsPoint(bounds, pointer) ? pointer : undefined;
      schedule(() => startWalk(plan, action === 'play' ? 4 : 3, escapePointer),
        action === 'play' ? 650 : 520);
      return true;
    },
  };
}

module.exports = { createRoamer, planCall, planStroll };
