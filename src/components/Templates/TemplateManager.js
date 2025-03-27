import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTemplate } from '../../contexts/TemplateContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import ConfirmDialog from '../Modal/ConfirmDialog';
import { templateLogger, uiLogger } from '../../utils/loggerUtils';

const TemplateManager = () => {
  const { 
    templates, 
    fetchTemplates,
    saveTemplate, 
    deleteTemplate, 
    applyTemplate
  } = useTemplate();
  
  const { schedule, selectedWeek } = useSchedule(); // 現在のスケジュールを取得
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // テンプレート適用確認ダイアログの状態
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [clearExistingData, setClearExistingData] = useState(false);
  
  // 週の日付範囲を表示するための関数
  const getWeekRangeText = useCallback(() => {
    if (!selectedWeek) return "";
    
    // 週の開始日（月曜日）
    const startDate = selectedWeek;
    // 週の終了日（日曜日） - 6日後
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startText = format(startDate, 'M月d日', { locale: ja });
    const endText = format(endDate, 'M月d日', { locale: ja });
    return `${startText}〜${endText}`;
  }, [selectedWeek]);
  
  // 現在のスケジュールに登録項目が存在するか確認
  const hasExistingSchedule = useCallback(() => {
    if (!schedule) return false;
    
    // 各曜日をチェック
    for (const dayKey in schedule) {
      if (!schedule[dayKey]) continue;
      
      // 各時間枠をチェック
      for (const hourKey in schedule[dayKey]) {
        if (schedule[dayKey][hourKey] && schedule[dayKey][hourKey].categoryId) {
          return true; // スケジュール項目が存在する
        }
      }
    }
    
    return false; // スケジュール項目が存在しない
  }, [schedule]);
  
  useEffect(() => {
    const loadTemplates = async () => {
      uiLogger.debug('テンプレート管理コンポーネント: テンプレート読み込み開始');
      try {
        await fetchTemplates();
      } catch (error) {
        uiLogger.error('テンプレート管理コンポーネント: テンプレート読み込みエラー', error);
        setMessage('テンプレートの読み込みに失敗しました');
      }
    };

    loadTemplates();
  }, [fetchTemplates]);
  
  // 読み込まれたテンプレートを確認するためのログ
  useEffect(() => {
    uiLogger.debug('テンプレート管理コンポーネント: テンプレート一覧更新', {
      テンプレート数: templates.length
    });
  }, [templates]);
  
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      setMessage('テンプレート名を入力してください');
      return;
    }
    
    try {
      uiLogger.info('テンプレート管理コンポーネント: テンプレート保存開始', {
        名前: templateName
      });
      
      setIsLoading(true);
      const templateId = await saveTemplate(templateName, schedule);
      
      if (templateId) {
        uiLogger.info('テンプレート管理コンポーネント: テンプレート保存成功', {
          ID: templateId.id,
          名前: templateName
        });
        
        setTemplateName('');
        setIsCreating(false);
        setMessage('テンプレートを保存しました');
        
        // テンプレート一覧を再取得して確認
        await fetchTemplates();
      } else {
        uiLogger.error('テンプレート管理コンポーネント: テンプレート保存失敗');
        setMessage('テンプレートの保存に失敗しました');
      }
      
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      uiLogger.error('テンプレート管理コンポーネント: テンプレート保存エラー', error);
      setMessage('テンプレートの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (templateId, templateName) => {
    if (window.confirm(`テンプレート "${templateName}" を削除しますか？`)) {
      try {
        uiLogger.info('テンプレート管理コンポーネント: テンプレート削除開始', {
          ID: templateId,
          名前: templateName
        });
        
        const deleted = await deleteTemplate(templateId);
        
        if (deleted) {
          uiLogger.info('テンプレート管理コンポーネント: テンプレート削除成功', {
            ID: templateId
          });
          setMessage('テンプレートを削除しました');
        } else {
          uiLogger.error('テンプレート管理コンポーネント: テンプレート削除失敗');
          setMessage('テンプレートの削除に失敗しました');
        }
        
        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        uiLogger.error('テンプレート管理コンポーネント: テンプレート削除エラー', error);
        setMessage('テンプレートの削除に失敗しました');
      }
    }
  };
  
  // テンプレート適用の確認ダイアログを表示
  const openApplyTemplateDialog = useCallback((templateId, templateName) => {
    setSelectedTemplateId(templateId);
    setSelectedTemplateName(templateName);
    setClearExistingData(hasExistingSchedule()); // データが存在する場合はデフォルトでクリアオプションをオン
    setIsConfirmDialogOpen(true);
  }, [hasExistingSchedule]);

  // ダイアログを閉じる
  const closeConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setSelectedTemplateId(null);
    setSelectedTemplateName('');
    setClearExistingData(false);
  }, []);

  // テンプレート適用を実行
  const executeApplyTemplate = useCallback(async () => {
    if (!selectedTemplateId) return;
    
    try {
      uiLogger.info('テンプレート管理コンポーネント: テンプレート適用開始', {
        ID: selectedTemplateId,
        名前: selectedTemplateName,
        データクリア: clearExistingData
      });
      
      // データクリアオプションを指定してテンプレートを適用
      const success = await applyTemplate(selectedTemplateId, clearExistingData);
      
      if (success) {
        uiLogger.info('テンプレート管理コンポーネント: テンプレート適用成功', {
          ID: selectedTemplateId,
          名前: selectedTemplateName
        });
        setMessage(`テンプレート "${selectedTemplateName}" を適用しました`);
      } else {
        uiLogger.error('テンプレート管理コンポーネント: テンプレート適用失敗');
        setMessage('テンプレートの適用に失敗しました');
      }
      
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      uiLogger.error('テンプレート管理コンポーネント: テンプレート適用エラー', error);
      setMessage('テンプレートの適用中にエラーが発生しました');
    } finally {
      closeConfirmDialog();
    }
  }, [selectedTemplateId, selectedTemplateName, clearExistingData, applyTemplate, closeConfirmDialog]);
  
  // テンプレート適用ボタンのハンドラ
  const handleApplyTemplate = (templateId, templateName) => {
    openApplyTemplateDialog(templateId, templateName);
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
                          uiLogger.error('テンプレート管理コンポーネント: 日付フォーマットエラー', error);
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
      
      {/* テンプレート適用確認ダイアログ */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={executeApplyTemplate}
        title="テンプレート適用の確認"
        message={
          <>
            <p className="mb-2">テンプレート <span className="font-bold text-blue-600">{selectedTemplateName}</span> を適用します。</p>
            
            {hasExistingSchedule() && (
              <div className="mb-3 p-2 bg-yellow-50 rounded">
                <p className="mb-1 text-sm">現在の週 <span className="font-bold">{getWeekRangeText()}</span> には予定が登録されています。</p>
                
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="clearData" 
                    checked={clearExistingData} 
                    onChange={() => setClearExistingData(!clearExistingData)}
                    className="mr-2"
                  />
                  <label htmlFor="clearData" className="text-sm font-medium">
                    先に既存データを削除してからテンプレートを適用する
                  </label>
                </div>
                
                {clearExistingData && (
                  <p className="text-xs text-red-500 mt-1">※ 現在の予定と実績データが全て削除されます。この操作は元に戻せません。</p>
                )}
              </div>
            )}
            
            <p className="text-sm">続行しますか？</p>
          </>
        }
        confirmText="適用する"
        cancelText="キャンセル"
        confirmButtonClass="bg-blue-500 hover:bg-blue-600"
      />
    </div>
  );
};

export default TemplateManager;