// LINE Bot 基本設定ファイル
// このファイルはGoogle Apps Scriptプロジェクトで使用します

// LINE Bot設定
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
const LINE_CHANNEL_SECRET = 'YOUR_CHANNEL_SECRET_HERE';

// Spreadsheet設定
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// LINE Webhook処理
function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    const events = json.events;
    
    events.forEach(event => {
      if (event.type === 'message' && event.message.type === 'text') {
        handleTextMessage(event);
      }
    });
    
    return ContentService.createTextOutput('OK');
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput('Error');
  }
}

// テキストメッセージ処理
function handleTextMessage(event) {
  const userMessage = event.message.text;
  const userId = event.source.userId;
  
  // メッセージに応じた処理
  if (userMessage.includes('報告')) {
    sendReportPrompt(userId);
  } else {
    sendDefaultResponse(userId);
  }
}

// 報告書入力促進メッセージ
function sendReportPrompt(userId) {
  const message = {
    type: 'text',
    text: 'お疲れさまです！📝\n今日の報告書はこちらから入力できます。\n\n' +
          'ウェブアプリURL: [ここにウェブアプリURLを設定]'
  };
  
  sendLineMessage(userId, message);
}

// デフォルト応答
function sendDefaultResponse(userId) {
  const message = {
    type: 'text',
    text: 'こんにちは！👋\nRepoTomoです。\n\n' +
          '「報告」と送信すると報告書入力画面をご案内します。'
  };
  
  sendLineMessage(userId, message);
}

// LINE メッセージ送信
function sendLineMessage(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
  };
  
  const payload = {
    to: userId,
    messages: [message]
  };
  
  const options = {
    method: 'POST',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(url, options);
}