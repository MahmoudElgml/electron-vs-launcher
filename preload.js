const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ['get-solutions', 'launch-solutions'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, listener) => {
      const validChannels = ['receive-solutions'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
  },
});
