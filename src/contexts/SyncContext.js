import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  enableNetwork, 
  disableNetwork, 
  onSnapshotsInSync, 
  waitForPendingWrites 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NetworkManager } from '../utils/syncUtils';

export const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const { currentUser, demoMode } = useAuth();
  
  // 初期状態を安定化
  const initialSyncStatus = useMemo(() => ({
    online: navigator.onLine,
    pendingChanges: false,
    lastSynced: null,
    syncInProgress: false,
    error: null
  }), []);

  const [syncStatus, setSyncStatus] = useState(initialSyncStatus);
  const [syncListeners, setSyncListeners] = useState([]);

  // ネットワーク状態変更ハンドラを最適化
  const handleNetworkStatusChange = useCallback((status) => {
    setSyncStatus(prev => {
      // 状態が実際に変更された場合のみ更新
      if (prev.online !== status.online) {
        return { 
          ...prev, 
          online: status.online,
          lastSynced: new Date()
        };
      }
      return prev;
    });
  }, []);

  // Firestoreの同期状態監視を最適化
  useEffect(() => {
    // デモモードまたは未認証の場合は何もしない
    if (demoMode || !currentUser) return () => {};

    try {
      const unsubscribe = onSnapshotsInSync(db, () => {
        setSyncStatus(prev => ({
          ...prev,
          lastSynced: new Date(),
          pendingChanges: false
        }));
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Firebase同期リスナーエラー:', error);
      return () => {};
    }
  }, [currentUser, demoMode]);

  // 同期関連の関数をメモ化
  const syncNow = useCallback(async () => {
    if (demoMode) return false;
    
    try {
      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: true,
        error: null
      }));
      
      await NetworkManager.enableOnlineMode();
      await waitForPendingWrites(db);
      
      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: false,
        lastSynced: new Date(),
        syncInProgress: false,
        online: true
      }));
      
      return true;
    } catch (error) {
      console.error('手動同期エラー:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: error.message,
        syncInProgress: false
      }));
      return false;
    }
  }, [demoMode]);

  // オフラインモード切り替え
  const toggleOfflineMode = useCallback(async (enableOffline) => {
    if (demoMode) return false;
    
    try {
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: true,
        error: null
      }));
      
      if (enableOffline) {
        await disableNetwork(db);
        setSyncStatus(prev => ({
          ...prev,
          online: false,
          syncInProgress: false
        }));
      } else {
        await enableNetwork(db);
        setSyncStatus(prev => ({
          ...prev,
          online: true,
          syncInProgress: false
        }));
      }
      
      return true;
    } catch (error) {
      console.error('オフラインモード切り替えエラー:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: error.message,
        syncInProgress: false
      }));
      return false;
    }
  }, [demoMode]);

  // 同期リスナーの登録
  const registerSyncListener = useCallback((listener) => {
    setSyncListeners(prev => [...prev, listener]);
    return () => {
      setSyncListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  // 同期状態が変更されたら登録されたリスナーに通知
  useEffect(() => {
    syncListeners.forEach(listener => {
      try {
        listener(syncStatus);
      } catch (error) {
        console.error('同期リスナーエラー:', error);
      }
    });
  }, [syncStatus, syncListeners]);

  // プロバイダー値をメモ化
  const value = useMemo(() => ({
    syncStatus,
    syncNow,
    toggleOfflineMode,
    registerSyncListener
  }), [syncStatus, syncNow, toggleOfflineMode, registerSyncListener]);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// カスタムフック
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
