import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// アプリケーション名をコレクションIDとして使用
const COLLECTION_ID = 'learning-app';

// エラーログを保存する関数
export const logError = async (error, context = {}) => {
  try {
    // エラーオブジェクトが存在しない場合の防御的な処理
    const safeError = error instanceof Error 
      ? error 
      : new Error(String(error || '不明なエラー'));

    const errorLog = {
      message: safeError.message || '不明なエラー',
      stack: safeError.stack || '詳細なスタックトレースなし',
      code: safeError.code || 'UNKNOWN_ERROR', 
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: JSON.stringify({
        ...context,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      }),
      serverTimestamp: serverTimestamp()
    };

    try {
      // エラーログをFirestoreに保存
      const errorLogsRef = collection(db, `${COLLECTION_ID}/errors/logs`);
      await addDoc(errorLogsRef, errorLog);
      console.log('エラーログをFirestoreに保存しました');
    } catch (dbError) {
      console.error('Firestoreへのエラーログ保存に失敗:', {
        dbErrorMessage: dbError.message,
        originalError: errorLog
      });
      
      // ローカルストレージにバックアップ
      saveErrorToLocalStorage(errorLog);
    }
  } catch (loggingError) {
    console.error('エラーロギング中に致命的なエラーが発生:', loggingError);
  }
};

// ローカルストレージにエラーログを保存
const saveErrorToLocalStorage = (errorLog) => {
  try {
    const storedLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    storedLogs.push(errorLog);
    localStorage.setItem('errorLogs', JSON.stringify(storedLogs.slice(-20))); // 最新20件のみ保持
  } catch (e) {
    console.error('エラーログのローカルストレージへの保存に失敗:', e);
  }
};

// グローバルエラーハンドラーをセットアップするフック
export const useErrorLogger = () => {
  const [globalErrors, setGlobalErrors] = useState([]);
  
  useEffect(() => {
    // グローバルなエラーハンドラー
    const handleGlobalError = (event) => {
      const { message, filename, lineno, colno, error } = event;
      
      const errorObj = {
        message,
        filename,
        lineno,
        colno,
        stack: error?.stack || 'No stack trace available'
      };
      
      setGlobalErrors(prev => [...prev, errorObj]);
      logError(error || new Error(message), { source: 'window.onerror' });
    };
    
    // 未ハンドルのPromiseのリジェクト
    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      
      setGlobalErrors(prev => [...prev, {
        message: error?.message || 'Unhandled Promise rejection',
        stack: error?.stack || 'No stack trace available'
      }]);
      
      logError(error || new Error('Unhandled Promise rejection'), { source: 'unhandledrejection' });
    };
    
    // イベントリスナーを設定
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // クリーンアップ時にリスナーを削除
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return { globalErrors };
};

// エラーログをテキスト形式で出力
export const formatErrorLogsAsText = () => {
  let logs = [];
  
  // ローカルストレージからログを取得
  try {
    const storedLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    logs = storedLogs;
  } catch (e) {
    console.error('ローカルストレージからのエラーログ取得に失敗:', e);
  }
  
  if (logs.length === 0) {
    return 'エラーログが見つかりません。';
  }
  
  // 整形してテキストとして出力
  return logs.map((log, index) => {
    return `--- エラー ${index + 1} ---
時間: ${log.timestamp}
メッセージ: ${log.message}
コード: ${log.code || '該当なし'}
URL: ${log.url}
ユーザーエージェント: ${log.userAgent}
スタックトレース: ${log.stack || 'スタックトレースなし'}
コンテキスト: ${log.context || '追加コンテキストなし'}
    `;
  }).join('\n\n');
};

// エラーログをクリップボードにコピー
export const copyErrorLogsToClipboard = async () => {
  const text = formatErrorLogsAsText();
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('クリップボードへのコピーに失敗:', err);
    return false;
  }
};
