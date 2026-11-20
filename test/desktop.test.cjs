const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { clampPosition, positionForPointer } = require('../electron/position.cjs');

test('clamps at all edges, including a display left of the primary and a small work area', () => {
  const size = { width: 220, height: 190 };
  assert.deepEqual(clampPosition({ x: -1400, y: 820 }, size, { x: -1280, y: 24, width: 1280, height: 800 }),
    { x: -1280, y: 634 });
  assert.deepEqual(clampPosition({ x: 500, y: 500 }, size, { x: 24, y: -20, width: 120, height: 140 }),
    { x: 24, y: -20 });
});
test('preserves where you grabbed the pet', () => {
  assert.deepEqual(positionForPointer({ x: 380, y: 350 },
    { pointer: { x: 260, y: 300 }, origin: { x: 200, y: 275 } },
    { width: 220, height: 190 }, { x: 0, y: 0, width: 1000, height: 800 }), { x: 320, y: 325 });
});

test('Electron handlers restore, drag, persist, reset and honor roaming controls', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const folder = mkdtempSync(path.join(tmpdir(), 'wifi-native-test-'));
  const statePath = path.join(folder, 'wifi-state.json');
  writeFileSync(statePath, JSON.stringify({ x: 6000, y: 6000, pets: 4 }));
  const area = { x: 0, y: 20, width: 1200, height: 820 };
  let cursor, current, menu, closeMenu;
  const sent = [];
  class Window extends EventEmitter {
    constructor(bounds) { super(); this.bounds = bounds; this.webContents = Object.assign(new EventEmitter(), { send: (...event) => sent.push(event) }); current = this; }
    setAlwaysOnTop() {}
    loadURL() {}
    isDestroyed() { return false; }
    getBounds() { return this.bounds; }
    getPosition() { return [this.bounds.x, this.bounds.y]; }
    setPosition(x, y) { Object.assign(this.bounds, { x, y }); }
  }
  const app = Object.assign(new EventEmitter(), { whenReady: async () => {}, getPath: () => folder });
  const screen = Object.assign(new EventEmitter(), {
    getPrimaryDisplay: () => ({ workArea: area }),
    getDisplayMatching: () => ({ workArea: area }),
    getDisplayNearestPoint: () => ({ workArea: area }),
    getCursorScreenPoint: () => cursor,
  });
  const ipcMain = Object.assign(new EventEmitter(), { handlers: new Map(), handle(name, handler) { this.handlers.set(name, handler); } });
  const Menu = { buildFromTemplate: items => ({ popup: options => { menu = items; closeMenu = options.callback; } }) };
  const originalLoad = Module._load;
  try {
    Module._load = function(request, ...args) {
      if (request === 'electron') return { app, BrowserWindow: Window, ipcMain, screen, Menu };
      return originalLoad.call(this, request, ...args);
    };
    require('../electron/main.cjs');
    await new Promise(resolve => setImmediate(resolve));
    const own = { sender: current.webContents };
    const foreign = { sender: {} };
    assert.deepEqual(current.getPosition(), [980, 650]);
    assert.deepEqual(ipcMain.handlers.get('wifi:load')(foreign), {});
    assert.equal(ipcMain.handlers.get('wifi:save')(foreign, { pets: 99 }), false);
    assert.equal(ipcMain.handlers.get('wifi:load')(own).pets, 4);
    cursor = { x: 600, y: 400 };
    ipcMain.emit('wifi:drag-start', foreign, { x: 1050, y: 700 });
    ipcMain.emit('wifi:drag-move', own);
    assert.deepEqual(current.getPosition(), [980, 650]);
    ipcMain.emit('wifi:drag-start', own, { x: 1050, y: 700 });
    ipcMain.emit('wifi:drag-move', own);
    ipcMain.emit('wifi:drag-end', own);
    assert.deepEqual(current.getPosition(), [530, 350]);
    assert.deepEqual(JSON.parse(readFileSync(statePath)), { x: 530, y: 350, pets: 4 });
    cursor = { x: 50, y: 50 };
    ipcMain.emit('wifi:roaming-enabled', foreign, true);
    t.mock.timers.tick(1800);
    assert.equal(sent.length, 0);
    ipcMain.emit('wifi:roaming-enabled', own, true);
    t.mock.timers.tick(1800);
    assert.deepEqual(sent[0][0], 'wifi:roam');
    assert.equal(sent[0][1].walking, true);
    t.mock.timers.tick(100);
    assert.notDeepEqual(current.getPosition(), [530, 350]);
    const beforeHover = current.getPosition();
    ipcMain.emit('wifi:pointer-over', own, true);
    t.mock.timers.tick(4000);
    assert.deepEqual(current.getPosition(), beforeHover);
    assert.equal(sent.at(-1)[1].walking, false);
    ipcMain.emit('wifi:pointer-over', own, false);

    ipcMain.emit('wifi:menu', own);
    menu.find(item => item.label === '回到原位').click();
    assert.deepEqual(current.getPosition(), [940, 620]);
    menu.find(item => item.label === '暂停活动').click();
    closeMenu();
    t.mock.timers.tick(4000);
    assert.deepEqual(current.getPosition(), [940, 620]);
    ipcMain.emit('wifi:menu', own);
    menu.find(item => item.label === '继续活动').click();
    closeMenu();
    ipcMain.emit('wifi:roaming-enabled', own, false);
    t.mock.timers.tick(4000);
    assert.deepEqual(current.getPosition(), [940, 620]);
    for (const [label, action] of [['扔网球', 'ball'], ['喂点吃的', 'food'], ['给它喝水', 'water']]) {
      ipcMain.emit('wifi:menu', own);
      menu.find(item => item.label === label).click();
      closeMenu();
      const [event, scene] = sent.at(-1);
      assert.equal(event, 'wifi:care-start');
      assert.equal(scene.action, action);
      t.mock.timers.tick(4200); // no autonomous window movement over the local scene
      assert.deepEqual(current.getPosition(), [940, 620]);
      ipcMain.emit('wifi:care-finish', { sender: {} }, scene.id);
      ipcMain.emit('wifi:care-finish', own, scene.id - 1);
      assert.equal(sent.at(-1)[0], 'wifi:care-start');
      if (action === 'water') {
        t.mock.timers.tick(2500);
        assert.deepEqual(sent.at(-1), ['wifi:care-stop', scene.id]);
      } else ipcMain.emit('wifi:care-finish', own, scene.id);
    }
    ipcMain.emit('wifi:pet-action', own, 'ball');
    const playing = sent.at(-1)[1];
    ipcMain.emit('wifi:drag-start', own, { x: 1050, y: 700 });
    assert.deepEqual(sent.at(-1), ['wifi:care-stop', playing.id]);
    ipcMain.emit('wifi:drag-end', own);
    current.emit('close');
  } finally {
    Module._load = originalLoad;
    rmSync(folder, { recursive: true, force: true });
  }
});
