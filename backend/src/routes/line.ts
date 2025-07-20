import express from 'express';
import { Client, ClientConfig, MiddlewareConfig, middleware, WebhookEvent, MessageEvent, FollowEvent, UnfollowEvent, PostbackEvent } from '@line/bot-sdk';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// LINE Bot設定
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  console.error('❌ LINE Bot credentials not found in environment variables');
  throw new Error('LINE Bot credentials missing');
}

const clientConfig: ClientConfig = {
  channelAccessToken
};

const middlewareConfig: MiddlewareConfig = {
  channelSecret
};

const client = new Client(clientConfig);

// メッセージテンプレート
const MESSAGES = {
  WELCOME: {
    GREETING: (name: string) => `${name}さん、RepoTomoへようこそ！🎉\n\n報告書の提出がとっても簡単になりますよ😊`,
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

// LINE Webhook エンドポイント
router.post('/webhook', middleware(middlewareConfig), async (req, res) => {
  try {
    const events: WebhookEvent[] = req.body.events;

    const results = await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          switch (event.type) {
            case 'follow':
              return await handleFollow(event);
            case 'unfollow':
              return await handleUnfollow(event);
            case 'message':
              if (event.message.type === 'text') {
                return await handleTextMessage(event);
              }
              break;
            case 'postback':
              return await handlePostback(event);
          }
        } catch (err) {
          console.error('Event processing error:', err);
          return null;
        }
      })
    );

    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 友だち追加時の処理
async function handleFollow(event: FollowEvent) {
  const userId = event.source.userId;
  if (!userId) return;
  const replyToken = event.replyToken;

  try {
    // プロフィール取得
    const profile = await client.getProfile(userId);
    
    // スタッフ登録確認
    let staff = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!staff) {
      // 新規スタッフとして登録
      staff = await prisma.user.create({
        data: {
          lineUserId: userId,
          name: profile.displayName,
          role: 'STAFF'
        }
      });
    }

    // ウェルカムメッセージ
    const messages = [
      {
        type: 'text' as const,
        text: MESSAGES.WELCOME.GREETING(staff.name)
      },
      {
        type: 'text' as const,
        text: MESSAGES.WELCOME.GUIDE
      },
      createQuickReplyMenu()
    ];

    await client.replyMessage(replyToken, messages);
  } catch (error) {
    console.error('Handle follow error:', error);
  }
}

// ブロック時の処理
async function handleUnfollow(event: UnfollowEvent) {
  const userId = event.source.userId;
  if (!userId) return;
  console.log('ユーザーがブロックしました:', userId);
  // 必要に応じてステータス更新
}

// テキストメッセージ処理
async function handleTextMessage(event: MessageEvent) {
  const userId = event.source.userId;
  if (!userId) return;
  const text = event.message.type === 'text' ? event.message.text.trim() : '';
  const replyToken = event.replyToken;

  try {
    // スタッフ情報確認
    const staff = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!staff) {
      await client.replyMessage(replyToken, [{
        type: 'text',
        text: MESSAGES.ERROR.NOT_REGISTERED
      }]);
      return;
    }

    // キーワードに応じた処理
    if (text.includes('今日') || text.includes('報告書')) {
      await showTodayReports(replyToken, staff.id);
    } else if (text.includes('ヘルプ') || text === '？' || text === '?') {
      await showHelp(replyToken);
    } else if (text.includes('ありがとう')) {
      await client.replyMessage(replyToken, [{
        type: 'text',
        text: 'こちらこそ、いつもお疲れさまです！😊\n何かあればいつでも聞いてくださいね。'
      }]);
    } else if (text.includes('履歴') || text.includes('確認')) {
      await showRecentHistory(replyToken, staff.id);
    } else {
      // デフォルトレスポンス
      await client.replyMessage(replyToken, [{
        type: 'text',
        text: 'メッセージありがとうございます😊'
      }, createQuickReplyMenu()]);
    }
  } catch (error) {
    console.error('Handle text message error:', error);
    await client.replyMessage(replyToken, [{
      type: 'text',
      text: MESSAGES.ERROR.GENERAL
    }]);
  }
}

// Postback処理
async function handlePostback(event: PostbackEvent) {
  const userId = event.source.userId;
  if (!userId) return;
  const replyToken = event.replyToken;
  const data = parsePostbackData(event.postback.data);

  try {
    const staff = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!staff) return;

    switch (data.action) {
      case 'submit':
        await handleReportSubmit(replyToken, staff.id, parseInt(data.reportId));
        break;
      case 'help':
        await handleReportHelp(replyToken, staff.id, parseInt(data.reportId));
        break;
      case 'history':
        await showRecentHistory(replyToken, staff.id);
        break;
    }
  } catch (error) {
    console.error('Handle postback error:', error);
  }
}

// 今日の報告書表示
async function showTodayReports(replyToken: string, staffId: number) {
  try {
    const reports = await getTodayReports(staffId);

    if (reports.length === 0) {
      await client.replyMessage(replyToken, [{
        type: 'text',
        text: '今日提出する報告書はありません！😊\nゆっくり休んでくださいね。'
      }]);
      return;
    }

    const messages = [
      {
        type: 'text' as const,
        text: `今日の報告書は${reports.length}件です📋\n無理せず、できる範囲で大丈夫ですよ😊`
      },
      createReportCarousel(reports)
    ];

    await client.replyMessage(replyToken, messages);
  } catch (error) {
    console.error('Show today reports error:', error);
  }
}

// 報告書提出処理
async function handleReportSubmit(replyToken: string, staffId: number, reportId: number) {
  try {
    // 提出記録
    await prisma.reportSubmission.create({
      data: {
        userId: staffId,
        reportId: reportId,
        status: 'COMPLETED',
        submittedAt: new Date()
      }
    });

    // 励ましメッセージ
    const message = MESSAGES.ENCOURAGEMENT[
      Math.floor(Math.random() * MESSAGES.ENCOURAGEMENT.length)
    ];

    await client.replyMessage(replyToken, [{
      type: 'text',
      text: message
    }]);
  } catch (error) {
    console.error('Handle report submit error:', error);
  }
}

// 相談処理
async function handleReportHelp(replyToken: string, staffId: number, reportId: number) {
  await client.replyMessage(replyToken, [{
    type: 'text',
    text: 'どんなことでもお気軽に相談してくださいね😊\n\n質問内容を入力して送信してください。'
  }, {
    type: 'text',
    text: '例：\n・書き方がわからない\n・データの場所を教えてほしい\n・締切を延ばしてほしい'
  }]);
}

// ヘルプ表示
async function showHelp(replyToken: string) {
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

  await client.replyMessage(replyToken, [{
    type: 'text',
    text: helpMessage
  }]);
}

// 最近の提出履歴表示
async function showRecentHistory(replyToken: string, staffId: number) {
  try {
    const history = await prisma.reportSubmission.findMany({
      where: { userId: staffId },
      include: { report: true },
      orderBy: { submittedAt: 'desc' },
      take: 5
    });

    if (history.length === 0) {
      await client.replyMessage(replyToken, [{
        type: 'text',
        text: 'まだ提出履歴がありません。\n最初の報告書、一緒に頑張りましょう！💪'
      }]);
      return;
    }

    let historyText = '📋 最近の提出履歴\n\n';
    history.forEach(h => {
      const emoji = h.status === 'COMPLETED' ? '✅' : '📝';
      const date = h.submittedAt?.toLocaleDateString('ja-JP') || '';
      historyText += `${emoji} ${h.report.title}\n└ ${date}\n\n`;
    });

    await client.replyMessage(replyToken, [{
      type: 'text',
      text: historyText.trim()
    }]);
  } catch (error) {
    console.error('Show recent history error:', error);
  }
}

// 今日の報告書取得
async function getTodayReports(staffId: number) {
  const today = new Date();
  const reports = await prisma.report.findMany({
    where: {
      isActive: true,
      // 今日が締切日のもの、またはまだ提出していないもの
    }
  });

  // 既に提出済みの報告書を除外
  const submitted = await prisma.reportSubmission.findMany({
    where: {
      userId: staffId,
      submittedAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
      }
    },
    select: { reportId: true }
  });

  const submittedIds = submitted.map(s => s.reportId);
  return reports.filter(r => !submittedIds.includes(r.id));
}

// クイックリプライメニュー作成
function createQuickReplyMenu() {
  return {
    type: 'text' as const,
    text: '何かお手伝いできることはありますか？',
    quickReply: {
      items: [
        {
          type: 'action' as const,
          action: {
            type: 'message' as const,
            label: '📋 今日の報告書',
            text: '今日の報告書'
          }
        },
        {
          type: 'action' as const,
          action: {
            type: 'message' as const,
            label: '📊 提出履歴',
            text: '履歴'
          }
        },
        {
          type: 'action' as const,
          action: {
            type: 'message' as const,
            label: '❓ ヘルプ',
            text: 'ヘルプ'
          }
        }
      ]
    }
  };
}

// 報告書カルーセル作成
function createReportCarousel(reports: any[]) {
  const bubbles = reports.map(report => ({
    type: 'bubble' as const,
    size: 'kilo' as const,
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'text' as const,
          text: report.title,
          weight: 'bold' as const,
          size: 'lg' as const,
          wrap: true
        },
        {
          type: 'box' as const,
          layout: 'baseline' as const,
          margin: 'md' as const,
          contents: [
            {
              type: 'icon' as const,
              url: 'https://cdn-icons-png.flaticon.com/512/2838/2838779.png',
              size: 'sm' as const
            },
            {
              type: 'text' as const,
              text: `${report.dueDate || '期限なし'}頃まで`,
              size: 'sm' as const,
              color: '#999999',
              margin: 'sm' as const
            }
          ]
        },
        {
          type: 'text' as const,
          text: '余裕があるときに提出してくださいね',
          size: 'xs' as const,
          color: '#8BC34A',
          margin: 'md' as const,
          wrap: true
        }
      ]
    },
    footer: {
      type: 'box' as const,
      layout: 'horizontal' as const,
      spacing: 'sm' as const,
      contents: [
        {
          type: 'button' as const,
          style: 'primary' as const,
          height: 'sm' as const,
          action: {
            type: 'postback' as const,
            label: '✅ 提出',
            data: `action=submit&reportId=${report.id}`,
            displayText: `${report.title}を提出しました`
          },
          color: '#4CAF50'
        },
        {
          type: 'button' as const,
          style: 'secondary' as const,
          height: 'sm' as const,
          action: {
            type: 'postback' as const,
            label: '💬 相談',
            data: `action=help&reportId=${report.id}`
          }
        }
      ]
    }
  }));

  return {
    type: 'flex' as const,
    altText: `本日の報告書（${reports.length}件）`,
    contents: {
      type: 'carousel' as const,
      contents: bubbles
    }
  };
}

// Postbackデータパース
function parsePostbackData(dataString: string) {
  const params: Record<string, string> = {};
  dataString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[key] = decodeURIComponent(value);
  });
  return params;
}

export { router as default };