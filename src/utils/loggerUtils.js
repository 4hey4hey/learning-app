/**
 * loggerUtils.js
 * アプリケーション全体で使用する統一的なロギングユーティリティ
 * 環境に応じたログ出力制御とカテゴリ別のログフォーマットを提供します
 */

// ロギング設定
const LOG_CONFIG = {
  // 開発環境のみログを表示（本番環境ではログを抑制）
  enabled: process.env.NODE_ENV === 'development',
  
  // 各ログカテゴリの有効/無効切り替え
  categories: {
    app: true,       // アプリケーション全般
    auth: true,      // 認証関連
    schedule: true,  // スケジュール関連
    template: true,  // テンプレート関連
    achievement: true, // 実績関連
    sync: true,      // データ同期関連
    date: true,      // 日付・時間処理関連
    db: true,        // データベース操作関連
    ui: true         // UIイベント関連
  },
  
  // 最小ログレベル（これより低いレベルのログは表示しない）
  // 0: debug, 1: info, 2: warn, 3: error
  minLevel: process.env.NODE_ENV === 'production' ? 2 : 1, // 本番環境では警告以上、開発環境でもinfo以上のみ表示
  
  // ログスタイル設定
  styles: {
    app: 'color: #6366F1; font-weight: bold',        // Indigo
    auth: 'color: #8B5CF6; font-weight: bold',       // Violet
    schedule: 'color: #2DD4BF; font-weight: bold',   // Teal
    template: 'color: #F59E0B; font-weight: bold',   // Amber
    achievement: 'color: #10B981; font-weight: bold', // Emerald
    sync: 'color: #3B82F6; font-weight: bold',       // Blue
    date: 'color: #EC4899; font-weight: bold',       // Pink
    db: 'color: #6B7280; font-weight: bold',         // Gray
    ui: 'color: #0EA5E9; font-weight: bold'          // Sky
  }
};

// ログレベルの定義
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * ログ出力の基本関数
 * @param {string} category - ログカテゴリ
 * @param {string} level - ログレベル
 * @param {string} message - ログメッセージ
 * @param {any[]} args - 追加データ
 */
const logBase = (category, level, message, ...args) => {
  // ロギングが無効化されている場合は何もしない
  if (!LOG_CONFIG.enabled) return;
  
  // カテゴリが無効化されている場合は何もしない
  if (!LOG_CONFIG.categories[category]) return;
  
  // ログレベルが最小レベル未満の場合は何もしない
  if (LOG_LEVELS[level] < LOG_CONFIG.minLevel) return;
  
  // ログプレフィックスを生成
  const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
  const prefix = `[${timestamp}][${category.toUpperCase()}]`;
  
  // ログレベルに応じたコンソールメソッドを選択
  const method = level === 'error' ? console.error : 
                level === 'warn' ? console.warn : 
                console.log;
  
  // スタイル付きで出力
  if (LOG_CONFIG.styles[category]) {
    method(`%c${prefix} ${message}`, LOG_CONFIG.styles[category], ...args);
  } else {
    method(`${prefix} ${message}`, ...args);
  }
};

/**
 * カテゴリごとのロガーを生成する関数
 * @param {string} category - ログカテゴリ
 * @returns {Object} - ロガーオブジェクト
 */
const createLogger = (category) => {
  return {
    debug: (message, ...args) => logBase(category, 'debug', message, ...args),
    info: (message, ...args) => logBase(category, 'info', message, ...args),
    warn: (message, ...args) => logBase(category, 'warn', message, ...args),
    error: (message, ...args) => logBase(category, 'error', message, ...args),
    
    // グループログ
    group: (label) => {
      if (!LOG_CONFIG.enabled || !LOG_CONFIG.categories[category]) return;
      console.group(`%c[${category.toUpperCase()}] ${label}`, LOG_CONFIG.styles[category]);
    },
    
    // グループ終了
    groupEnd: () => {
      if (!LOG_CONFIG.enabled || !LOG_CONFIG.categories[category]) return;
      console.groupEnd();
    },
    
    // パフォーマンスログ開始
    time: (label) => {
      if (!LOG_CONFIG.enabled || !LOG_CONFIG.categories[category]) return;
      console.time(`[${category.toUpperCase()}] ${label}`);
    },
    
    // パフォーマンスログ終了・表示
    timeEnd: (label) => {
      if (!LOG_CONFIG.enabled || !LOG_CONFIG.categories[category]) return;
      console.timeEnd(`[${category.toUpperCase()}] ${label}`);
    }
  };
};

// 各カテゴリのロガーをエクスポート
export const appLogger = createLogger('app');
export const authLogger = createLogger('auth');
export const scheduleLogger = createLogger('schedule');
export const templateLogger = createLogger('template');
export const achievementLogger = createLogger('achievement');
export const syncLogger = createLogger('sync');
export const dateLogger = createLogger('date');
export const dbLogger = createLogger('db');
export const uiLogger = createLogger('ui');

// デフォルトエクスポート（アプリケーション全般のログ）
export default appLogger;

// ロギング設定の更新関数
export const updateLogConfig = (newConfig) => {
  // 既存の設定と新しい設定をマージ
  Object.assign(LOG_CONFIG, newConfig);
};

// 全ロギングの有効/無効を切り替え
export const enableLogging = (enabled = true) => {
  LOG_CONFIG.enabled = enabled;
};

// 特定カテゴリのログを有効/無効化
export const setLogCategory = (category, enabled = true) => {
  // ESLint警告: no-prototype-builtins 修正
  // if (LOG_CONFIG.categories.hasOwnProperty(category)) {
  if (Object.prototype.hasOwnProperty.call(LOG_CONFIG.categories, category)) {
    LOG_CONFIG.categories[category] = enabled;
  }
};

// 最小ログレベルを設定
export const setMinLogLevel = (level) => {
  // ESLint警告: no-prototype-builtins 修正
  // if (LOG_LEVELS.hasOwnProperty(level)) {
  if (Object.prototype.hasOwnProperty.call(LOG_LEVELS, level)) {
    LOG_CONFIG.minLevel = LOG_LEVELS[level];
  }
};
