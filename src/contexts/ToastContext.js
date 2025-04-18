import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import Toast from '../components/Toast/Toast';

// トースト通知のコンテキスト
const ToastContext = createContext();

// トースト通知のプロバイダーコンポーネント
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // トーストを追加
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => {
      const newToasts = [...prevToasts, { id, message, type, duration }];
      return newToasts;
    });
    return id;
  }, []);

  // トーストを削除
  const removeToast = useCallback(id => {
    setToasts(prevToasts => {
      const newToasts = prevToasts.filter(toast => toast.id !== id);
      return newToasts;
    });
  }, []);

  // 成功メッセージ
  const showSuccess = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  // エラーメッセージ
  const showError = useCallback((message, duration) => {
    // 既存のエラートーストを非表示にする
    setToasts(prevToasts => {
      return prevToasts.filter(toast => toast.type !== 'error');
    });
    
    // 新しいエラートーストを追加
    const id = addToast(message, 'error', duration);
    return id;
  }, [addToast]);

  // 警告メッセージ
  const showWarning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  // 情報メッセージ
  const showInfo = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* トースト通知の表示 */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// トースト通知を使用するためのカスタムフック
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};