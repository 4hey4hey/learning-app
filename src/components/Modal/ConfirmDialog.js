import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onClose,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmButtonClass = 'bg-red-500 hover:bg-red-600'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className="relative bg-white rounded-lg shadow-xl p-5 max-w-md w-full mx-4 z-10">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        
        <div className="text-gray-600 mb-5">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded transition ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;