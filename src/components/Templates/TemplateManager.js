import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTemplate } from '../../contexts/TemplateContext';
import { useSchedule } from '../../contexts/ScheduleContext';

const TemplateManager = () => {
  const { 
    templates, 
    fetchTemplates,
    saveTemplate, 
    deleteTemplate, 
    applyTemplate
  } = useTemplate();
  
  const { schedule } = useSchedule(); // 現在のスケジュールを取得
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        await fetchTemplates();
      } catch (error) {
        console.error('テンプレート読み込みエラー:', error);
        setMessage('テンプレートの読み込みに失敗しました');
      }
    };

    loadTemplates();
  }, [fetchTemplates]);
  
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      setMessage('テンプレート名を入力してください');
      return;
    }
    
    try {
      setIsLoading(true);
      const templateId = await saveTemplate(templateName, schedule);
      
      if (templateId) {
        setTemplateName('');
        setIsCreating(false);
        setMessage('テンプレートを保存しました');
      } else {
        setMessage('テンプレートの保存に失敗しました');
      }
      
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('テンプレート保存エラー:', error);
      setMessage('テンプレートの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (templateId, templateName) => {
    if (window.confirm(`テンプレート "${templateName}" を削除しますか？`)) {
      try {
        const deleted = await deleteTemplate(templateId);
        
        if (deleted) {
          setMessage('テンプレートを削除しました');
        } else {
          setMessage('テンプレートの削除に失敗しました');
        }
        
        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error('テンプレート削除エラー:', error);
        setMessage('テンプレートの削除に失敗しました');
      }
    }
  };
  
  const handleApplyTemplate = async (templateId, templateName) => {
    if (window.confirm(`テンプレート "${templateName}" を適用しますか？現在の予定は上書きされます。`)) {
      try {
        const success = await applyTemplate(templateId);
        
        if (success) {
          setMessage(`テンプレート "${templateName}" を適用しました`);
        } else {
          setMessage('テンプレートの適用に失敗しました');
        }
        
        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error('テンプレート適用エラー:', error);
        setMessage('テンプレートの適用中にエラーが発生しました');
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''} mr-2`}>▶</span>
            📋 週間テンプレート
            <span className="ml-2 text-sm text-gray-500">({templates.length})</span>
          </h2>
        </div>
        
        {isExpanded && (
          <div className="mt-2">
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
            >
              {isCreating ? 'キャンセル' : '+ テンプレート保存'}
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <>
          {message && (
            <div className="mb-4 mt-4 p-2 bg-blue-100 text-blue-700 rounded">
              {message}
            </div>
          )}
          
          {isCreating && (
            <form onSubmit={handleSaveTemplate} className="mb-4 mt-4 p-3 bg-gray-50 rounded">
              <div className="mb-3">
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名
                </label>
                <input
                  type="text"
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="平日の勉強計画など"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '現在の計画をテンプレートとして保存'}
              </button>
            </form>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto mt-3">
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">保存されたテンプレートはありません</p>
            ) : (
              templates.map(template => (
                <div key={template.id} className="flex items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        try {
                          if (template.createdAt instanceof Date) {
                            return format(template.createdAt, 'yyyy/MM/dd HH:mm');
                          } else if (template.createdAt) {
                            const date = new Date(template.createdAt);
                            // 無効な日付かどうかチェック
                            return isNaN(date.getTime()) 
                              ? '日付不明' 
                              : format(date, 'yyyy/MM/dd HH:mm');
                          } else {
                            return '日付不明';
                          }
                        } catch (error) {
                          console.error('日付フォーマットエラー:', error);
                          return '日付不明';
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApplyTemplate(template.id, template.name)}
                      className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      title="このテンプレートを適用"
                    >
                      適用
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      title="このテンプレートを削除"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateManager;