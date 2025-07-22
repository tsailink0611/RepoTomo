# RepoTomo データベース設計書

## 概要
PostgreSQL + Prisma ORMを使用したデータベース設計

## ER図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Staff       │    │ ReportTemplate  │    │   Submission    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ staffId         │    │ title           │    │ reportId (FK)   │
│ name            │    │ description     │    │ staffId (FK)    │
│ lineUserId      │    │ frequency       │    │ answers         │
│ role            │    │ questions       │    │ mood            │
│ isActive        │    │ dueTime         │    │ submittedAt     │
│ preferredTime   │    │ reminderMsg     │    │ hasQuestion     │
│ createdAt       │    │ isActive        │    │ question        │
│ updatedAt       │    │ createdAt       │    │ createdAt       │
└─────────────────┘    │ updatedAt       │    │ updatedAt       │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Question     │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ templateId (FK) │
                    │ text            │
                    │ type            │
                    │ options         │
                    │ isRequired      │
                    │ order           │
                    └─────────────────┘
```

## Prismaスキーマ

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// スタッフ管理
model Staff {
  id                   String        @id @default(cuid())
  staffId              String        @unique // S001, S002...
  name                 String
  lineUserId           String?       @unique
  role                 Role          @default(STAFF)
  isActive             Boolean       @default(true)
  preferredReminderTime String?      @default("18:00") // HH:MM形式
  
  // リレーション
  submissions          Submission[]
  consultations        Consultation[]
  
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  
  @@map("staff")
}

// 報告書テンプレート
model ReportTemplate {
  id              String     @id @default(cuid())
  title           String     // "週報", "月報"
  description     String
  frequency       Frequency
  dueTime         String     @default("18:00") // HH:MM形式
  reminderMessage String     @default("お疲れさまです！報告書の提出をお願いします😊")
  isActive        Boolean    @default(true)
  
  // リレーション
  questions       Question[]
  submissions     Submission[]
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  @@map("report_templates")
}

// 質問設定
model Question {
  id           String         @id @default(cuid())
  templateId   String
  template     ReportTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  text         String         // "今週の達成度は？"
  type         QuestionType   
  options      String[]       // 選択肢（JSON配列）
  isRequired   Boolean        @default(false)
  order        Int            @default(0)
  
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  
  @@map("questions")
}

// 提出履歴
model Submission {
  id           String         @id @default(cuid())
  
  // 外部キー
  reportId     String
  report       ReportTemplate @relation(fields: [reportId], references: [id])
  staffId      String
  staff        Staff          @relation(fields: [staffId], references: [id])
  
  // 提出内容
  answers      Json           // { questionId: answer, ... }
  mood         Mood           @default(NEUTRAL)
  
  // 質問・相談
  hasQuestion  Boolean        @default(false)
  question     String?
  isAnswered   Boolean        @default(false)
  adminReply   String?
  repliedAt    DateTime?
  
  submittedAt  DateTime       @default(now())
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  
  @@map("submissions")
}

// 相談・質問（独立機能）
model Consultation {
  id          String            @id @default(cuid())
  staffId     String
  staff       Staff             @relation(fields: [staffId], references: [id])
  
  title       String            // "シフトについて"
  content     String
  isAnonymous Boolean           @default(false)
  status      ConsultationStatus @default(PENDING)
  priority    Priority          @default(MEDIUM)
  
  adminReply  String?
  repliedAt   DateTime?
  repliedBy   String?           // 管理者ID
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  @@map("consultations")
}

// アチーブメント・バッジ
model Achievement {
  id          String   @id @default(cuid())
  staffId     String
  staff       Staff    @relation(fields: [staffId], references: [id])
  
  type        String   // "consecutive_3", "first_submission"
  title       String   // "3日連続提出！"
  description String   // "頑張ってますね！"
  icon        String   // "🔥"
  
  earnedAt    DateTime @default(now())
  
  @@map("achievements")
}

// Enum定義
enum Role {
  STAFF
  MANAGER
  ADMIN
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
}

enum QuestionType {
  TEXT
  TEXTAREA
  CHOICE
  MULTIPLE_CHOICE
  SCALE_1_TO_5
  YES_NO
}

enum Mood {
  HAPPY
  NEUTRAL
  NEED_HELP
}

enum ConsultationStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## インデックス設計

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_staff_staff_id ON staff(staff_id);
CREATE INDEX idx_staff_line_user_id ON staff(line_user_id);
CREATE INDEX idx_submissions_staff_id ON submissions(staff_id);
CREATE INDEX idx_submissions_report_id ON submissions(report_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_priority ON consultations(priority);
```

## データ整合性制約

```sql
-- 追加の制約
ALTER TABLE staff ADD CONSTRAINT chk_staff_id_format 
  CHECK (staff_id ~ '^S[0-9]{3}$');

ALTER TABLE staff ADD CONSTRAINT chk_preferred_time_format 
  CHECK (preferred_reminder_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE report_templates ADD CONSTRAINT chk_due_time_format 
  CHECK (due_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');
```

## 初期データ例

```sql
-- スタッフサンプルデータ
INSERT INTO staff (staff_id, name, role) VALUES
('S001', '田中太郎', 'STAFF'),
('S002', '佐藤花子', 'STAFF'),
('M001', '管理者一郎', 'MANAGER');

-- 週報テンプレート
INSERT INTO report_templates (title, description, frequency) VALUES
('週報', '今週の振り返りをお聞かせください', 'WEEKLY'),
('日報', '今日一日お疲れさまでした', 'DAILY');
```

## バックアップ戦略

- 日次自動バックアップ（Railway/Render）
- 週次フルバックアップ
- 重要な変更前の手動バックアップ
- 本番データの開発環境への匿名化コピー