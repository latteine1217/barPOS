const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// 獲取應用資料目錄
const getDataPath = () => {
  const appName = 'restaurant-pos-system';
  switch (process.platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', appName);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    default:
      return path.join(os.homedir(), '.config', appName);
  }
};

const dataPath = getDataPath();
const storageFile = path.join(dataPath, 'storage.json');

// 確保資料目錄存在
const ensureDataDir = async () => {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(dataPath, { recursive: true });
  }
};

// Electron 儲存 API
const electronStore = {
  // 讀取所有資料
  async getAll() {
    try {
      await ensureDataDir();
      const data = await fs.readFile(storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {}; // 檔案不存在，回傳空物件
      }
      throw error;
    }
  },

  // 設定單一項目
  async set(key, value) {
    try {
      await ensureDataDir();
      const data = await this.getAll();
      data[key] = value;
      await fs.writeFile(storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Electron store set error:', error);
      throw error;
    }
  },

  // 取得單一項目
  async get(key) {
    try {
      const data = await this.getAll();
      return data[key] || null;
    } catch (error) {
      console.error('Electron store get error:', error);
      return null;
    }
  },

  // 刪除單一項目
  async delete(key) {
    try {
      await ensureDataDir();
      const data = await this.getAll();
      delete data[key];
      await fs.writeFile(storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Electron store delete error:', error);
      throw error;
    }
  },

  // 取得所有 keys
  async keys() {
    try {
      const data = await this.getAll();
      return Object.keys(data);
    } catch (error) {
      console.error('Electron store keys error:', error);
      return [];
    }
  },

  // 清除所有資料
  async clear() {
    try {
      await ensureDataDir();
      await fs.writeFile(storageFile, '{}', 'utf8');
    } catch (error) {
      console.error('Electron store clear error:', error);
      throw error;
    }
  }
};

// 暴露 API 到 renderer 進程
contextBridge.exposeInMainWorld('electronAPI', {
  store: electronStore,
  platform: 'electron',
  version: process.versions.electron,
  
  // 其他有用的 API
  getAppVersion: () => require('../package.json').version,
  getDataPath: () => dataPath,
  
  // 檔案操作
  exportToFile: async (data, filename) => {
    try {
      const { dialog } = require('@electron/remote');
      const result = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true, path: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  importFromFile: async () => {
    try {
      const { dialog } = require('@electron/remote');
      const result = await dialog.showOpenDialog({
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const data = await fs.readFile(result.filePaths[0], 'utf8');
        return { success: true, data: JSON.parse(data) };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// IPC 監聽器
ipcRenderer.on('menu-new-order', () => {
  window.postMessage({ type: 'menu-action', action: 'new-order' }, '*');
});

ipcRenderer.on('menu-navigate', (event, page) => {
  window.postMessage({ type: 'menu-action', action: 'navigate', page }, '*');
});