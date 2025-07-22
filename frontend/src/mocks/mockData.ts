import type { 
  Staff, 
  ReportTemplate, 
  Question, 
  Submission, 
  MoodOption, 
  SubmissionChoice,
  AuthUser 
} from '../types/database'

// モック用スタッフデータ
export const mockStaff: Staff = {
  id: 'mock-staff-001',
  staff_id: 'S001',
  name: 'テスト太郎',
  line_user_id: 'mock-line-user-001',
  role: 'STAFF',
  is_active: true,
  preferred_reminder_time: '18:00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockManager: Staff = {
  id: 'mock-manager-001',
  staff_id: 'M001',
  name: '管理花子',
  line_user_id: 'mock-line-manager-001',
  role: 'MANAGER',
  is_active: true,
  preferred_reminder_time: '19:00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockAuthUser: AuthUser = {
  id: mockStaff.id,
  staff_id: mockStaff.staff_id,
  name: mockStaff.name,
  role: mockStaff.role,
  line_user_id: mockStaff.line_user_id
}

// モック用報告書テンプレート
export const mockReportTemplate: ReportTemplate = {
  id: 'mock-template-001',
  title: '日次業務報告書',
  description: '今日の業務内容と気づきを報告してください',
  frequency: 'DAILY',
  due_time: '18:00',
  reminder_message: 'お疲れさまです！今日の報告書の提出をお願いします😊',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// モック用質問
export const mockQuestions: Question[] = [
  {
    id: 'mock-q-001',
    template_id: mockReportTemplate.id,
    text: '今日の業務で良かったことは何ですか？',
    type: 'TEXTAREA',
    is_required: true,
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-q-002',
    template_id: mockReportTemplate.id,
    text: '改善したいことがあれば教えてください',
    type: 'TEXTAREA',
    is_required: false,
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-q-003',
    template_id: mockReportTemplate.id,
    text: '今日の疲労度はいかがでしたか？',
    type: 'SCALE_1_TO_5',
    is_required: true,
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モック用提出データ
export const mockSubmission: Submission = {
  id: 'mock-submission-001',
  report_id: mockReportTemplate.id,
  staff_id: mockStaff.id,
  answers: {
    'mock-q-001': '今日はチームワークが良く、スムーズに作業ができました！',
    'mock-q-002': '在庫管理をもう少し効率化できそうです',
    'mock-q-003': '3'
  },
  mood: 'happy',
  has_question: false,
  is_answered: false,
  submitted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// UI用の定数データ
export const moodOptions: MoodOption[] = [
  { 
    value: 'happy', 
    label: '今日は調子いいです！', 
    icon: '😊', 
    color: 'green' 
  },
  { 
    value: 'neutral', 
    label: '普通です', 
    icon: '😐', 
    color: 'gray' 
  },
  { 
    value: 'need_help', 
    label: 'ちょっと大変かも', 
    icon: '😅', 
    color: 'orange' 
  }
]

export const submissionChoices: SubmissionChoice[] = [
  { type: 'submit', message: '提出完了！', icon: '📝' },
  { type: 'consult', message: '相談したい', icon: '💬' },
  { type: 'later', message: '後で', icon: '⏰' }
]

// 励ましメッセージ
export const encouragementMessages = {
  submit: [
    '提出ありがとうございました！お疲れさまでした🎉',
    'いつもお疲れさまです！頑張ってますね😊',
    '今日もお疲れさまでした！ありがとうございます✨'
  ],
  consult: [
    'いつでも相談してくださいね💪',
    '一緒に考えましょう！何でも聞いてください🤝',
    '大丈夫です！みんなでサポートします😊'
  ],
  later: [
    '無理しないでくださいね😊',
    'お時間のあるときで大丈夫ですよ☕',
    'ゆっくり休んでからで構いません🌸'
  ]
}

// エラーメッセージ（優しい表現）
export const gentleErrorMessages = {
  network: 'ちょっと調子が悪いみたい😅 もう一度お試しください',
  validation: '少し入力が足りないようです。確認してみてくださいね',
  auth: 'ログインの調子が良くないみたいです。少し待ってから試してみてください',
  general: '何かうまくいかないみたいです。少し時間を置いてから試してみてくださいね'
}