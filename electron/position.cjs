'use strict';

function clampPosition({ x, y }, { width, height }, area) {
  return {
    x: Math.min(Math.max(Math.round(x), area.x), area.x + Math.max(0, area.width - width)),
    y: Math.min(Math.max(Math.round(y), area.y), area.y + Math.max(0, area.height - height))
  };
}

function positionForPointer(pointer, drag, size, area) {
  return clampPosition({
    x: drag.origin.x + pointer.x - drag.pointer.x,
    y: drag.origin.y + pointer.y - drag.pointer.y,
  }, size, area);
}

module.exports = { clampPosition, positionForPointer };
