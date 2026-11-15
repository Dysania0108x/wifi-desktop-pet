const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('wifi',{
 load:()=>ipcRenderer.invoke('wifi:load'),
 save:(data)=>ipcRenderer.invoke('wifi:save',data),
 menu:()=>ipcRenderer.send('wifi:menu'),
 onPause:(callback)=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('wifi:pause',listener);return ()=>ipcRenderer.removeListener('wifi:pause',listener);}
});
