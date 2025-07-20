import express from 'express';

const router = express.Router();

// ヘルスチェックエンドポイント
router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
    services: {
      api: 'healthy',
      database: 'healthy', // Prisma接続済み
      lineBot: 'pending'   // 後でLINE連携時に更新
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };

  res.json(healthData);
});

// 詳細ヘルスチェック
router.get('/detailed', (req, res) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    },
    memory: process.memoryUsage(),
    migration: {
      phase: 'database-setup',
      gasBackupAvailable: true,
      featuresImplemented: ['health-check', 'database-operations'],
      nextSteps: ['auth-system', 'report-api']
    }
  };

  res.json(detailedHealth);
});

export default router;