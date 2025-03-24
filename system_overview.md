# 📚 学習管理アプリケーション システム概要

## 1. アプリケーション概要

このアプリケーションは、ユーザーが効率的に学習時間を管理し視覚化するためのWebツールです。週間スケジュールを通じて勉強計画を立て、カテゴリごとの学習時間を自動集計します。React と Firebase をベースに構築されています。

## 2. 主要機能

- **👤 ユーザー認証**: Firebase Authenticationを利用したユーザー登録・ログイン管理
- **📚 教科カテゴリ管理**: 国語、数学などの学習科目のカテゴリ作成と色分け管理
- **📅 週間スケジュール**: 9時〜22時までの時間単位での学習スケジュール作成と管理
- **✅ 達成記録**: 計画した学習の達成状況記録（完了/部分的/未達成）
- **📊 データ視覚化**: グラフを用いた学習時間・達成率の可視化と分析
- **📋 テンプレート機能**: 定型的なスケジュールパターンの保存と適用

## 3. 技術スタック

- **フロントエンド**: React (v18.2.0)
- **状態管理**: React Context API
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication
- **UI**: Tailwind CSS
- **グラフ**: recharts
- **日付操作**: date-fns (v4.1.0)
- **ルーティング**: react-router-dom (v7.4.0)

## 4. アプリケーション構造

### 4.1 ディレクトリ構造

```
src/
├── components/  # UIコンポーネント
│   ├── Calendar/     # カレンダー関連コンポーネント
│   │   ├── WeeklyCalendar.js  # 週間カレンダー表示
│   │   └── WeekNavigator.js   # 週移動ナビゲーション
│   ├── Categories/   # カテゴリ管理コンポーネント 
│   │   ├── CategoryList.js    # カテゴリ一覧
│   │   ├── CategoryForm.js    # カテゴリ追加・編集フォーム
│   │   └── CategoryManager.js # カテゴリ管理画面
│   ├── Stats/        # 統計コンポーネント
│   │   ├── CategoryChart.js   # カテゴリ別グラフ
│   │   ├── WeeklyStats.js     # 週間統計
│   │   └── StatsDashboard.js  # 統計ダッシュボード
│   ├── Achievements/ # 達成状況コンポーネント
│   │   ├── AchievementList.js # 達成状況一覧
│   │   └── AchievementManager.js # 達成管理画面
│   ├── Templates/    # テンプレート関連コンポーネント
│   │   ├── TemplateList.js    # テンプレート一覧
│   │   └── TemplateManager.js # テンプレート管理画面
│   ├── Modal/        # モーダルコンポーネント
│   │   ├── ScheduleModal.js   # スケジュール編集モーダル
│   │   └── ConfirmModal.js    # 確認モーダル
│   └── Layout/       # レイアウトコンポーネント
│       ├── MainLayout.js      # メインレイアウト
│       ├── Header.js          # ヘッダーコンポーネント
│       └── Sidebar.js         # サイドバーコンポーネント
├── contexts/    # Context API実装
│   ├── AuthContext.js        # 認証コンテキスト
│   ├── CategoryContext.js    # カテゴリコンテキスト
│   ├── ScheduleContext.js    # スケジュールコンテキスト
│   ├── AchievementContext.js # 達成状況コンテキスト
│   ├── TemplateContext.js    # テンプレートコンテキスト
│   ├── StudyStateContext.js  # 統合状態コンテキスト
│   ├── SyncContext.js        # 同期コンテキスト
│   ├── ToastContext.js       # 通知コンテキスト
│   └── ProvidersWrapper.jsx  # コンテキストプロバイダーラッパー
├── firebase/    # Firebase設定
│   ├── config.js    # Firebase初期化
│   ├── auth.js      # 認証サービス
│   └── firestore.js # Firestoreサービス
├── hooks/       # カスタムフック
│   ├── useAuth.js        # 認証用フック
│   ├── useFirestore.js   # Firestore操作用フック
│   ├── useErrorLogger.js # エラーログ用フック
│   └── useCategories.js  # カテゴリ操作用フック
├── pages/       # メインページ
│   ├── Dashboard.js         # メインダッシュボード
│   ├── Login.js             # ログイン
│   ├── Register.js          # ユーザー登録
│   ├── Settings.js          # 設定
│   ├── AnalyticsDashboard.js # 詳細分析ページ
│   └── NotFound.js          # 404ページ
├── styles/      # スタイル定義
│   ├── tailwind.css       # Tailwind設定
│   └── print.css          # 印刷用スタイル
└── utils/       # ユーティリティ関数
    ├── timeUtils.js       # 時間計算用ユーティリティ
    ├── errorLogger.js     # エラーロギング
    ├── statisticsUtils.js # 統計計算ユーティリティ
    └── formatUtils.js     # フォーマット用ユーティリティ
```

### 4.2 主要コンテキスト階層と依存関係

ProvidersWrapper.jsx で以下の順序でネストされています:

1. **AuthProvider**: 認証状態を管理（最も上位）
   - ユーザー認証情報の提供
   - 認証状態の変更監視
   - 初期カテゴリの自動作成

2. **ToastProvider**: 通知メッセージを管理
   - システム通知の表示
   - エラーメッセージの表示

3. **SyncProvider**: データ同期状態を管理
   - オンライン/オフライン状態の監視
   - データ同期状態の追跡

4. **CategoryProvider**: カテゴリデータを管理
   - カテゴリの取得/追加/更新/削除
   - カテゴリ色の管理

5. **ScheduleProvider**: スケジュールデータを管理
   - 週間スケジュールの取得/更新
   - 選択週の管理と週間移動機能

6. **AchievementProvider**: 実績データを管理（ScheduleProviderに依存）
   - 達成状況の記録
   - 実績データの集計

7. **TemplateProvider**: テンプレートデータを管理（ScheduleProviderに依存）
   - スケジュールテンプレートの保存
   - テンプレートの適用

8. **StudyStateProvider**: 共有状態を管理（他のすべてのプロバイダーに依存）
   - 統合されたデータアクセス
   - クロスコンテキスト機能の提供

## 5. データモデル

### 5.1 Firestore コレクション構造

- **users/{userId}**: ユーザー情報
  - email: メールアドレス
  - displayName: 表示名
  - createdAt: アカウント作成日時
  - lastLogin: 最終ログイン日時
  
  - **categories/{categoryId}**: 教科カテゴリ
    - name: カテゴリ名
    - color: カテゴリ色（HEXコード）
    - createdAt: 作成日時
    - updatedAt: 更新日時
  
  - **schedules/{weekId}**: 週別スケジュール
    - weekId: YYYY-MM-DD形式（週の月曜日の日付）
    - day1~day7: 曜日ごとのスケジュール
      - hour9~hour22: 時間枠ごとのカテゴリ割り当て
        - id: スケジュールアイテムID
        - categoryId: 割り当てられたカテゴリID
        - date: 日付（タイムスタンプ）
  
  - **achievements/{achievementId}**: 学習実績
    - id: 実績ID
    - scheduleId: 関連するスケジュールアイテムID
    - status: 実績状態（completed/partial/failed）
    - timestamp: 記録日時
    - notes: メモ（任意）
  
  - **templates/{templateId}**: スケジュールテンプレート
    - name: テンプレート名
    - description: テンプレート説明
    - scheduleData: スケジュールデータ
    - createdAt: 作成日時
    - updatedAt: 更新日時

### 5.2 時間計算システム

- **週の始めは月曜日**: すべての週は月曜日から日曜日までで管理
- **タイムスロット**: 1時間単位 (9:00〜22:00)の14スロット
- **日付標準化**: すべての日付は `timeUtils.js` の関数を通じて標準化
- **週識別子**: 週の月曜日の日付（YYYY-MM-DD形式）を使用

## 6. 重要なユーティリティ関数

### 6.1 日付関連 (timeUtils.js)

- **formatDateToString**: 日付を "YYYY-MM-DD" 形式に変換
  ```javascript
  // 使用例
  const dateStr = formatDateToString(new Date()); // "2025-03-24"
  ```

- **getDayKeyFromDate**: 日付から "day1"〜"day7" の曜日キーを取得
  ```javascript
  // 使用例（月曜日の場合）
  const dayKey = getDayKeyFromDate(new Date(2025, 2, 24)); // "day1"
  ```

- **getWeekStartDate**: 任意の日付からその週の月曜日の日付を取得
  ```javascript
  // 使用例
  const mondayDate = getWeekStartDate(new Date(2025, 2, 26)); // 2025-03-24の日付
  ```

- **normalizeDate**: 様々な形式の日付を標準化（時刻部分を0:00:00に設定）
  ```javascript
  // 使用例
  const normalizedDate = normalizeDate("2025-03-24T15:30:00");
  // 2025-03-24 00:00:00 のDateオブジェクト
  ```

- **getWeekIdentifier**: 週の識別子を取得（週の月曜日の日付文字列）
  ```javascript
  // 使用例
  const weekId = getWeekIdentifier(new Date(2025, 2, 26)); // "2025-03-24"
  ```

- **generateScheduleKey**: スケジュールと実績を紐づけるユニークキーを生成
  ```javascript
  // 使用例
  const key = generateScheduleKey(dateObj, "day1", "hour9"); // "2025-03-24_day1_hour9"
  ```

### 6.2 集計関連

- **calculateCategoryHours**: カテゴリごとの学習時間を計算
  ```javascript
  // 使用例：カテゴリ別学習時間（分）を取得
  const categoryHours = calculateCategoryHours(schedule, categories, achievements, true);
  // { "category1": 180, "category2": 120, ... }
  ```

- **calculateWeekStudyHours**: 週間の総学習時間を計算
  ```javascript
  // 使用例：週間の合計学習時間（時間）を取得
  const weekHours = calculateWeekStudyHours(schedule, achievements, false);
  // 12.5（時間）
  ```

- **calculateMonthStudyHours**: 月間の総学習時間を計算
  ```javascript
  // 使用例：月間の合計学習時間（時間）を取得
  const monthHours = calculateMonthStudyHours(weeklySchedules, achievements, true);
  // 45.0（時間）
  ```

### 6.3 スケジュール操作関連

- **generateEmptyWeekSchedule**: 空の週間スケジュールテンプレートを生成

## 7. エクスポート/インポート規約

### 7.1 推奨エクスポート方法

特に `timeUtils.js` の関数の正しいエクスポート方法が重要です。以下のようなエクスポート形式が推奨されています:

```javascript
// 方法1: 名前付きエクスポートをまとめる（推奨）
export { 
  formatDateToString, 
  getDayKeyFromDate, 
  getWeekStartDate,
  normalizeDate,
  getWeekIdentifier,
  calculateCategoryHours,
  calculateWeekStudyHours,
  calculateMonthStudyHours,
  generateEmptyWeekSchedule
}

// 方法2: 関数ごとに個別エクスポート（こちらも可）
export const formatDateToString = (date) => { ... };
export const getDayKeyFromDate = (date) => { ... };
// ...他の関数
```

### 7.2 一般的なエラー原因

- ファイルのリファクタリング時に関数のエクスポートを削除してしまう
- 新しい関数を追加したが、エクスポートを忘れている
- 関数名の変更後にエクスポートを更新し忘れている
- デフォルトエクスポートと名前付きエクスポートの混在による混乱

### 7.3 開発時のチェックポイント

- コンポーネントでインポートする際は、エクスポートされているか必ず確認する
- リファクタリング後は、必ずインポートしているすべての関数が正しくエクスポートされているか確認する
- エディタの型チェック機能（TypeScriptやESLintなど）を活用する
- デバッグ時にはインポート/エクスポートの問題を最初に疑う

### 7.4 推奨プラクティス

- 可能な限り、型安全性を考慮したエクスポート方法を採用する
- 明示的なエクスポートリストを使用し、何がエクスポートされているか明確にする
- 不要な関数は明示的にエクスポートしない（内部関数として保持する）
- 関数の名前変更時は、すべての参照箇所を確認する

## 8. トラブルシューティングの具体例

### 8.1 エクスポート問題の例

```javascript
// ❌ 間違った例（エラーの原因）
const formatDateToString = (date) => { ... }; // エクスポートされていない

// ✅ 正しいエクスポート例
export const formatDateToString = (date) => { ... };
export const getDayKeyFromDate = (date) => { ... };

// または
export {
  formatDateToString,
  getDayKeyFromDate
}
```

### 8.2 日付変換エラーの例

```javascript
// ❌ 問題のある日付変換（エラーの原因）
const date = new Date(dateString); // dateStringが無効な場合、Invalid Dateになる

// ✅ 正しい日付変換（エラーハンドリング付き）
let date;
try {
  date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // 無効な日付の場合は現在日付を使用
    console.warn('無効な日付文字列:', dateString);
    date = new Date();
  }
} catch (error) {
  console.error('日付変換エラー:', error);
  date = new Date();
}
```

### 8.3 デバッグのヒント

- エラーが発生した場合、まずはエクスポートされているかを確認する
- コンソールのエラーメッセージを注意深く読み、行番号と関数名を確認する
- インポート元のファイルで、明示的にエクスポートされているか確認する
- 日付関連のエラーの場合、`normalizeDate`関数を使って日付を標準化する
- Firefoxのデベロッパーツールを使用すると、よりわかりやすいエラーメッセージが得られる場合がある

## 9. セキュリティ設定

Firebaseセキュリティルールを使用して、ユーザーデータへのアクセスを制限しています:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー自身のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // サブコレクションもユーザー自身のみアクセス可能
      match /categories/{categoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /schedules/{scheduleId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /achievements/{achievementId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /templates/{templateId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // その他のコレクションはアクセス不可
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 10. 開発環境セットアップ

### 10.1 前提条件

- Node.js (v16.x以上)
- npm または yarn
- Firebaseアカウント

### 10.2 インストール手順

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/yourusername/learning-app.git
   cd learning-app
   ```

2. 依存パッケージをインストール:
   ```bash
   npm install
   # または
   yarn install
   ```

3. `.env.local` ファイルを作成して Firebase 設定を追加:
   ```
   REACT_APP_FIREBASE_API_KEY=...
   REACT_APP_FIREBASE_AUTH_DOMAIN=...
   REACT_APP_FIREBASE_PROJECT_ID=...
   REACT_APP_FIREBASE_STORAGE_BUCKET=...
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
   REACT_APP_FIREBASE_APP_ID=...
   REACT_APP_FIREBASE_MEASUREMENT_ID=...
   ```

4. 開発サーバーを起動:
   ```bash
   npm start
   # または
   yarn start
   ```

### 10.3 Firebase設定

1. Firebase コンソールでプロジェクトを作成
2. Authentication を有効化し、メール/パスワード認証を設定
3. Firestore データベースを作成
4. Firestore セキュリティルールを設定

## 11. 今後の改善点

### 11.1 機能拡張

- 📆 **月間カレンダービュー**: 月単位での学習計画と実績の可視化
- 🔄 **繰り返し予定の設定**: 定期的な学習スケジュールを簡単に設定
- 🎯 **目標設定と達成率の表示**: 学習目標の設定と進捗管理
- 🌙 **ダークモード対応**: 目の疲れを軽減する夜間表示モード
- 📈 **学習効率分析レポート**: 学習パターンと成果の関連性分析
- 📱 **モバイルアプリ対応**: PWA化またはネイティブアプリ開発

### 11.2 技術的改善

- 🧰 **TypeScriptへの移行**: 型安全性を向上させ、開発効率を高める
- 🧹 **ESLintとPrettierの設定強化**: コード品質とスタイルの一貫性を確保
- 🔍 **自動テスト導入**: ユニットテストとE2Eテストによる品質保証
- 🚀 **パフォーマンス最適化**: レンダリングとデータ取得の効率化
- 📦 **状態管理の改善**: Context APIからReduxまたはZustandへの移行検討

### 11.3 ドキュメント改善

- 📝 **APIドキュメント**: 各コンテキストとフックの詳細なドキュメント作成
- 🔄 **コントリビューションガイド**: 開発参加者向けのガイドライン
- 📚 **ユーザーマニュアル**: エンドユーザー向けの使用方法ガイド
