const { contextBridge, ipcRenderer,Notification } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ['get-solutions', 'launch-solutions','get-latest','launch-solution-in-debug'];
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

    once: (channel, listener) => {
      const validChannels = ['get-latest-result'];
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => listener(...args));
      }
    },
  }
});
