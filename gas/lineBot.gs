/**
 * LINE Bot機能
 * メッセージ処理とユーザーインタラクション
 */

/**
 * LINEイベント処理の振り分け
 */
function handleLineEvent(event) {
  switch (event.type) {
    case 'follow':
      handleFollow(event);
      break;
    case 'unfollow':
      handleUnfollow(event);
      break;
    case 'message':
      if (event.message.type === 'text') {
        handleTextMessage(event);
      }
      break;
    case 'postback':
      handlePostback(event);
      break;
  }
}

/**
 * 友だち追加時の処理
 */
function handleFollow(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  
  // プロフィール取得
  const profile = getLineUserProfile(userId);
  
  // スタッフ登録確認
  let staffInfo = getStaffByLineId(userId);
  
  if (!staffInfo) {
    // 新規スタッフとして登録
    const staffId = registerNewStaff(userId, profile.displayName);
    staffInfo = { staffId, name: profile.displayName };
  }
  
  // ウェルカムメッセージ
  const messages = [
    {
      type: 'text',
      text: MESSAGES.WELCOME.GREETING(staffInfo.name)
    },
    {
      type: 'text',
      text: MESSAGES.WELCOME.GUIDE
    },
    createQuickReplyMenu()
  ];
  
  replyMessage(replyToken, messages);
}

/**
 * ブロック時の処理
 */
function handleUnfollow(event) {
  const userId = event.source.userId;
  console.log('ユーザーがブロックしました:', userId);
  // 必要に応じてステータス更新
}

/**
 * テキストメッセージ処理
 */
function handleTextMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();
  const replyToken = event.replyToken;
  
  // スタッフ情報確認
  const staffInfo = getStaffByLineId(userId);
  if (!staffInfo) {
    replyMessage(replyToken, [{
      type: 'text',
      text: MESSAGES.ERROR.NOT_REGISTERED
    }]);
    return;
  }
  
  // キーワードに応じた処理
  if (text.includes('今日') || text.includes('報告書')) {
    showTodayReports(replyToken, staffInfo.staffId);
  } else if (text.includes('ヘルプ') || text === '？' || text === '?') {
    showHelp(replyToken);
  } else if (text.includes('ありがとう')) {
    replyMessage(replyToken, [{
      type: 'text',
      text: 'こちらこそ、いつもお疲れさまです！😊\n何かあればいつでも聞いてくださいね。'
    }]);
  } else if (text.includes('履歴') || text.includes('確認')) {
    showRecentHistory(replyToken, staffInfo.staffId);
  } else {
    // デフォルトレスポンス
    replyMessage(replyToken, [{
      type: 'text',
      text: 'メッセージありがとうございます😊'
    }, createQuickReplyMenu()]);
  }
}

/**
 * Postback処理
 */
function handlePostback(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const data = parsePostbackData(event.postback.data);
  
  const staffInfo = getStaffByLineId(userId);
  if (!staffInfo) return;
  
  switch (data.action) {
    case 'submit':
      handleReportSubmit(replyToken, staffInfo.staffId, data.reportId);
      break;
    case 'help':
      handleReportHelp(replyToken, staffInfo.staffId, data.reportId);
      break;
    case 'history':
      showRecentHistory(replyToken, staffInfo.staffId);
      break;
  }
}

/**
 * 今日の報告書表示
 */
function showTodayReports(replyToken, staffId) {
  const reports = getTodayReports(staffId);
  
  if (reports.length === 0) {
    replyMessage(replyToken, [{
      type: 'text',
      text: '今日提出する報告書はありません！😊\nゆっくり休んでくださいね。'
    }]);
    return;
  }
  
  const messages = [
    {
      type: 'text',
      text: `今日の報告書は${reports.length}件です📋\n無理せず、できる範囲で大丈夫ですよ😊`
    },
    createReportCarousel(reports)
  ];
  
  replyMessage(replyToken, messages);
}

/**
 * 報告書提出処理
 */
function handleReportSubmit(replyToken, staffId, reportId) {
  // 提出記録
  recordSubmission(staffId, reportId, '完了');
  
  // 励ましメッセージ
  const message = MESSAGES.ENCOURAGEMENT[
    Math.floor(Math.random() * MESSAGES.ENCOURAGEMENT.length)
  ];
  
  replyMessage(replyToken, [{
    type: 'text',
    text: message
  }]);
}

/**
 * 相談処理
 */
function handleReportHelp(replyToken, staffId, reportId) {
  // セッション情報を保存（実装は省略）
  
  replyMessage(replyToken, [{
    type: 'text',
    text: 'どんなことでもお気軽に相談してくださいね😊\n\n質問内容を入力して送信してください。'
  }, {
    type: 'text',
    text: '例：\n・書き方がわからない\n・データの場所を教えてほしい\n・締切を延ばしてほしい'
  }]);
}

/**
 * ヘルプ表示
 */
function showHelp(replyToken) {
  const helpMessage = `
📚 RepoTomoの使い方

【基本的な使い方】
1️⃣ 「今日の報告書」
→ 今日提出する報告書を確認

2️⃣ 報告書の提出
→ カードの「✅提出完了」をタップ

3️⃣ 困ったとき
→ 「💬相談」で質問できます

【その他の機能】
・「履歴」→ 最近の提出履歴
・Webアプリでさらに便利に！

何か分からないことがあれば
いつでも聞いてくださいね😊
  `.trim();
  
  replyMessage(replyToken, [{
    type: 'text',
    text: helpMessage
  }]);
}

/**
 * 最近の提出履歴表示
 */
function showRecentHistory(replyToken, staffId) {
  const history = getRecentSubmissions(staffId, 5);
  
  if (history.length === 0) {
    replyMessage(replyToken, [{
      type: 'text',
      text: 'まだ提出履歴がありません。\n最初の報告書、一緒に頑張りましょう！💪'
    }]);
    return;
  }
  
  let historyText = '📋 最近の提出履歴\n\n';
  history.forEach(h => {
    const emoji = h.status === '完了' ? '✅' : '📝';
    historyText += `${emoji} ${h.reportName}\n└ ${h.submittedDate}\n\n`;
  });
  
  replyMessage(replyToken, [{
    type: 'text',
    text: historyText.trim()
  }]);
}

/**
 * クイックリプライメニュー作成
 */
function createQuickReplyMenu() {
  return {
    type: 'text',
    text: '何かお手伝いできることはありますか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📋 今日の報告書',
            text: '今日の報告書'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📊 提出履歴',
            text: '履歴'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '❓ ヘルプ',
            text: 'ヘルプ'
          }
        }
      ]
    }
  };
}

/**
 * 報告書カルーセル作成
 */
function createReportCarousel(reports) {
  const bubbles = reports.map(report => ({
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: report.name,
          weight: 'bold',
          size: 'lg',
          wrap: true
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'icon',
              url: 'https://cdn-icons-png.flaticon.com/512/2838/2838779.png',
              size: 'sm'
            },
            {
              type: 'text',
              text: `${report.deadline}頃まで`,
              size: 'sm',
              color: '#999999',
              margin: 'sm'
            }
          ]
        },
        {
          type: 'text',
          text: '余裕があるときに提出してくださいね',
          size: 'xs',
          color: '#8BC34A',
          margin: 'md',
          wrap: true
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '✅ 提出',
            data: `action=submit&reportId=${report.id}`,
            displayText: `${report.name}を提出しました`
          },
          color: '#4CAF50'
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '💬 相談',
            data: `action=help&reportId=${report.id}`
          }
        }
      ]
    }
  }));
  
  return {
    type: 'flex',
    altText: `本日の報告書（${reports.length}件）`,
    contents: {
      type: 'carousel',
      contents: bubbles
    }
  };
}

/**
 * LINEユーザープロフィール取得
 */
function getLineUserProfile(userId) {
  const url = `${LINE_API.PROFILE}/${userId}`;
  const options = {
    headers: {
      'Authorization': `Bearer ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('Profile fetch error:', code, response.getContentText());
      return { displayName: '名無しさん', userId: userId };
    }
  } catch (e) {
    console.error('Profile fetch exception:', e);
    return { displayName: '名無しさん', userId: userId };
  }
}

/**
 * メッセージ送信
 */
function replyMessage(replyToken, messages) {
  const payload = {
    replyToken: replyToken,
    messages: messages
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(LINE_API.REPLY, options);
    const code = response.getResponseCode();
    
    if (code !== 200) {
      console.error('Reply error:', code, response.getContentText());
    }
  } catch (e) {
    console.error('Reply exception:', e);
  }
}

/**
 * プッシュメッセージ送信
 */
function pushMessage(userId, messages) {
  const payload = {
    to: userId,
    messages: messages
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(LINE_API.PUSH, options);
    const code = response.getResponseCode();
    
    if (code !== 200) {
      console.error('Push error:', code, response.getContentText());
    }
    return code === 200;
  } catch (e) {
    console.error('Push exception:', e);
    return false;
  }
}

/**
 * Postbackデータパース
 */
function parsePostbackData(dataString) {
  const params = {};
  dataString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[key] = decodeURIComponent(value);
  });
  return params;
}