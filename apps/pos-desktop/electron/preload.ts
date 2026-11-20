import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (payload: string) => ipcRenderer.invoke('print-receipt', payload),
});
