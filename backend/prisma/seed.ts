import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Sample reports based on GAS data
  const reports = await Promise.all([
    prisma.report.create({
      data: {
        title: '週報',
        description: '今週の業務内容と来週の目標をまとめてください',
        type: 'weekly',
        frequency: 'weekly',
        dueDate: '金曜日',
        isActive: true
      }
    }),
    prisma.report.create({
      data: {
        title: '月報',
        description: '今月の成果と来月の目標を記載してください',
        type: 'monthly',
        frequency: 'monthly',
        dueDate: '月末',
        isActive: true
      }
    }),
    prisma.report.create({
      data: {
        title: 'KPT報告',
        description: 'Keep, Problem, Tryの観点で振り返りをお書きください',
        type: 'kpt',
        frequency: 'biweekly',
        dueDate: '隔週水曜日',
        isActive: true
      }
    }),
    prisma.report.create({
      data: {
        title: '店舗ビジョン進捗',
        description: '店舗ビジョンに向けた取り組み状況を報告してください',
        type: 'vision',
        frequency: 'monthly',
        dueDate: '15日頃',
        isActive: true
      }
    }),
    prisma.report.create({
      data: {
        title: '外国人スタッフ週報',
        description: '日本語学習状況や職場での困りごとをお聞かせください',
        type: 'international',
        frequency: 'weekly',
        dueDate: '日曜日',
        isActive: true
      }
    })
  ]);

  console.log(`✅ Created ${reports.length} sample reports`);

  // Sample test user (you can register via LINE later)
  const testUser = await prisma.user.create({
    data: {
      name: 'テストユーザー',
      email: 'test@repotomo.com',
      lineUserId: 'test_line_user_id',
      role: 'STAFF'
    }
  });

  console.log(`✅ Created test user: ${testUser.name}`);

  // Sample submission
  await prisma.reportSubmission.create({
    data: {
      userId: testUser.id,
      reportId: reports[0].id,
      status: 'COMPLETED',
      submittedAt: new Date(),
      content: 'テスト提出内容'
    }
  });

  console.log('✅ Created sample submission');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });