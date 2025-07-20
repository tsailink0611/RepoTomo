import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // スタッフマスタのシードデータ
  const staffData = [
    {
      staffId: 'S001',
      name: '田中太郎',
      lineUserId: 'line_user_001',
      role: '管理者',
      store: '本店'
    },
    {
      staffId: 'S002', 
      name: '佐藤花子',
      lineUserId: 'line_user_002',
      role: 'スタッフ',
      store: '支店A'
    },
    {
      staffId: 'S003',
      name: '鈴木一郎',
      lineUserId: 'line_user_003', 
      role: 'スタッフ',
      store: '支店B'
    }
  ];

  // 報告書テンプレートのシードデータ
  const reportTemplates = [
    {
      reportId: 'R001',
      name: '日報',
      frequency: 'daily',
      deadlineTime: '18:00',
      targetRoles: 'all',
      description: '1日の業務報告書'
    },
    {
      reportId: 'R002',
      name: '週報',
      frequency: 'weekly',
      deadlineDay: 5, // 金曜日
      deadlineTime: '17:00',
      targetRoles: 'all',
      description: '週次業務報告書'
    },
    {
      reportId: 'R003',
      name: '月次売上報告',
      frequency: 'monthly',
      deadlineTime: '10:00',
      targetRoles: '管理者',
      description: '月末の売上報告書'
    }
  ];

  // システム設定のシードデータ
  const systemConfigs = [
    {
      key: 'app_name',
      value: 'RepoTomo',
      category: 'general'
    },
    {
      key: 'reminder_enabled',
      value: 'true',
      category: 'notification'
    },
    {
      key: 'default_timezone',
      value: 'Asia/Tokyo',
      category: 'general'
    }
  ];

  // データベースに挿入
  console.log('👥 Creating staff...');
  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: { staffId: staff.staffId },
      update: {},
      create: staff
    });
  }

  console.log('📋 Creating report templates...');
  for (const template of reportTemplates) {
    await prisma.reportTemplate.upsert({
      where: { reportId: template.reportId },
      update: {},
      create: template
    });
  }

  console.log('⚙️ Creating system configs...');
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config
    });
  }

  // サンプル提出履歴（今日の日付で）
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  }).replace(/\//g, '/');

  console.log('📊 Creating sample submissions...');
  await prisma.reportSubmission.upsert({
    where: { submissionId: 'H001' },
    update: {},
    create: {
      submissionId: 'H001',
      staffId: 'S002',
      reportId: 'R001',
      submittedDate: today,
      status: '完了'
    }
  });

  await prisma.reportSubmission.upsert({
    where: { submissionId: 'H002' },
    update: {},
    create: {
      submissionId: 'H002',
      staffId: 'S003',
      reportId: 'R001', 
      submittedDate: today,
      status: '質問',
      question: '報告書の書き方を教えてください'
    }
  });

  console.log('✅ Seeding completed successfully!');
  
  // 作成されたデータを確認
  const staffCount = await prisma.staff.count();
  const templateCount = await prisma.reportTemplate.count();
  const submissionCount = await prisma.reportSubmission.count();
  
  console.log(`📈 Created: ${staffCount} staffs, ${templateCount} templates, ${submissionCount} submissions`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });