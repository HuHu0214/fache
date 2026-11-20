'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fache', {
  isDesktop: true,
  platform: process.platform,
  storage: {
    load: () => ipcRenderer.invoke('storage:load'),
    save: (snapshot) => ipcRenderer.invoke('storage:save', snapshot),
    clear: () => ipcRenderer.invoke('storage:clear'),
  },
  zoom: {
    set: (value) => ipcRenderer.invoke('window:set-zoom', value),
  },
  info: () => ipcRenderer.invoke('app:info'),
});
