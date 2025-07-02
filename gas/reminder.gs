/**
 * リマインダー機能
 * 定期的な通知とフォローアップ
 */

/**
 * 毎日のリマインダー送信（トリガーから実行）
 */
function sendDailyReminders() {
  console.log('リマインダー処理開始:', new Date());
  
  const staff = getAllStaff();
  const today = new Date();
  const hour = today.getHours();
  
  let sentCount = 0;
  
  staff.forEach(staffMember => {
    if (!staffMember.lineUserId) return;
    
    const reports = getTodayReports(staffMember.staffId);
    const unsubmitted = getUnsubmittedReports(staffMember.staffId, reports);
    
    if (unsubmitted.length > 0) {
      // 時間帯に応じたメッセージを選択
      const message = createReminderMessage(unsubmitted, hour);
      
      if (pushMessage(staffMember.lineUserId, [message])) {
        sentCount++;
      }
    }
  });
  
  console.log(`リマインダー送信完了: ${sentCount}件`);
}

/**
 * 未提出の報告書を取得
 */
function getUnsubmittedReports(staffId, todayReports) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.HISTORY);
  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
  
  // 今日提出済みの報告書IDを取得
  const submittedIds = new Set();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === staffId && 
        data[i][3] === today && 
        data[i][5] === '完了') {
      submittedIds.add(data[i][2]);
    }
  }
  
  // 未提出の報告書をフィルタ
  return todayReports.filter(report => !submittedIds.has(report.id));
}

/**
 * リマインダーメッセージ作成
 */
function createReminderMessage(reports, hour) {
  let greeting, tone;
  
  // 時間帯に応じた挨拶
  if (hour < 12) {
    greeting = 'おはようございます☀️';
    tone = 'gentle';
  } else if (hour < 17) {
    greeting = 'こんにちは😊';
    tone = 'normal';
  } else {
    greeting = 'お疲れさまです🌙';
    tone = 'veryGentle';
  }
  
  // メッセージ本文
  let text = `${greeting}\n\n`;
  
  if (reports.length === 1) {
    text += `今日は「${reports[0].name}」の提出予定日です📋\n\n`;
    text += 'お時間あるときに提出いただければ大丈夫です。';
  } else {
    text += `今日の報告書が${reports.length}件あります📋\n\n`;
    reports.forEach(r => {
      text += `・${r.name}\n`;
    });
    text += '\n無理のない範囲で提出してくださいね。';
  }
  
  // 締切が近い場合の追加メッセージ
  const hasUrgent = reports.some(r => {
    const deadline = parseInt(r.deadline.replace(/[^0-9]/g, ''));
    return deadline && hour >= deadline - 2;
  });
  
  if (hasUrgent && hour >= 15) {
    text += '\n\n💡 もし今日が難しそうでしたら、遠慮なく相談してくださいね。';
  }
  
  return {
    type: 'text',
    text: text
  };
}

/**
 * 週次レポート生成（管理者向け）
 */
function generateWeeklyReport() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const report = {
    period: `${formatDate(startDate)} 〜 ${formatDate(endDate)}`,
    totalSubmissions: 0,
    submissionRate: 0,
    topPerformers: [],
    needsSupport: [],
    questions: []
  };
  
  // データ収集と分析（実装省略）
  
  // 管理者にメール送信
  sendWeeklyReportEmail(report);
  
  console.log('週次レポート生成完了');
}

/**
 * フォローアップリマインダー
 */
function sendFollowUpReminders() {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.HISTORY);
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  // 質問があって24時間以上経過した案件を抽出
  for (let i = 1; i < data.length; i++) {
    const question = data[i][6];
    const adminComment = data[i][7];
    const submittedTime = new Date(data[i][4]);
    
    if (question && !adminComment) {
      const hoursPassed = (now - submittedTime) / (1000 * 60 * 60);
      
      if (hoursPassed > 24) {
        // 管理者に通知
        console.log('要対応:', data[i][0], question);
      }
    }
  }
}

/**
 * 励ましメッセージ送信（ランダムタイミング）
 */
function sendEncouragementMessage() {
  const encouragements = [
    '今週もお疲れさまでした！😊\n報告書の提出、いつもありがとうございます。',
    '毎日の報告書提出、本当に助かっています✨\nこれからもよろしくお願いします！',
    'いつも期限内の提出ありがとうございます🌟\n何か困ったことがあれば遠慮なく相談してくださいね。'
  ];
  
  // 優秀なスタッフを選出
  const topStaff = getTopPerformers();
  
  topStaff.forEach(staff => {
    if (staff.lineUserId && Math.random() > 0.7) { // 30%の確率で送信
      const message = encouragements[Math.floor(Math.random() * encouragements.length)];
      pushMessage(staff.lineUserId, [{
        type: 'text',
        text: message
      }]);
    }
  });
}

/**
 * 優秀なスタッフを取得
 */
function getTopPerformers(days = 7) {
  // 実装省略：過去N日間の提出率が高いスタッフを返す
  return [];
}

/**
 * 日付フォーマット
 */
function formatDate(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');
}

/**
 * 管理者へのメール送信
 */
function sendWeeklyReportEmail(report) {
  // 実装省略：MailApp.sendEmailを使用
}