import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// データベース接続テスト
router.get('/test', async (req, res) => {
  try {
    // 基本的な接続テスト
    await prisma.$connect();
    
    // 各テーブルのレコード数を確認
    const counts = {
      staffs: await prisma.staff.count(),
      reportTemplates: await prisma.reportTemplate.count(),
      submissions: await prisma.reportSubmission.count(),
      notifications: await prisma.notification.count(),
      systemConfigs: await prisma.systemConfig.count()
    };

    res.json({
      status: 'success',
      message: 'Database connection successful',
      tables: counts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// スタッフ一覧取得（サンプルAPI）
router.get('/staffs', async (req, res) => {
  try {
    const staffs = await prisma.staff.findMany({
      include: {
        submissions: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      status: 'success',
      data: staffs,
      count: staffs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get staffs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get staffs',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 報告書テンプレート一覧取得
router.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.reportTemplate.findMany({
      include: {
        submissions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      status: 'success',
      data: reports,
      count: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reports',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 今日の提出状況（GAS機能を模倣）
router.get('/today-status', async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');

    const todaySubmissions = await prisma.reportSubmission.findMany({
      where: {
        submittedDate: today
      },
      include: {
        staff: true,
        reportTemplate: true
      }
    });

    const totalStaff = await prisma.staff.count({ where: { isActive: true } });
    const totalReports = await prisma.reportTemplate.count({ where: { isActive: true } });
    
    res.json({
      status: 'success',
      date: today,
      summary: {
        totalStaff,
        totalReports,
        submissionsToday: todaySubmissions.length,
        completionRate: totalStaff > 0 ? Math.round((todaySubmissions.length / totalStaff) * 100) : 0
      },
      submissions: todaySubmissions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get today status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;