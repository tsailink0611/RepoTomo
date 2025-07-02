/**
 * データベース管理
 * Googleスプレッドシートとの連携
 */

/**
 * スプレッドシート取得
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * スタッフ登録（新規）
 */
function registerNewStaff(lineUserId, name, role = 'スタッフ', store = '未設定') {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.STAFF);
  const lastRow = sheet.getLastRow();
  
  // スタッフID生成
  const staffId = 'S' + String(lastRow).padStart(3, '0');
  
  // タイムスタンプ
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  
  // データ追加
  sheet.appendRow([staffId, name, lineUserId, role, store, timestamp]);
  
  console.log('新規スタッフ登録:', staffId, name);
  return staffId;
}

/**
 * LINE UserIDでスタッフ検索
 */
function getStaffByLineId(lineUserId) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.STAFF);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const [staffId, name, lineId, role, store] = data[i];
    if (lineId === lineUserId) {
      return {
        staffId: staffId,
        name: name,
        lineUserId: lineId,
        role: role,
        store: store
      };
    }
  }
  return null;
}

/**
 * スタッフIDで検索
 */
function getStaffById(staffId) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.STAFF);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === staffId) {
      return {
        staffId: data[i][0],
        name: data[i][1],
        lineUserId: data[i][2],
        role: data[i][3],
        store: data[i][4]
      };
    }
  }
  return null;
}

/**
 * 今日の報告書取得
 */
function getTodayReports(staffId) {
  const staffInfo = getStaffById(staffId);
  if (!staffInfo) return [];
  
  const sheet = getSpreadsheet().getSheetByName(SHEETS.REPORTS);
  const reports = sheet.getDataRange().getValues();
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=日曜
  const todayReports = [];
  
  // ヘッダーをスキップ
  for (let i = 1; i < reports.length; i++) {
    const [id, name, frequency, deadlineDay, deadlineTime, targetRoles, reminder, active] = reports[i];
    
    // 無効な報告書はスキップ
    if (!active || active === 'FALSE') continue;
    
    // 対象役職チェック
    if (targetRoles !== 'all' && !targetRoles.includes(staffInfo.role)) {
      continue;
    }
    
    // 頻度チェック
    let shouldInclude = false;
    
    switch (frequency) {
      case 'daily':
        shouldInclude = true;
        break;
      case 'weekly':
        // 曜日を調整（スプレッドシートは1=月曜）
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        shouldInclude = (Number(deadlineDay) === adjustedDay);
        break;
      case 'monthly':
        // 月末チェック
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        shouldInclude = (tomorrow.getMonth() !== today.getMonth());
        break;
    }
    
    if (shouldInclude) {
      todayReports.push({
        id: id,
        name: name,
        deadline: deadlineTime || '本日中'
      });
    }
  }
  
  return todayReports;
}

/**
 * 報告書提出記録
 */
function recordSubmission(staffId, reportId, status = '完了', question = '', comment = '') {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.HISTORY);
  const submissionId = 'H' + Utilities.getUuid().substring(0, 8);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd');
  const timeStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  
  sheet.appendRow([
    submissionId,
    staffId,
    reportId,
    dateStr,
    timeStr,
    status,
    question,
    comment
  ]);
  
  console.log('提出記録:', submissionId, staffId, reportId, status);
  return submissionId;
}

/**
 * 最近の提出履歴取得
 */
function getRecentSubmissions(staffId, limit = 10) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.HISTORY);
  const data = sheet.getDataRange().getValues();
  const reportSheet = getSpreadsheet().getSheetByName(SHEETS.REPORTS);
  const reportData = reportSheet.getDataRange().getValues();
  
  // 報告書名のマップ作成
  const reportMap = {};
  for (let i = 1; i < reportData.length; i++) {
    reportMap[reportData[i][0]] = reportData[i][1];
  }
  
  // スタッフの履歴を抽出
  const submissions = [];
  for (let i = data.length - 1; i >= 1 && submissions.length < limit; i--) {
    if (data[i][1] === staffId) {
      submissions.push({
        submissionId: data[i][0],
        reportId: data[i][2],
        reportName: reportMap[data[i][2]] || '不明な報告書',
        submittedDate: data[i][4] || data[i][3],
        status: data[i][5]
      });
    }
  }
  
  return submissions;
}

/**
 * 提出状況サマリー取得（管理者用）
 */
function getSubmissionSummary(date = new Date()) {
  const dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');
  const historySheet = getSpreadsheet().getSheetByName(SHEETS.HISTORY);
  const reportSheet = getSpreadsheet().getSheetByName(SHEETS.REPORTS);
  const staffSheet = getSpreadsheet().getSheetByName(SHEETS.STAFF);
  
  const historyData = historySheet.getDataRange().getValues();
  const reportData = reportSheet.getDataRange().getValues();
  const staffData = staffSheet.getDataRange().getValues();
  
  // 当日の提出状況を集計
  const summary = {
    date: dateStr,
    totalStaff: staffData.length - 1,
    reports: {},
    questions: [],
    overdue: []
  };
  
  // 報告書ごとの集計
  for (let i = 1; i < reportData.length; i++) {
    const reportId = reportData[i][0];
    const reportName = reportData[i][1];
    
    summary.reports[reportId] = {
      name: reportName,
      submitted: 0,
      pending: 0,
      questions: 0
    };
  }
  
  // 提出履歴から集計
  for (let i = 1; i < historyData.length; i++) {
    if (historyData[i][3] === dateStr) {
      const reportId = historyData[i][2];
      const status = historyData[i][5];
      const question = historyData[i][6];
      
      if (summary.reports[reportId]) {
        if (status === '完了') {
          summary.reports[reportId].submitted++;
        }
        if (question) {
          summary.reports[reportId].questions++;
          summary.questions.push({
            staffId: historyData[i][1],
            reportId: reportId,
            question: question,
            time: historyData[i][4]
          });
        }
      }
    }
  }
  
  return summary;
}

/**
 * スタッフ一覧取得
 */
function getAllStaff() {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.STAFF);
  const data = sheet.getDataRange().getValues();
  const staff = [];
  
  for (let i = 1; i < data.length; i++) {
    staff.push({
      staffId: data[i][0],
      name: data[i][1],
      lineUserId: data[i][2],
      role: data[i][3],
      store: data[i][4],
      registeredDate: data[i][5]
    });
  }
  
  return staff;
}

/**
 * デバッグ用：データベース状態確認
 */
function debugDatabase() {
  const ss = getSpreadsheet();
  console.log('スプレッドシート名:', ss.getName());
  
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    console.log(`シート: ${sheet.getName()}, 行数: ${sheet.getLastRow()}`);
  });
  
  const staff = getAllStaff();
  console.log('登録スタッフ数:', staff.length);
  
  const today = new Date();
  const summary = getSubmissionSummary(today);
  console.log('本日のサマリー:', summary);
}