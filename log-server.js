/**
 * Console Log 回傳服務器
 * 接收來自前端的 console 訊息並提供即時通訊
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// 中間件設置
app.use(cors());
app.use(express.json());

// 儲存日誌的記憶體陣列（生產環境建議使用資料庫）
let logs = [];
const MAX_LOGS = 1000; // 最大儲存日誌數量

/**
 * 添加日誌到儲存中
 * @param {Object} logData - 日誌資料
 */
const addLog = (logData) => {
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...logData
  };
  
  logs.push(logEntry);
  
  // 保持日誌數量在限制內
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  
  // 即時廣播給所有連接的客戶端
  io.emit('new-log', logEntry);
  
  return logEntry;
};

// API 路由：接收日誌
app.post('/log', (req, res) => {
  try {
    const { type = 'log', message = [], level = 'info', component = 'unknown' } = req.body;
    
    const logEntry = addLog({
      type,
      message: Array.isArray(message) ? message : [message],
      level,
      component,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    // 在服務器控制台也輸出（方便開發）
    console.log(`[${logEntry.timestamp}] [${type.toUpperCase()}] [${component}]:`, ...logEntry.message);
    
    res.json({ success: true, logId: logEntry.id });
  } catch (error) {
    console.error('接收日誌時發生錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API 路由：獲取歷史日誌
app.get('/logs', (req, res) => {
  try {
    const { limit = 100, type, level, component } = req.query;
    
    let filteredLogs = [...logs];
    
    // 篩選條件
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }
    
    // 限制返回數量並按時間倒序
    const result = filteredLogs
      .slice(-parseInt(limit))
      .reverse();
    
    res.json({ 
      success: true, 
      logs: result,
      total: filteredLogs.length 
    });
  } catch (error) {
    console.error('獲取日誌時發生錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API 路由：清除日誌
app.delete('/logs', (_req, res) => {
  try {
    logs = [];
    io.emit('logs-cleared');
    res.json({ success: true, message: '日誌已清除' });
  } catch (error) {
    console.error('清除日誌時發生錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket 連接處理
io.on('connection', (socket) => {
  console.log(`客戶端已連接: ${socket.id}`);
  
  // 發送最近的日誌給新連接的客戶端
  socket.emit('initial-logs', logs.slice(-50));
  
  socket.on('disconnect', () => {
    console.log(`客戶端已斷開: ${socket.id}`);
  });
  
  // 處理客戶端請求特定日誌
  socket.on('request-logs', (filter) => {
    let filteredLogs = [...logs];
    
    if (filter.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filter.type);
    }
    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }
    
    socket.emit('filtered-logs', filteredLogs.slice(-100));
  });
});

// 健康檢查端點
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    logsCount: logs.length,
    connections: io.engine.clientsCount
  });
});

// 啟動服務器
const PORT = process.env.LOG_SERVER_PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Console Log 服務器已啟動: http://localhost:${PORT}`);
  console.log(`📊 日誌 API: http://localhost:${PORT}/logs`);
  console.log(`🔗 WebSocket 連接: ws://localhost:${PORT}`);
  console.log(`❤️  健康檢查: http://localhost:${PORT}/health`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('正在關閉服務器...');
  server.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
});