// Express（サーバー）をセットアップ
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors()); // フロントエンドからのリクエストを許可
app.use(express.json()); // JSON形式のデータを受け取れるように

// データを保存するファイルのパス
const dataFile = path.join(__dirname, 'data.json');

// 初期データがなければ作成
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ threads: [] }, null, 2));
}

// ===== ここからAPIエンドポイント =====

// テスト用エンドポイント
app.get('/api/test', (req, res) => {
  res.json({ message: 'バックエンドが正常に動作しています！' });
});

// スレッド一覧を取得
app.get('/api/threads', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json(data.threads);
  } catch (error) {
    res.status(500).json({ error: 'データの読み込みに失敗しました' });
  }
});

// 新しいスレッドを作成
app.post('/api/threads', (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'タイトルと本文は必須です' });
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    const newThread = {
      id: Date.now(), // スレッドID（タイムスタンプを使用）
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
      replies: [] // レス（コメント）を保存する配列
    };
    
    data.threads.push(newThread);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.status(201).json(newThread);
  } catch (error) {
    res.status(500).json({ error: 'スレッド作成に失敗しました' });
  }
});

// レス（コメント）を投稿
app.post('/api/threads/:threadId/replies', (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '本文は必須です' });
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const thread = data.threads.find(t => t.id === parseInt(threadId));
    
    if (!thread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }
    
    const newReply = {
      id: Date.now(),
      content: content,
      createdAt: new Date().toISOString()
    };
    
    thread.replies.push(newReply);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ error: 'レス投稿に失敗しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📝 テストエンドポイント: http://localhost:${PORT}/api/test`);
});
