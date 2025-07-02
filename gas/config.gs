/**
 * RepoTomo 設定ファイル
 * すべての設定を一元管理
 */

// LINE設定
const LINE_CONFIG = {
  CHANNEL_ACCESS_TOKEN: 'DbhKFXGGcj3q9BeUZ1xXMQdODez3EEdCXrbCwPV4vsjkipqsIKthBOQiBF7scFj3+4xFZ/IKe/jYuVx0B60LUf2Y/WPJybimrP7i0FXzJGC8L60ZOV5dr7TJX9m9V4ojGFVZnKVS2smH1Bv4LoWIPgdB04t89/1O/w1cDnyilFU=',
  CHANNEL_SECRET: '9fe353dcc1522135879e850f0389e082'
};

// スプレッドシートID
const SPREADSHEET_ID = '1_PSwPWpwjgAjSvV3Mb1dGG-J7u0OtxMNwaeDLVMt5U4';

// シート名
const SHEETS = {
  REPORTS: '報告書マスタ',
  STAFF: 'スタッフマスタ',
  HISTORY: '提出履歴'
};

// LINE APIエンドポイント
const LINE_API = {
  REPLY: 'https://api.line.me/v2/bot/message/reply',
  PUSH: 'https://api.line.me/v2/bot/message/push',
  PROFILE: 'https://api.line.me/v2/bot/profile'
};

// メッセージテンプレート
const MESSAGES = {
  WELCOME: {
    GREETING: (name) => `${name}さん、RepoTomoへようこそ！🎉\n\n報告書の提出がとっても簡単になりますよ😊`,
    GUIDE: '困ったときは「ヘルプ」と送ってくださいね。\n今日の報告書を確認するには「今日の報告書」と送ってください！'
  },
  ENCOURAGEMENT: [
    'お疲れさまでした！提出ありがとうございます😊',
    '素晴らしい！今日もがんばりましたね🌟',
    '提出完了です！ゆっくり休んでくださいね☕',
    'ありがとうございます！とても助かります💪'
  ],
  ERROR: {
    NOT_REGISTERED: '申し訳ありません。スタッフ登録が見つかりません。\n管理者にお問い合わせください。',
    GENERAL: 'ちょっと調子が悪いみたい😅\nもう一度試してみてください。'
  }
};

// Webアプリ設定
const WEB_APP_CONFIG = {
  TITLE: 'RepoTomo - 報告書管理システム',
  THEME_COLOR: '#7c9fdb'
};