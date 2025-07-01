/**
 * RepoTomo - LINE連携勤怠管理システム
 * メインファイル：GASプロジェクトのエントリーポイント
 * 
 * @author RepoTomo Development Team
 * @version 1.0.0
 */

// 設定定数
const CONFIG = {
  // LINE Bot設定
  LINE_CHANNEL_ACCESS_TOKEN: PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
  LINE_CHANNEL_SECRET: PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_SECRET'),
  
  // スプレッドシート設定
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  
  // シート名
  SHEETS: {
    STAFF: 'スタッフマスタ',
    ATTENDANCE: '勤怠データ',
    SETTINGS: '設定'
  },
  
  // タイムゾーン
  TIMEZONE: 'Asia/Tokyo',
  
  // レスポンスメッセージ
  MESSAGES: {
    CHECKIN_SUCCESS: '出勤を記録しました。お疲れ様です！',
    CHECKOUT_SUCCESS: '退勤を記録しました。お疲れ様でした！',
    ALREADY_CHECKEDIN: '既に出勤済みです。',
    NOT_CHECKEDIN: 'まだ出勤していません。',
    ERROR: 'エラーが発生しました。管理者にお問い合わせください。',
    UNAUTHORIZED: '認証されていないユーザーです。'
  }
};

/**
 * Webアプリケーションのメインハンドler
 * GETリクエストを処理する
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {HtmlOutput} HTMLレスポンス
 */
function doGet(e) {
  try {
    const page = e.parameter.page || 'staff';
    
    switch (page) {
      case 'admin':
        return getAdminPage(e);
      case 'staff':
      default:
        return getStaffPage(e);
    }
  } catch (error) {
    console.error('doGet Error:', error);
    return HtmlService.createHtmlOutput('<h1>エラーが発生しました</h1><p>管理者にお問い合わせください。</p>');
  }
}

/**
 * WebアプリケーションのPOSTリクエストハンドラ
 * APIエンドポイントとして機能
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} JSONレスポンス
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'checkin':
        return handleCheckin(e);
      case 'checkout':
        return handleCheckout(e);
      case 'getAttendance':
        return handleGetAttendance(e);
      case 'getStaff':
        return handleGetStaff(e);
      default:
        return createJsonResponse({ success: false, message: '不正なアクションです' });
    }
  } catch (error) {
    console.error('doPost Error:', error);
    return createJsonResponse({ success: false, message: 'サーバーエラーが発生しました' });
  }
}

/**
 * スタッフ用画面を返す
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {HtmlOutput} スタッフ用HTML
 */
function getStaffPage(e) {
  try {
    const template = HtmlService.createTemplateFromFile('pwa_app');
    
    // ユーザー情報の取得（実装時にLINE認証情報から取得）
    template.user = {
      name: 'テストユーザー',
      id: 'test_user_001'
    };
    
    const htmlOutput = template.evaluate()
      .setTitle('RepoTomo - 勤怠管理')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    return htmlOutput;
  } catch (error) {
    console.error('getStaffPage Error:', error);
    throw error;
  }
}

/**
 * 管理者用画面を返す
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {HtmlOutput} 管理者用HTML
 */
function getAdminPage(e) {
  try {
    // 管理者認証チェック（実装時）
    if (!isAuthorizedAdmin(e)) {
      return HtmlService.createHtmlOutput('<h1>認証エラー</h1><p>管理者権限が必要です。</p>');
    }
    
    const template = HtmlService.createTemplateFromFile('admin_ui');
    
    const htmlOutput = template.evaluate()
      .setTitle('RepoTomo - 管理者ダッシュボード')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    return htmlOutput;
  } catch (error) {
    console.error('getAdminPage Error:', error);
    throw error;
  }
}

/**
 * 出勤処理
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} JSON レスポンス
 */
function handleCheckin(e) {
  try {
    const userId = e.parameter.userId;
    const timestamp = new Date();
    
    // ユーザー認証
    const staff = getStaffByUserId(userId);
    if (!staff) {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.UNAUTHORIZED });
    }
    
    // 既に出勤済みかチェック
    if (isAlreadyCheckedIn(staff.id, timestamp)) {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ALREADY_CHECKEDIN });
    }
    
    // 出勤記録を保存
    const result = saveAttendanceRecord(staff.id, 'checkin', timestamp);
    
    if (result.success) {
      return createJsonResponse({
        success: true,
        message: CONFIG.MESSAGES.CHECKIN_SUCCESS,
        data: {
          timestamp: Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'HH:mm'),
          staff: staff.name
        }
      });
    } else {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
    }
  } catch (error) {
    console.error('handleCheckin Error:', error);
    return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
  }
}

/**
 * 退勤処理
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} JSON レスポンス
 */
function handleCheckout(e) {
  try {
    const userId = e.parameter.userId;
    const timestamp = new Date();
    
    // ユーザー認証
    const staff = getStaffByUserId(userId);
    if (!staff) {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.UNAUTHORIZED });
    }
    
    // 出勤済みかチェック
    if (!isAlreadyCheckedIn(staff.id, timestamp)) {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.NOT_CHECKEDIN });
    }
    
    // 退勤記録を保存
    const result = saveAttendanceRecord(staff.id, 'checkout', timestamp);
    
    if (result.success) {
      return createJsonResponse({
        success: true,
        message: CONFIG.MESSAGES.CHECKOUT_SUCCESS,
        data: {
          timestamp: Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'HH:mm'),
          staff: staff.name
        }
      });
    } else {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
    }
  } catch (error) {
    console.error('handleCheckout Error:', error);
    return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
  }
}

/**
 * 勤怠データ取得処理
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} JSON レスポンス
 */
function handleGetAttendance(e) {
  try {
    const userId = e.parameter.userId;
    const startDate = e.parameter.startDate || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    const endDate = e.parameter.endDate || startDate;
    
    // ユーザー認証
    const staff = getStaffByUserId(userId);
    if (!staff) {
      return createJsonResponse({ success: false, message: CONFIG.MESSAGES.UNAUTHORIZED });
    }
    
    // 勤怠データ取得
    const attendanceData = getAttendanceData(staff.id, startDate, endDate);
    
    return createJsonResponse({
      success: true,
      data: attendanceData
    });
  } catch (error) {
    console.error('handleGetAttendance Error:', error);
    return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
  }
}

/**
 * スタッフデータ取得処理（管理者用）
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} JSON レスポンス
 */
function handleGetStaff(e) {
  try {
    // 管理者認証チェック
    if (!isAuthorizedAdmin(e)) {
      return createJsonResponse({ success: false, message: '管理者権限が必要です' });
    }
    
    // スタッフデータ取得
    const staffData = getAllStaffData();
    
    return createJsonResponse({
      success: true,
      data: staffData
    });
  } catch (error) {
    console.error('handleGetStaff Error:', error);
    return createJsonResponse({ success: false, message: CONFIG.MESSAGES.ERROR });
  }
}

/**
 * JSON レスポンスを作成
 * 
 * @param {Object} data - レスポンスデータ
 * @return {TextOutput} JSON レスポンス
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 管理者権限チェック
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {boolean} 管理者権限の有無
 */
function isAuthorizedAdmin(e) {
  // TODO: 実際の認証ロジックを実装
  // 現在はテスト用に常にtrueを返す
  return true;
}

/**
 * スプレッドシートのセットアップ
 * 初回実行時にスプレッドシートの構造を作成
 */
function setupSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // スタッフマスタシートの作成
    createStaffMasterSheet(spreadsheet);
    
    // 勤怠データシートの作成
    createAttendanceSheet(spreadsheet);
    
    // 設定シートの作成  
    createSettingsSheet(spreadsheet);
    
    console.log('スプレッドシートのセットアップが完了しました');
  } catch (error) {
    console.error('setupSpreadsheet Error:', error);
    throw error;
  }
}

/**
 * プロパティの初期設定
 * GASプロジェクトの環境変数を設定
 */
function setupProperties() {
  const properties = PropertiesService.getScriptProperties();
  
  // TODO: 実際の値に置き換える
  properties.setProperties({
    'LINE_CHANNEL_ACCESS_TOKEN': 'YOUR_LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET': 'YOUR_LINE_CHANNEL_SECRET',
    'SPREADSHEET_ID': 'YOUR_SPREADSHEET_ID'
  });
  
  console.log('プロパティの設定が完了しました');
}

/**
 * テスト用関数
 * 開発時のテストに使用
 */
function runTests() {
  console.log('=== RepoTomo システムテスト開始 ===');
  
  try {
    // 設定テスト
    console.log('設定テスト:', CONFIG.LINE_CHANNEL_ACCESS_TOKEN ? 'OK' : 'NG');
    
    // スプレッドシート接続テスト
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('スプレッドシート接続テスト:', spreadsheet ? 'OK' : 'NG');
    
    console.log('=== テスト完了 ===');
  } catch (error) {
    console.error('テストエラー:', error);
  }
}