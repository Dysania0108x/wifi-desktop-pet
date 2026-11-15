const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
let win;
let paused = false;
function statePath(){ return path.join(app.getPath('userData'), 'wifi-state.json'); }
function readState(){ try { return JSON.parse(fs.readFileSync(statePath(),'utf8')); } catch { return {}; } }
function writeState(next){ fs.writeFileSync(statePath(), JSON.stringify({...readState(),...next}), 'utf8'); }
function makeWindow(){
 const display = screen.getPrimaryDisplay().workArea;
 const saved = readState();
 const width=220,height=230;
 const x=Number.isFinite(saved.x)?saved.x:display.x+display.width-width-40;
 const y=Number.isFinite(saved.y)?saved.y:display.y+display.height-height-30;
 win = new BrowserWindow({width,height,x,y,frame:false,transparent:true,alwaysOnTop:true,resizable:false,skipTaskbar:true,hasShadow:false,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.setAlwaysOnTop(true,'floating');
 win.on('moved',()=>{if(win&&!win.isDestroyed()){const [x,y]=win.getPosition();writeState({x,y});}});
 if(!app.isPackaged){win.loadURL('http://127.0.0.1:5173');}else{win.loadFile(path.join(__dirname,'../dist/index.html'));}
}
app.whenReady().then(()=>{
 makeWindow();
 ipcMain.handle('wifi:load',()=>({...readState(),paused}));
 ipcMain.handle('wifi:save',(_event,state)=>{if(state&&typeof state==='object'){const allowed={};if(Number.isFinite(state.pets))allowed.pets=Math.max(0,Math.floor(state.pets));writeState(allowed);}return true;});
 ipcMain.on('wifi:menu',()=>{
 const menu=Menu.buildFromTemplate([
 {label:paused?'Resume WiFi':'Pause WiFi',click(){paused=!paused;win?.webContents.send('wifi:pause',paused);}},
 {label:'Reset position',click(){const a=screen.getPrimaryDisplay().workArea;win?.setPosition(a.x+a.width-260,a.y+a.height-260);}},
 {type:'separator'},{label:'Quit WiFi',click(){app.quit();}}
 ]);menu.popup({window:win});
 });
});
app.on('window-all-closed',()=>app.quit());
