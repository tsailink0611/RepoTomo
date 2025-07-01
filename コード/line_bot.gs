/**
 * RepoTomo - LINE Bot処理
 * LINE Messaging APIとの連携処理を担当
 * 
 * @author RepoTomo Development Team
 * @version 1.0.0
 */

/**
 * LINE Bot Webhook エンドポイント
 * LINEプラットフォームからのリクエストを処理
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {TextOutput} レスポンス
 */
function doPost(e) {
  try {
    // リクエストの検証
    if (!verifyLineSignature(e)) {
      console.error('Invalid LINE signature');
      return ContentService.createTextOutput('Unauthorized').setStatusCode(401);
    }
    
    // リクエストボディをパース
    const events = JSON.parse(e.postData.contents).events;
    
    // 各イベントを処理
    for (const event of events) {
      handleLineEvent(event);
    }
    
    return ContentService.createTextOutput('OK');
  } catch (error) {
    console.error('LINE Webhook Error:', error);
    return ContentService.createTextOutput('Error').setStatusCode(500);
  }
}

/**
 * LINE署名の検証
 * 
 * @param {Object} e - イベントオブジェクト
 * @return {boolean} 署名の妥当性
 */
function verifyLineSignature(e) {
  try {
    const channelSecret = CONFIG.LINE_CHANNEL_SECRET;
    const signature = e.parameter['X-Line-Signature'] || e.postData.headers['X-Line-Signature'];
    const body = e.postData.contents;
    
    if (!signature || !body) {
      return false;
    }
    
    const hash = Utilities.computeHmacSha256Signature(body, channelSecret);
    const expectedSignature = 'sha256=' + Utilities.base64Encode(hash);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * LINEイベントの処理
 * 
 * @param {Object} event - LINEイベント
 */
function handleLineEvent(event) {
  try {
    switch (event.type) {
      case 'message':
        handleMessageEvent(event);
        break;
      case 'postback':
        handlePostbackEvent(event);
        break;
      case 'follow':
        handleFollowEvent(event);
        break;
      case 'unfollow':
        handleUnfollowEvent(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Event handling error:', error);
  }
}

/**
 * メッセージイベントの処理
 * 
 * @param {Object} event - メッセージイベント
 */
function handleMessageEvent(event) {
  const userId = event.source.userId;
  const messageText = event.message.text;
  
  // スタッフ情報の取得
  const staff = getStaffByLineUserId(userId);
  if (!staff) {
    replyMessage(event.replyToken, createUnregisteredUserMessage());
    return;
  }
  
  // メッセージの内容に応じて処理を分岐
  const command = parseCommand(messageText);
  
  switch (command.action) {
    case 'checkin':
      handleCheckinCommand(event, staff);
      break;
    case 'checkout':
      handleCheckoutCommand(event, staff);
      break;
    case 'status':
      handleStatusCommand(event, staff);
      break;
    case 'history':
      handleHistoryCommand(event, staff);
      break;
    case 'help':
      handleHelpCommand(event, staff);
      break;
    default:
      handleUnknownCommand(event, staff);
  }
}

/**
 * ポストバックイベントの処理
 * 
 * @param {Object} event - ポストバックイベント
 */
function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const postbackData = JSON.parse(event.postback.data);
  
  const staff = getStaffByLineUserId(userId);
  if (!staff) {
    replyMessage(event.replyToken, createUnregisteredUserMessage());
    return;
  }
  
  switch (postbackData.action) {
    case 'quick_checkin':
      handleCheckinCommand(event, staff);
      break;
    case 'quick_checkout':
      handleCheckoutCommand(event, staff);
      break;
    case 'view_today':
      handleTodayCommand(event, staff);
      break;
    default:
      console.log('Unknown postback action:', postbackData.action);
  }
}

/**
 * フォローイベントの処理
 * 
 * @param {Object} event - フォローイベント
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  
  // ウェルカムメッセージを送信
  const welcomeMessage = createWelcomeMessage();
  replyMessage(event.replyToken, welcomeMessage);
  
  // リッチメニューを設定
  setRichMenu(userId);
}

/**
 * アンフォローイベントの処理
 * 
 * @param {Object} event - アンフォローイベント
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  console.log('User unfollowed:', userId);
  
  // 必要に応じてクリーンアップ処理
}

/**
 * 出勤コマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleCheckinCommand(event, staff) {
  try {
    const timestamp = new Date();
    
    // 既に出勤済みかチェック
    if (isAlreadyCheckedIn(staff.id, timestamp)) {
      const message = createAlreadyCheckedInMessage(staff);
      replyMessage(event.replyToken, message);
      return;
    }
    
    // 出勤記録を保存
    const result = saveAttendanceRecord(staff.id, 'checkin', timestamp);
    
    if (result.success) {
      const message = createCheckinSuccessMessage(staff, timestamp);
      replyMessage(event.replyToken, message);
    } else {
      const message = createErrorMessage();
      replyMessage(event.replyToken, message);
    }
  } catch (error) {
    console.error('Checkin command error:', error);
    replyMessage(event.replyToken, createErrorMessage());
  }
}

/**
 * 退勤コマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleCheckoutCommand(event, staff) {
  try {
    const timestamp = new Date();
    
    // 出勤済みかチェック
    if (!isAlreadyCheckedIn(staff.id, timestamp)) {
      const message = createNotCheckedInMessage();
      replyMessage(event.replyToken, message);
      return;
    }
    
    // 退勤記録を保存
    const result = saveAttendanceRecord(staff.id, 'checkout', timestamp);
    
    if (result.success) {
      const message = createCheckoutSuccessMessage(staff, timestamp);
      replyMessage(event.replyToken, message);
    } else {
      const message = createErrorMessage();
      replyMessage(event.replyToken, message);
    }
  } catch (error) {
    console.error('Checkout command error:', error);
    replyMessage(event.replyToken, createErrorMessage());
  }
}

/**
 * ステータスコマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleStatusCommand(event, staff) {
  try {
    const todayData = getTodayAttendanceData(staff.id);
    const message = createStatusMessage(staff, todayData);
    replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('Status command error:', error);
    replyMessage(event.replyToken, createErrorMessage());
  }
}

/**
 * 履歴コマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleHistoryCommand(event, staff) {
  try {
    const historyData = getRecentAttendanceHistory(staff.id, 7); // 直近7日間
    const message = createHistoryMessage(staff, historyData);
    replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('History command error:', error);
    replyMessage(event.replyToken, createErrorMessage());
  }
}

/**
 * ヘルプコマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleHelpCommand(event, staff) {
  const message = createHelpMessage();
  replyMessage(event.replyToken, message);
}

/**
 * 不明なコマンドの処理
 * 
 * @param {Object} event - LINEイベント
 * @param {Object} staff - スタッフ情報
 */
function handleUnknownCommand(event, staff) {
  const message = createUnknownCommandMessage();
  replyMessage(event.replyToken, message);
}

/**
 * コマンドの解析
 * 
 * @param {string} messageText - メッセージテキスト
 * @return {Object} パースされたコマンド
 */
function parseCommand(messageText) {
  const text = messageText.toLowerCase().trim();
  
  // キーワードマッピング
  const commandMap = {
    '出勤': 'checkin',
    '退勤': 'checkout',
    'ステータス': 'status',
    '状況': 'status',
    '履歴': 'history',
    'ヘルプ': 'help',
    'help': 'help'
  };
  
  for (const [keyword, action] of Object.entries(commandMap)) {
    if (text.includes(keyword)) {
      return { action, keyword };
    }
  }
  
  return { action: 'unknown', keyword: null };
}

/**
 * LINEメッセージの送信
 * 
 * @param {string} replyToken - リプライトークン
 * @param {Object} message - メッセージオブジェクト
 */
function replyMessage(replyToken, message) {
  try {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    
    const payload = {
      replyToken: replyToken,
      messages: Array.isArray(message) ? message : [message]
    };
    
    const options = {
      method: 'POST',
      headers: headers,
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    console.log('LINE API Response:', response.getContentText());
  } catch (error) {
    console.error('Reply message error:', error);
  }
}

/**
 * プッシュメッセージの送信
 * 
 * @param {string} userId - LINE ユーザーID
 * @param {Object} message - メッセージオブジェクト
 */
function pushMessage(userId, message) {
  try {
    const url = 'https://api.line.me/v2/bot/message/push';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    
    const payload = {
      to: userId,
      messages: Array.isArray(message) ? message : [message]
    };
    
    const options = {
      method: 'POST',
      headers: headers,
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    console.log('LINE Push API Response:', response.getContentText());
  } catch (error) {
    console.error('Push message error:', error);
  }
}

/**
 * リッチメニューの設定
 * 
 * @param {string} userId - LINE ユーザーID
 */
function setRichMenu(userId) {
  try {
    // TODO: リッチメニューの実装
    console.log('Setting rich menu for user:', userId);
  } catch (error) {
    console.error('Rich menu error:', error);
  }
}

/**
 * 定期的なリマインダー送信
 * GASのトリガーから実行される
 */
function sendDailyReminders() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 朝9時のリマインダー
    if (currentHour === 9) {
      sendMorningReminders();
    }
    
    // 夕方6時のリマインダー
    if (currentHour === 18) {
      sendEveningReminders();
    }
  } catch (error) {
    console.error('Daily reminders error:', error);
  }
}

/**
 * 朝のリマインダー送信
 */
function sendMorningReminders() {
  try {
    const staff = getAllActiveStaff();
    
    staff.forEach(member => {
      if (member.lineUserId && !isAlreadyCheckedIn(member.id, new Date())) {
        const message = createMorningReminderMessage(member);
        pushMessage(member.lineUserId, message);
      }
    });
  } catch (error) {
    console.error('Morning reminders error:', error);
  }
}

/**
 * 夕方のリマインダー送信
 */
function sendEveningReminders() {
  try {
    const staff = getAllActiveStaff();
    
    staff.forEach(member => {
      if (member.lineUserId && isAlreadyCheckedIn(member.id, new Date())) {
        const message = createEveningReminderMessage(member);
        pushMessage(member.lineUserId, message);
      }
    });
  } catch (error) {
    console.error('Evening reminders error:', error);
  }
}

/**
 * Webhook URLの設定
 * LINE Developers コンソールで設定するWebhook URLを取得
 */
function getWebhookUrl() {
  const webAppUrl = ScriptApp.getService().getUrl();
  console.log('Webhook URL:', webAppUrl);
  return webAppUrl;
}