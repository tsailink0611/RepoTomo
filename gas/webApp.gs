/**
 * Webアプリケーション機能
 * スタッフ用と管理者用のHTML生成
 */

/**
 * スタッフ用アプリHTML生成
 */
function getStaffAppHtml(userId) {
  let staffInfo = null;
  
  if (userId) {
    staffInfo = getStaffByLineId(userId);
  }
  
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#7c9fdb">
    <title>RepoTomo - 報告書管理</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            color: #333;
            line-height: 1.7;
            padding-bottom: 80px;
        }
        
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18px;
            color: #666;
        }
        
        .app-container {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .header {
            background: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #5c6bc0;
        }
        
        .encouragement {
            background: #fff8e1;
            border-radius: 12px;
            padding: 15px;
            margin: 20px;
            text-align: center;
            color: #f57c00;
        }
        
        .content {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .report-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
        }
        
        .report-card.today {
            border: 2px solid #ffb74d;
            background: #fff8e1;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #4CAF50;
            color: white;
        }
        
        .btn-secondary {
            background: #e3f2fd;
            color: #1976d2;
        }
        
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-around;
            padding: 10px 0;
        }
        
        .nav-item {
            text-align: center;
            padding: 5px;
            color: #9e9e9e;
            text-decoration: none;
            font-size: 12px;
        }
        
        .nav-item.active {
            color: #5c6bc0;
        }
    </style>
</head>
<body>
    <div class="loading">読み込み中...</div>
    
    <div class="app-container">
        <header class="header">
            <div class="greeting" id="greeting">こんにちは！</div>
            <div id="date"></div>
        </header>
        
        <div class="encouragement" id="encouragement">
            今日も一日お疲れさまです！😊
        </div>
        
        <div class="content">
            <div id="reports-container"></div>
        </div>
        
        <nav class="bottom-nav">
            <a href="#" class="nav-item active">
                <div>🏠</div>
                <div>ホーム</div>
            </a>
            <a href="#history" class="nav-item">
                <div>📊</div>
                <div>履歴</div>
            </a>
            <a href="#help" class="nav-item">
                <div>💡</div>
                <div>ヘルプ</div>
            </a>
        </nav>
    </div>
    
    <script>
        const staffInfo = ${staffInfo ? JSON.stringify(staffInfo) : 'null'};
        
        window.onload = function() {
            initializeApp();
        };
        
        function initializeApp() {
            if (!staffInfo) {
                showLoginPrompt();
                return;
            }
            
            updateGreeting();
            loadTodayReports();
            document.querySelector('.loading').style.display = 'none';
            document.querySelector('.app-container').style.display = 'block';
        }
        
        function updateGreeting() {
            const now = new Date();
            const hour = now.getHours();
            let greeting = '';
            
            if (hour < 12) greeting = 'おはようございます';
            else if (hour < 18) greeting = 'こんにちは';
            else greeting = 'お疲れさまです';
            
            document.getElementById('greeting').textContent = 
                greeting + '、' + staffInfo.name + 'さん！';
            
            document.getElementById('date').textContent = 
                now.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                });
        }
        
        function loadTodayReports() {
            google.script.run
                .withSuccessHandler(displayReports)
                .withFailureHandler(handleError)
                .getTodayReports(staffInfo.staffId);
        }
        
        function displayReports(reports) {
            const container = document.getElementById('reports-container');
            
            if (reports.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#666;">今日の報告書はありません 🎉</p>';
                return;
            }
            
            container.innerHTML = reports.map(report => 
                '<div class="report-card today">' +
                '<h3>' + report.name + '</h3>' +
                '<p>締切: ' + report.deadline + '</p>' +
                '<div style="display:flex; gap:10px; margin-top:15px;">' +
                '<button class="btn btn-primary" onclick="submitReport(\\'' + report.id + '\\')">✅ 提出完了</button>' +
                '<button class="btn btn-secondary" onclick="askQuestion(\\'' + report.id + '\\')">💬 相談する</button>' +
                '</div>' +
                '</div>'
            ).join('');
        }
        
        function submitReport(reportId) {
            if (confirm('この報告書を提出済みにしますか？')) {
                google.script.run
                    .withSuccessHandler(() => {
                        alert('提出を記録しました！お疲れさまでした 😊');
                        loadTodayReports();
                    })
                    .withFailureHandler(handleError)
                    .recordSubmission(staffInfo.staffId, reportId, '完了');
            }
        }
        
        function askQuestion(reportId) {
            const question = prompt('どんなことでも気軽に質問してください：');
            if (question) {
                google.script.run
                    .withSuccessHandler(() => {
                        alert('質問を送信しました。管理者から返信があります 📨');
                    })
                    .withFailureHandler(handleError)
                    .recordSubmission(staffInfo.staffId, reportId, '質問', question);
            }
        }
        
        function showLoginPrompt() {
            document.querySelector('.loading').innerHTML = 
                '<div style="text-align:center;">' +
                '<p>LINEから開いてください</p>' +
                '<p style="margin-top:10px; font-size:14px; color:#666;">または管理者にお問い合わせください</p>' +
                '</div>';
        }
        
        function handleError(error) {
            console.error(error);
            alert('エラーが発生しました。もう一度お試しください。');
        }
    </script>
</body>
</html>
  `;
  
  return html;
}

/**
 * 管理者ダッシュボードHTML生成
 */
function getAdminDashboardHtml() {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RepoTomo - 管理者ダッシュボード</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .dashboard-header {
            background: white;
            padding: 20px 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .header-title {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        
        .priority-section {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .priority-title {
            font-size: 18px;
            font-weight: 600;
            color: #856404;
            margin-bottom: 15px;
        }
        
        .priority-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #27ae60;
        }
        
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-success {
            background: #27ae60;
            color: white;
        }
        
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f8f9fa;
            padding: 16px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 16px;
            border-top: 1px solid #f0f0f0;
        }
    </style>
</head>
<body>
    <header class="dashboard-header">
        <h1 class="header-title">📊 RepoTomo 管理ダッシュボード</h1>
    </header>
    
    <div class="container">
        <!-- 優先対応エリア -->
        <div class="priority-section" id="priority-section">
            <h2 class="priority-title">⚡ 対応が必要な案件</h2>
            <div id="priority-items">読み込み中...</div>
        </div>
        
        <!-- 統計情報 -->
        <div class="stats-grid" id="stats-grid">
            <div class="stat-card">
                <div class="stat-number" id="submission-rate">-</div>
                <div class="stat-label">本日の提出率</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="pending-questions">-</div>
                <div class="stat-label">未回答の質問</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-staff">-</div>
                <div class="stat-label">登録スタッフ数</div>
            </div>
        </div>
        
        <!-- 報告書別状況 -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>報告書名</th>
                        <th>提出済み</th>
                        <th>未提出</th>
                        <th>提出率</th>
                        <th>アクション</th>
                    </tr>
                </thead>
                <tbody id="reports-table">
                    <tr><td colspan="5" style="text-align:center;">読み込み中...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            // 管理者画面では認証チェックをスキップして直接データ読み込み
            loadDashboardData();
            setInterval(loadDashboardData, 30000); // 30秒ごとに更新
        };
        
        function loadDashboardData() {
            google.script.run
                .withSuccessHandler(updateDashboard)
                .withFailureHandler(handleError)
                .getSubmissionSummary();
                
            google.script.run
                .withSuccessHandler(updateStaffCount)
                .getAllStaff();
        }
        
        function updateDashboard(summary) {
            // 優先対応案件
            const priorityContainer = document.getElementById('priority-items');
            if (summary.questions.length === 0) {
                priorityContainer.innerHTML = '<p style="color:#666;">対応が必要な案件はありません ✨</p>';
            } else {
                priorityContainer.innerHTML = summary.questions.map(q => 
                    '<div class="priority-item">' +
                    '<div>' +
                    '<strong>' + q.staffId + '</strong> - ' + q.reportId + '<br>' +
                    '<span style="color:#666;">' + q.question + '</span>' +
                    '</div>' +
                    '<button class="btn btn-primary" onclick="replyToQuestion(' + "'" + q.staffId + "'" + ')">返信</button>' +
                    '</div>'
                ).join('');
            }
            
            // 統計更新
            let totalSubmitted = 0;
            let totalExpected = 0;
            
            const tableBody = document.getElementById('reports-table');
            const rows = [];
            
            for (const [reportId, data] of Object.entries(summary.reports)) {
                totalSubmitted += data.submitted;
                totalExpected += data.submitted + data.pending;
                
                const rate = totalExpected > 0 ? 
                    Math.round((data.submitted / totalExpected) * 100) : 0;
                
                rows.push(
                    '<tr>' +
                    '<td>' + data.name + '</td>' +
                    '<td>' + data.submitted + '</td>' +
                    '<td>' + data.pending + '</td>' +
                    '<td>' + rate + '%</td>' +
                    '<td><button class="btn btn-success" onclick="sendReminder(' + "'" + reportId + "'" + ')">リマインド</button></td>' +
                    '</tr>'
                );
            }
            
            tableBody.innerHTML = rows.join('');
            
            // 全体の提出率
            const overallRate = totalExpected > 0 ? 
                Math.round((totalSubmitted / totalExpected) * 100) : 0;
            document.getElementById('submission-rate').textContent = overallRate + '%';
            
            // 未回答の質問数
            document.getElementById('pending-questions').textContent = summary.questions.length;
        }
        
        function updateStaffCount(staff) {
            document.getElementById('total-staff').textContent = staff.length;
        }
        
        function replyToQuestion(staffId) {
            const reply = prompt('返信内容を入力してください：');
            if (reply) {
                // 実装: 返信を送信
                alert('返信を送信しました');
                loadDashboardData();
            }
        }
        
        function sendReminder(reportId) {
            if (confirm('未提出者にリマインダーを送信しますか？')) {
                // 実装: リマインダー送信
                alert('リマインダーを送信しました');
            }
        }
        
        function handleError(error) {
            console.error(error);
            alert('データの読み込みに失敗しました');
        }
    <\/script>
</body>
</html>
  `;
  
  return html;
}

/**
 * スタッフ一覧ページ（管理者用）
 */
function getStaffListHtml() {
  // 実装省略
  return '<h1>スタッフ一覧</h1>';
}

/**
 * レポート詳細ページ
 */
function getReportDetailHtml(reportId) {
  // 実装省略
  return '<h1>レポート詳細</h1>';
}