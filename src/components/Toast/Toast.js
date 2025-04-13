import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * トースト通知コンポーネント
 */
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const closeTimerRef = useRef(null);
  const toastId = useRef(`toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // トーストのスタイルを決定
  const getToastStyle = useCallback(() => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  }, [type]);

  // 前のタイマーをクリアしてないために、useRefを使用してタイマーを管理
  useEffect(() => {
    // 前のタイマーをクリア
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    
    // 新しいタイマーを設定
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [duration, onClose, message]); // messageも依存配列に追加して、置き換わりが発生したときにタイマーをリセット

  // 表示されていない場合はnullを返す
  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded text-white shadow-lg z-50 ${getToastStyle()}`}>
      <div className="flex items-center">
        <span>{message}</span>
        <button
          className="ml-4 text-white hover:text-gray-200"
          onClick={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
            }
            setIsVisible(false);
            if (onClose) {
              onClose();
            }
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;