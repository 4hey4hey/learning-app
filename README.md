# 勉強計画アプリ

効率的な学習管理をサポートするWebアプリケーションです。週間スケジュールで勉強時間を視覚化し、教科ごとの学習時間を自動集計します。

## 機能

- **教科カテゴリ登録**: 国語、数学などのカテゴリを設定
- **スケジュール管理**: 9時〜22時までの1時間単位での予定登録
- **データ集計**: 日別・月別・教科別の勉強時間集計
- **ユーザー認証**: Firebase Authenticationによる安全なアカウント管理

## 技術スタック

- React (v18.2.0)
- Firebase (v10.8.0)
- React Router (v6.22.0)
- Tailwind CSS
- recharts (グラフ表示)
- date-fns (日付操作)

## 開発環境セットアップ

### 前提条件

- Node.js (推奨バージョン: 16.x以上)
- npm
- Firebaseアカウント

### インストール手順

1. リポジトリをクローン
   ```bash
   git clone https://github.com/sugisaki/learning-app.git
   cd learning-app
   ```

2. 依存関係をインストール
   ```bash
   npm install
   ```

3. Firebase設定
   `.env.local` ファイルを作成し、Firebaseの認証情報を設定してください。
   ```
   REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
   ```

4. 開発サーバー起動
   ```bash
   npm start
   ```

## デプロイ方法

### GitHub Pages

1. `package.json` の `homepage` フィールドをあなたのGitHub PagesのURLに更新

2. ビルドとデプロイ
   ```bash
   npm run deploy
   ```

## プロジェクト構造

```
src/
├── components/           # 再利用可能なコンポーネント
│   ├── Calendar/         # カレンダー関連コンポーネント
│   ├── Categories/       # カテゴリ管理コンポーネント 
│   ├── Stats/            # 統計コンポーネント
│   └── Layout/           # レイアウトコンポーネント
├── contexts/             # Context API
│   ├── AuthContext.js    # 認証コンテキスト
│   └── StudyContext.js   # 勉強計画コンテキスト
├── hooks/                # カスタムフック
│   ├── useAuth.js        # 認証用フック
│   └── useStudyPlan.js   # 勉強計画管理用フック
├── pages/                # ページコンポーネント
│   ├── Dashboard.js      # ダッシュボード
│   ├── Login.js          # ログイン
│   ├── Register.js       # ユーザー登録
│   └── Settings.js       # 設定
└── utils/                # ユーティリティ関数
    ├── firebase.js       # Firebase初期化
    └── timeUtils.js      # 時間計算用ユーティリティ
```

## Firebaseセキュリティルール

以下のFirebaseセキュリティルールを適用してください：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /categories/{categoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /schedules/{scheduleId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 将来の拡張計画

- 月間カレンダービュー
- 繰り返し予定の設定
- 目標設定と達成率の表示
- ダークモード対応
- 学習効率分析レポート

## ライセンス

MIT

## 貢献方法

1. フォークする
2. 機能ブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m 'Add some amazing feature'`)
4. ブランチをプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを開く
