import React, { useEffect } from 'react';

const MilestoneModal = ({ milestone, onClose }) => {
  // エスケープキーで閉じる機能を追加
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  if (!milestone) return null;

  const getTypeLabel = () => {
    switch (milestone.element) {
      case 'fire': return '炎タイプ';
      case 'water': return '水タイプ';
      case 'grass': return '草タイプ';
      case 'electric': return '電気タイプ';
      case 'flying': return 'ひこうタイプ';
      default: return 'ノーマルタイプ';
    }
  };

  const getTypeClassName = () => {
    switch (milestone.element) {
      case 'fire': return 'bg-red-100 text-red-800 border-red-300';
      case 'water': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'grass': return 'bg-green-100 text-green-800 border-green-300';
      case 'electric': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'flying': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getBackgroundGradient = () => {
    switch (milestone.element) {
      case 'fire': return 'from-red-50 to-orange-50';
      case 'water': return 'from-blue-50 to-cyan-50';
      case 'grass': return 'from-green-50 to-emerald-50';
      case 'electric': return 'from-yellow-50 to-amber-50';
      case 'flying': return 'from-blue-50 to-indigo-50';
      default: return 'from-gray-50 to-slate-50';
    }
  };
  
  const getBorderColor = () => {
    switch (milestone.element) {
      case 'fire': return 'border-red-200';
      case 'water': return 'border-blue-200';
      case 'grass': return 'border-green-200';
      case 'electric': return 'border-yellow-200';
      case 'flying': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity animate-fadeIn">
      <div onClick={(e) => e.stopPropagation()} className={`bg-gradient-to-br ${getBackgroundGradient()} rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 ${getBorderColor()} animate-slideIn relative overflow-hidden`}>
        {/* おめでとうの装飾 */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-yellow-400 rotate-45 opacity-30"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-yellow-400 rotate-45 opacity-30"></div>
        
        <div className="relative text-center">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold text-center flex-grow">おめでとう！</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 text-center animate-bounce">{milestone.name}をゲット！</h3>
          
          <div className="my-6 bg-white p-4 rounded-xl shadow-inner">
            <img 
              src={milestone.imageUrl} 
              alt={milestone.name} 
              className="w-56 h-56 object-contain mx-auto animate-pulse"
            />
          </div>
          
          <div className="mb-4">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold border ${getTypeClassName()} shadow-sm`}>
              {getTypeLabel()}
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4 text-left border border-gray-100">
            <p className="text-lg">
              {milestone.description}
            </p>
          </div>
          
          <p className="text-lg italic font-medium mb-6 text-center">
            「{milestone.message}」
          </p>
          
          <div className="text-sm text-gray-600 mb-6 bg-gray-50 py-2 px-4 rounded-lg inline-block">
            獲得条件: 累計<span className="font-bold">{milestone.condition && milestone.condition.value ? milestone.condition.value : '??'}</span>時間の学習
          </div>
          
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg"
          >
            続ける
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneModal;
