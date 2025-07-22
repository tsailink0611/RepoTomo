-- RepoTomo Initial Database Schema
-- 心理的安全性を最重視した報告書管理システム

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- スタッフテーブル
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  line_user_id TEXT UNIQUE,
  role TEXT DEFAULT 'STAFF' CHECK (role IN ('STAFF', 'MANAGER', 'ADMIN')),
  is_active BOOLEAN DEFAULT true,
  preferred_reminder_time TIME DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 報告書テンプレートテーブル
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  due_time TIME DEFAULT '18:00',
  reminder_message TEXT DEFAULT 'お疲れさまです！報告書の提出をお願いします😊',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 質問設定テーブル
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('TEXT', 'TEXTAREA', 'CHOICE', 'MULTIPLE_CHOICE', 'SCALE_1_TO_5', 'YES_NO')),
  options TEXT[], -- JSON配列
  is_required BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提出履歴テーブル
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES report_templates(id),
  staff_id UUID REFERENCES staff(id),
  answers JSONB,
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'need_help')),
  has_question BOOLEAN DEFAULT false,
  question TEXT,
  is_answered BOOLEAN DEFAULT false,
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 相談・質問テーブル
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by TEXT, -- 管理者ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アチーブメントテーブル
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INT DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX idx_staff_staff_id ON staff(staff_id);
CREATE INDEX idx_staff_line_user_id ON staff(line_user_id);
CREATE INDEX idx_submissions_staff_id ON submissions(staff_id);
CREATE INDEX idx_submissions_report_id ON submissions(report_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_priority ON consultations(priority);

-- Row Level Security (RLS) 設定
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- スタッフは自分のデータのみアクセス可能
CREATE POLICY "staff_own_data" ON staff
  FOR ALL USING (auth.uid()::text = id::text);

-- 管理者は全データアクセス可能
CREATE POLICY "admin_all_access" ON staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- 報告書テンプレートは全員が読み取り可能、管理者のみ編集可能
CREATE POLICY "templates_read_all" ON report_templates
  FOR SELECT USING (true);

CREATE POLICY "templates_admin_write" ON report_templates
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- 質問も同様
CREATE POLICY "questions_read_all" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_admin_write" ON questions
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- 提出データは自分のもののみアクセス、管理者は全て
CREATE POLICY "submissions_own_data" ON submissions
  FOR ALL USING (staff_id::text = auth.uid()::text);

CREATE POLICY "submissions_admin_access" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- 相談データも同様
CREATE POLICY "consultations_own_data" ON consultations
  FOR ALL USING (staff_id::text = auth.uid()::text);

CREATE POLICY "consultations_admin_access" ON consultations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- アチーブメントは自分のもののみ
CREATE POLICY "achievements_own_data" ON achievements
  FOR ALL USING (staff_id::text = auth.uid()::text);

-- トリガー関数: updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();