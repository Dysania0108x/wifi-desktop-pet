const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wifi', {
  load: () => ipcRenderer.invoke('wifi:load'),
  save: data => ipcRenderer.invoke('wifi:save', data),
  menu: () => ipcRenderer.send('wifi:menu'),
  beginDrag: point => ipcRenderer.send('wifi:drag-start', point),
  moveDrag: () => ipcRenderer.send('wifi:drag-move'),
  endDrag: () => ipcRenderer.send('wifi:drag-end'),
  setPointerOver: over => ipcRenderer.send('wifi:pointer-over', over),
  setRoamingEnabled: enabled => ipcRenderer.send('wifi:roaming-enabled', enabled),
  onRoam: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('wifi:roam', listener);
    return () => ipcRenderer.removeListener('wifi:roam', listener);
  },
  play: () => ipcRenderer.send('wifi:pet-action', 'play'),
  callPet: () => ipcRenderer.send('wifi:pet-action', 'call'),
  rest: () => ipcRenderer.send('wifi:pet-action', 'rest'),
  care: action => ipcRenderer.send('wifi:pet-action', action),
  finishCare: id => ipcRenderer.send('wifi:care-finish', id),
  onCare: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('wifi:care-start', listener);
    return () => ipcRenderer.removeListener('wifi:care-start', listener);
  },
  onCareStop: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('wifi:care-stop', listener);
    return () => ipcRenderer.removeListener('wifi:care-stop', listener);
  },
  onPetAction: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('wifi:pet-action', listener);
    return () => ipcRenderer.removeListener('wifi:pet-action', listener);
  },
  onPause: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('wifi:pause', listener);
    return () => ipcRenderer.removeListener('wifi:pause', listener);
  },
});
