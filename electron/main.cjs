const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { clampPosition, positionForPointer } = require('./position.cjs');

const { createRoamer } = require('./roaming.cjs');

const size = { width: 220, height: 190 };
let win;
let paused = false;
let drag;
let pendingSave;
let motionAllowed = false;
let menuOpen = false;
let pointerOver = false;
let pendingMenuAction;
const careActions = new Set(['ball', 'food', 'water']);
let care;
let careTimer;
let nextCareId = 0;

const roamer = createRoamer({
  getBounds: () => liveWindow() ? win.getBounds() : undefined,
  getWorkArea: workAreaForBounds,
  getPointer: () => screen.getCursorScreenPoint(),
  // A stroll doesn't turn a deliberate manual place into a stream of disk writes.
  move: position => applyPosition(position, false),
  emit: state => { if (liveWindow()) win.webContents.send('wifi:roam', state); },
});
function liveWindow() { return win && !win.isDestroyed(); }
function refreshRoaming() {
  roamer.setBlocked(!liveWindow() || !motionAllowed || paused || Boolean(drag) || menuOpen || Boolean(care));
}

function statePath() { return path.join(app.getPath('userData'), 'wifi-state.json'); }
function readState() {
  try { return JSON.parse(fs.readFileSync(statePath(), 'utf8')) || {}; } catch { return {}; }
}
function writeState(next) {
  fs.writeFileSync(statePath(), JSON.stringify({ ...readState(), ...next }), 'utf8');
}
function homePosition() {
  const area = screen.getPrimaryDisplay().workArea;
  return clampPosition({
    x: area.x + area.width - size.width - 40,
    y: area.y + area.height - size.height - 30,
  }, size, area);
}
function workAreaForBounds(bounds) { return screen.getDisplayMatching(bounds).workArea; }
function savePosition() {
  clearTimeout(pendingSave);
  if (!win || win.isDestroyed()) return;
  const [x, y] = win.getPosition();
  writeState({ x, y });
}
function applyPosition({ x, y }, persist = true) {
  const [currentX, currentY] = win.getPosition();
  if (x === currentX && y === currentY) return;
  win.setPosition(x, y);
  if (!persist) return;
  clearTimeout(pendingSave);
  pendingSave = setTimeout(savePosition, 200);
}
function restorePosition(saved) {
  if (!Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return homePosition();
  return clampPosition(saved, size, workAreaForBounds({ x: saved.x, y: saved.y, ...size }));
}
function makeWindow() {
  win = new BrowserWindow({
    ...size, ...restorePosition(readState()), frame: false, transparent: true,
    alwaysOnTop: true, resizable: false, skipTaskbar: true, hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true,
    },
  });
  win.setAlwaysOnTop(true, 'floating');
  win.on('close', savePosition);
  win.on('closed', () => {
    drag = undefined;
    motionAllowed = false;
    menuOpen = false;
    pointerOver = false;
    pendingMenuAction = undefined;
    clearTimeout(careTimer);
    care = undefined;
    win = undefined;
    refreshRoaming();
  });
  win.on('blur', () => {
    if (!drag) return;
    drag = undefined;
    savePosition();
    refreshRoaming();
  });
  win.webContents.on('did-start-loading', () => {
    motionAllowed = false;
    finishCare(false);
    pointerOver = false;
    refreshRoaming();
    roamer.setHovering(false);
  });
  if (app.isPackaged) win.loadFile(path.join(__dirname, '../dist/index.html'));
  else win.loadURL('http://127.0.0.1:5173');
}
function finishCare(notify) {
  if (!care) return;
  const id = care.id;
  clearTimeout(careTimer);
  care = undefined;
  refreshRoaming();
  if (notify && liveWindow()) win.webContents.send('wifi:care-stop', id);
}
function petAction(action) {
  if (!liveWindow()) return;
  finishCare(true);
  if (careActions.has(action)) {
    care = { id: ++nextCareId, action };
    refreshRoaming();
    win.webContents.send('wifi:care-start', care);
    const id = care.id;
    careTimer = setTimeout(() => { if (care?.id === id) finishCare(true); }, 6500);
    return;
  }
  if (action === 'pet') roamer.restart();
  else if (!roamer.act(action)) return;
  win.webContents.send('wifi:pet-action', action);
}

function isPetWindow(event) { return win && !win.isDestroyed() && event.sender === win.webContents; }
function repositionIfNeeded() {
  if (!liveWindow()) return;
  roamer.restart();
  applyPosition(restorePosition(win.getBounds()));
}

app.whenReady().then(() => {
  ipcMain.on('wifi:roaming-enabled', (event, enabled) => {
    if (!isPetWindow(event) || typeof enabled !== 'boolean') return;
    motionAllowed = enabled;
    refreshRoaming();
  });
  ipcMain.on('wifi:pointer-over', (event, over) => {
    if (!isPetWindow(event) || typeof over !== 'boolean') return;
    pointerOver = over;
    roamer.setHovering(pointerOver);
  });
  ipcMain.on('wifi:pet-action', (event, action) => {
    if (!isPetWindow(event) || !['play', 'call', 'rest'].includes(action) && !careActions.has(action)) return;
    petAction(action);
  });
  ipcMain.on('wifi:care-finish', (event, id) => {
    if (isPetWindow(event) && care?.id === id) finishCare(false);
  });
  ipcMain.handle('wifi:load', event => isPetWindow(event) ? { ...readState(), paused } : {});
  ipcMain.handle('wifi:save', (event, state) => {
    if (!isPetWindow(event) || !Number.isSafeInteger(state?.pets) || state.pets < 0) return false;
    finishCare(true);
    roamer.restart();
    writeState({ pets: state.pets });
    return true;
  });
  ipcMain.on('wifi:drag-start', (event, point) => {
    if (!isPetWindow(event) || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
    const [x, y] = win.getPosition();
    drag = { pointer: point, origin: { x, y } };
    finishCare(true);
    refreshRoaming();
  });
  ipcMain.on('wifi:drag-move', event => {
    if (!isPetWindow(event) || !drag) return;
    const cursor = screen.getCursorScreenPoint();
    applyPosition(positionForPointer(cursor, drag, size, screen.getDisplayNearestPoint(cursor).workArea));
  });
  ipcMain.on('wifi:drag-end', event => {
    if (!isPetWindow(event) || !drag) return;
    drag = undefined;
    savePosition();
    refreshRoaming();
  });
  ipcMain.on('wifi:menu', event => {
    if (!isPetWindow(event)) return;
    if (menuOpen) return;
    menuOpen = true;
    finishCare(true);
    refreshRoaming();
    const choose = action => () => { pendingMenuAction = action; };
    // Commands that move WiFi explicitly are unavailable while movement is paused/reduced.
    const canMove = motionAllowed && !paused;
    const menu = Menu.buildFromTemplate([
      { label: '摸摸 WiFi', click: choose('pet') },
      { label: '扔网球', click: choose('ball') },
      { label: '喂点吃的', click: choose('food') },
      { label: '给它喝水', click: choose('water') },
      { type: 'separator' },
      { label: '叫 WiFi 过来', enabled: canMove, click: choose('call') },
      { label: '让它休息', enabled: canMove, click: choose('rest') },
      { type: 'separator' },
      { label: paused ? '继续活动' : '暂停活动', click() {
        paused = !paused;
        refreshRoaming();
        if (win && !win.isDestroyed()) win.webContents.send('wifi:pause', paused);
      } },
      { label: '回到原位', click() { if (win && !win.isDestroyed()) applyPosition(homePosition()); } },
      { type: 'separator' },
      { label: '退出 WiFi', click() { app.quit(); } },
    ]);
    menu.popup({ window: win, callback() {
      menuOpen = false;
      refreshRoaming();
      const action = pendingMenuAction;
      pendingMenuAction = undefined;
      if (action) petAction(action);
    } });
  });
  makeWindow();
  screen.on('display-removed', repositionIfNeeded);
  screen.on('display-metrics-changed', repositionIfNeeded);
});
app.on('window-all-closed', () => app.quit());
