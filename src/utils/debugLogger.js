/**
 * デバッグログユーティリティ
 * 開発環境でのみ詳細なログを出力する
 */

const ENABLE_DEBUG = process.env.NODE_ENV !== 'production'; // デバッグログの有効/無効を切り替え

/**
 * ログレベルの定義
 */
export const LogLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

/**
 * ログを出力する関数
 * @param {string} level ログレベル
 * @param {string} component コンポーネント名
 * @param {string} message メッセージ
 * @param {object} data 追加データ (オプション)
 */
export const logDebug = (level, component, message, data = null) => {
  if (!ENABLE_DEBUG && level !== LogLevel.ERROR) return;

  const timestamp = new Date().toISOString().substring(11, 19);
  const prefix = `[${timestamp}] [${level}] [${component}]`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, data || '');
      break;
    case LogLevel.WARNING:
      console.warn(`${prefix} ${message}`, data || '');
      break;
    case LogLevel.INFO:
      console.info(`${prefix} ${message}`, data || '');
      break;
    case LogLevel.DEBUG:
    default:
      console.log(`${prefix} ${message}`, data || '');
      break;
  }
};

/**
 * 関数実行時間を計測するデコレータ
 * @param {string} functionName 関数名
 * @param {function} func 実行する関数
 * @param {array} args 関数の引数
 * @returns {any} 関数の戻り値
 */
export const measureExecutionTime = async (functionName, func, ...args) => {
  if (!ENABLE_DEBUG) return await func(...args);

  const startTime = performance.now();
  try {
    const result = await func(...args);
    const endTime = performance.now();
    logDebug(LogLevel.DEBUG, 'Performance', `${functionName} executed in ${endTime - startTime}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    logDebug(LogLevel.ERROR, 'Performance', `${functionName} failed after ${endTime - startTime}ms`, error);
    throw error;
  }
};

/**
 * オブジェクトの状態をダンプする
 * @param {string} name オブジェクト名
 * @param {object} obj オブジェクト
 */
export const dumpObject = (name, obj) => {
  if (!ENABLE_DEBUG) return;
  
  try {
    logDebug(LogLevel.DEBUG, 'ObjectDump', `Dumping ${name}:`, 
      typeof obj === 'undefined' ? 'undefined' : 
      obj === null ? 'null' : 
      JSON.parse(JSON.stringify(obj)));
  } catch (error) {
    logDebug(LogLevel.ERROR, 'ObjectDump', `Failed to dump ${name}:`, {
      error: error.message,
      objectType: typeof obj,
      isNull: obj === null,
      isArray: Array.isArray(obj),
      constructor: obj && obj.constructor ? obj.constructor.name : 'unknown'
    });
  }
};

export default {
  log: logDebug,
  measure: measureExecutionTime,
  dump: dumpObject,
  LogLevel
};
