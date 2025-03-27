import React, { useState, useEffect } from 'react';
import { formatErrorLogsAsText, copyErrorLogsToClipboard } from '../utils/errorLogger';

const ErrorViewer = ({ isOpen, onClose }) => {
  const [errorLogs, setErrorLogs] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      const logs = formatErrorLogsAsText();
      setErrorLogs(logs);
    }
  }, [isOpen]);
  
  const handleCopyClick = async () => {
    const success = await copyErrorLogsToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">エラーログ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {errorLogs === 'No error logs found.' ? (
            <p className="text-gray-600">エラーログはありません。</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
              {errorLogs}
            </pre>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleCopyClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {copied ? 'コピーしました！' : 'クリップボードにコピー'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorViewer;
