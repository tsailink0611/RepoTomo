/**
 * RepoTomo メインエントリーポイント
 * WebhookとWebアプリのリクエストを処理
 */

/**
 * POSTリクエスト処理（LINE Webhook）
 */
function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const debugSheet = ss.getSheetByName('スタッフマスタ');
  
  try {
    debugSheet.getRange('J1').setValue('1. doPost開始: ' + new Date());
    
    const json = JSON.parse(e.postData.contents);
    const events = json.events || [];
    
    debugSheet.getRange('J2').setValue('2. イベント数: ' + events.length);
    
    if (events.length > 0) {
      const event = events[0];
      debugSheet.getRange('J3').setValue('3. イベントタイプ: ' + event.type);
      debugSheet.getRange('J4').setValue('4. UserID: ' + event.source.userId);
      
      try {
        handleLineEvent(event);
        debugSheet.getRange('J5').setValue('5. handleLineEvent完了');
      } catch(eventError) {
        debugSheet.getRange('J5').setValue('5. handleLineEventエラー: ' + eventError.toString());
      }
    }
    
  } catch(error) {
    debugSheet.getRange('J6').setValue('全体エラー: ' + error.toString());
  }
  
  return ContentService.createTextOutput('OK');
}

/**
 * GETリクエスト処理（Webアプリ）
 */
function doGet(e) {
  const page = e.parameter.page || 'staff';
  const userId = e.parameter.userId;
  
  try {
    let htmlContent;
    
    // HTMLコンテンツの生成
    switch (page) {
      case 'staff':
        htmlContent = getStaffAppHtml(userId);
        break;
      case 'admin':
        htmlContent = getAdminDashboardHtml();
        break;
      default:
        htmlContent = '<h1>ページが見つかりません</h1>';
    }
    
    // デバッグ: 取得したHTMLの最初の100文字を確認
    console.log('HTML content (first 100 chars):', htmlContent ? htmlContent.substring(0, 100) : 'null');
    
    // createHtmlOutputの問題を確認
    try {
      return createHtmlOutput(htmlContent);
    } catch(createError) {
      // createHtmlOutputでエラーが発生した場合
      return HtmlService.createHtmlOutput('<h1>createHtmlOutput エラー: ' + createError.toString() + '</h1>');
    }
    
  } catch (error) {
    console.error('doGet error:', error);
    return HtmlService.createHtmlOutput('<h1>エラーが発生しました</h1><p>' + error.toString() + '</p>');
  }
}

/**
 * 署名検証
 */
function validateSignature(e) {
  const channelSecret = LINE_CONFIG.CHANNEL_SECRET;
  const body = e.postData.contents;
  const signature = e.parameter['x-line-signature'];
  
  const hash = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256,
    body,
    channelSecret
  );
  
  const base64Hash = Utilities.base64Encode(hash);
  return signature === base64Hash;
}

/**
 * JSON出力作成
 */
function createJsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTML出力作成
 */
function createHtmlOutput(html) {
  return HtmlService
    .createHtmlOutput(html)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setTitle(WEB_APP_CONFIG.TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://cdn-icons-png.flaticon.com/512/1055/1055687.png');
}

/**
 * 初期設定（手動実行用）
 */
function setup() {
  // スプレッドシートの権限取得
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  console.log('スプレッドシート名:', ss.getName());
  
  // トリガー設定
  setupTriggers();
  
  console.log('セットアップ完了！');
}

/**
 * トリガー設定
 */
function setupTriggers() {
  // 既存のトリガーを削除
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // 毎日のリマインダー（朝9時）
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  // 毎日のリマインダー（夕方5時）
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .create();
    
  console.log('トリガー設定完了');
}

function testHandleLineEvent() {
  console.log('handleLineEvent存在確認:', typeof handleLineEvent);
  console.log('replyMessage存在確認:', typeof replyMessage);
  console.log('getStaffByLineId存在確認:', typeof getStaffByLineId);
  console.log('getTodayReports存在確認:', typeof getTodayReports);
}

function testWebAppFunctions() {
  console.log('getStaffAppHtml存在確認:', typeof getStaffAppHtml);
  console.log('getAdminDashboardHtml存在確認:', typeof getAdminDashboardHtml);
  
  try {
    const staffHtml = getStaffAppHtml(null);
    console.log('スタッフHTML生成: 成功');
  } catch(e) {
    console.log('スタッフHTMLエラー:', e.toString());
  }
  
  try {
    const adminHtml = getAdminDashboardHtml();
    console.log('管理者HTML生成: 成功');
  } catch(e) {
    console.log('管理者HTMLエラー:', e.toString());
  }
}