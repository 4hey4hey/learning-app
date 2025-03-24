import { onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Firebaseネットワーク接続の管理ユーティリティ
 */
export const NetworkManager = {
  /**
   * オフラインモードを有効化
   * @returns {Promise<boolean>} 成功したかどうか
   */
  enableOfflineMode: async () => {
    try {
      await disableNetwork(db);
      console.log('オフラインモードが有効になりました');
      return true;
    } catch (error) {
      console.error('オフラインモード設定エラー:', error);
      return false;
    }
  },
  
  /**
   * オンラインモードを有効化
   * @returns {Promise<boolean>} 成功したかどうか
   */
  enableOnlineMode: async () => {
    try {
      await enableNetwork(db);
      console.log('オンラインモードが有効になりました');
      return true;
    } catch (error) {
      console.error('オンラインモード設定エラー:', error);
      return false;
    }
  }
};

/**
 * リアルタイムリスナーの作成と管理
 * @param {Object} pathRef - コレクションまたはドキュメントの参照
 * @param {Function} callback - 変更時に呼び出されるコールバック関数
 * @param {Object} options - オプション
 * @returns {Function} リスナーの解除関数
 */
export const createRealtimeListener = (pathRef, callback, options = {}) => {
  const { onError, includeMetadata = false } = options;
  
  try {
    const unsubscribe = onSnapshot(
      pathRef,
      { includeMetadataChanges: includeMetadata },
      (snapshot) => {
        try {
          // ドキュメント単体の場合
          if (!snapshot.docs) {
            const data = snapshot.data();
            const id = snapshot.id;
            
            // データの元となるソースを確認（ローカルキャッシュかサーバー）
            const source = snapshot.metadata.fromCache ? 'local' : 'server';
            
            callback({
              data: data ? { id, ...data } : null,
              source,
              exists: snapshot.exists(),
              metadata: snapshot.metadata
            });
            return;
          }
          
          // コレクションの場合
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // 少なくとも1つのドキュメントがキャッシュから来ている場合
          const hasCachedDocs = snapshot.docs.some(doc => doc.metadata.fromCache);
          const source = hasCachedDocs ? 'mixed' : 'server';
          
          callback({
            data: docs,
            source,
            metadata: {
              hasPendingWrites: snapshot.metadata.hasPendingWrites,
              fromCache: hasCachedDocs
            }
          });
        } catch (callbackError) {
          console.error('リスナーコールバックエラー:', callbackError);
          if (onError) {
            onError(callbackError);
          }
        }
      },
      (error) => {
        console.error('リアルタイムリスナーエラー:', error);
        if (onError) {
          onError(error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('リアルタイムリスナー作成エラー:', error);
    if (onError) {
      onError(error);
    }
    return () => {}; // ダミーの解除関数
  }
};

/**
 * ネットワーク接続状態を監視するフック
 * @param {Function} onStatusChange - 状態変更時のコールバック
 * @returns {Object} 現在の接続状態
 */
export const useNetworkStatus = (onStatusChange) => {
  // オンライン/オフライン状態の監視を設定
  let interval = null;
  
  const checkNetwork = () => {
    // 現在の状態を取得
    const isOnline = navigator.onLine;
    
    // 状態変更コールバックを呼び出す
    if (onStatusChange) {
      onStatusChange({ online: isOnline });
    }
    
    return isOnline;
  };
  
  // ブラウザのオンライン/オフラインイベントを監視
  window.addEventListener('online', () => {
    if (onStatusChange) {
      onStatusChange({ online: true });
    }
    
    // オンラインになったらポーリングを停止
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  });
  
  window.addEventListener('offline', () => {
    if (onStatusChange) {
      onStatusChange({ online: false });
    }
    
    // オフラインになったら定期的に接続状態をチェック
    if (!interval) {
      interval = setInterval(checkNetwork, 30000); // 30秒ごとにチェック
    }
  });
  
  // 初期状態をチェック
  const initialState = checkNetwork();
  
  // オフラインの場合はポーリングを開始
  if (!initialState && !interval) {
    interval = setInterval(checkNetwork, 30000);
  }
  
  // コンポーネントのクリーンアップ時にポーリングを停止する
  return {
    online: initialState,
    cleanup: () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }
  };
};

/**
 * Firebase接続状態のより詳細な監視
 * @param {Function} onStatusChange - 状態変更時のコールバック
 * @returns {Function} 監視解除関数
 */
export const watchConnectionState = (onStatusChange) => {
  // Firebase接続状態リスナーを設定
  // 注: このリスナーはFirestoreの接続状態を監視し、
  // ブラウザのonline/offlineイベントよりも正確にFirebaseの接続状態を反映します
  try {
    if (!db) {
      console.warn('Firestore初期化されていないため接続状態監視不可');
      return () => {};
    }
    
    const unsubscribe = onSnapshot(
      db,
      { includeMetadataChanges: true },
      () => {
        // 接続状態の変更があった場合
        if (onStatusChange) {
          onStatusChange({
            online: true,
            firebaseConnected: true
          });
        }
      },
      (error) => {
        console.error('Firebase接続監視エラー:', error);
        // エラーが発生した場合は接続が切れた可能性がある
        if (onStatusChange) {
          onStatusChange({
            online: navigator.onLine,
            firebaseConnected: false,
            error
          });
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Firebase接続状態監視設定エラー:', error);
    return () => {};
  }
};
