// src/contexts/TemplateContext.js

// テンプレート管理のための専用コンテキスト
// このコンテキストはスケジュールテンプレートの保存・適用・管理を担当します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useSchedule } from './ScheduleContext';
import { useDataDeletion } from '../hooks/useDataDeletion';
import { getWeekStartDate, getWeekIdentifier, generateScheduleKey } from '../utils/timeUtils';
import { templateLogger } from '../utils/loggerUtils';

// コンテキスト作成
const TemplateContext = createContext();

// テンプレートコンテキストを使用するためのカスタムフック
export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
};

export const TemplateProvider = ({ children }) => {
  const { currentUser, demoMode } = useAuth();
  const { getCollection, setDocument, deleteDocument } = useFirestore();
  const { schedule, selectedWeek, fetchSchedule } = useSchedule();
  const { clearWeekData } = useDataDeletion();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // テンプレート一覧を取得
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    templateLogger.info('テンプレート一覧取得開始');
    
    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const storedTemplates = localStorage.getItem('demo_templates');
        
        if (storedTemplates) {
          try {
            const parsedTemplates = JSON.parse(storedTemplates);
            setTemplates(parsedTemplates);
            templateLogger.debug('ローカルストレージからテンプレート取得成功', {
              テンプレート数: parsedTemplates.length
            });
            return parsedTemplates;
          } catch (parseError) {
            templateLogger.error('テンプレートのパースエラー:', parseError);
          }
        }
        
        // データがない場合は空の配列を設定
        setTemplates([]);
        return [];
      }
      
      // 認証済みユーザーの場合はFirestoreから取得
      if (currentUser) {
        const templatesData = await getCollection('templates');
        
        // テンプレートの日付情報を正規化
        const processedTemplates = templatesData.map(template => {
          // createdAtがタイムスタンプの場合はDateに変換
          if (template.createdAt && typeof template.createdAt.toDate === 'function') {
            return {
              ...template,
              createdAt: template.createdAt.toDate()
            };
          }
          return template;
        });
        
        setTemplates(processedTemplates);
        templateLogger.debug('Firestoreからテンプレート取得成功', {
          テンプレート数: processedTemplates.length
        });
        return processedTemplates;
      }
      
      // 未認証かつデモモードでない場合は空の配列を返す
      setTemplates([]);
      return [];
    } catch (error) {
      templateLogger.error('テンプレート取得エラー:', error);
      setError('テンプレートの取得中にエラーが発生しました。');
      setTemplates([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, getCollection]);

  // 予定情報のみを抽出する関数
  const extractScheduleDataOnly = useCallback((scheduleData) => {
    if (!scheduleData) return {};
    
    const cleanSchedule = {};
    
    // 各曜日のデータを処理
    for (const dayKey in scheduleData) {
      if (!scheduleData[dayKey]) continue;
      
      cleanSchedule[dayKey] = {};
      
      // 各時間枠を処理
      for (const hourKey in scheduleData[dayKey]) {
        const item = scheduleData[dayKey][hourKey];
        
        if (item && item.categoryId) {
          // 予定情報のみを抽出（カテゴリIDと日付のみ）
          cleanSchedule[dayKey][hourKey] = {
            id: item.id,
            categoryId: item.categoryId,
            date: item.date
          };
        } else {
          cleanSchedule[dayKey][hourKey] = null;
        }
      }
    }
    
    return cleanSchedule;
  }, []);

  // テンプレートを保存
  const saveTemplate = useCallback(async (name, customSchedule = null) => {
    if (!name) {
      setError('テンプレート名は必須です。');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    templateLogger.info('テンプレート保存開始:', { 名前: name });
    
    try {
      // 保存するスケジュールデータ（指定がなければ現在のスケジュール）
      const rawSchedule = customSchedule || schedule;
      
      // 予定情報のみを抽出（実績情報は含めない）
      const cleanSchedule = extractScheduleDataOnly(rawSchedule);
      
      templateLogger.debug('テンプレート保存データ:', {
        元のスケジュール項目数: countScheduleItems(rawSchedule),
        クリーンスケジュール項目数: countScheduleItems(cleanSchedule)
      });
      
      // テンプレートID生成
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // テンプレートデータ作成
      const templateData = {
        id: templateId,
        name,
        schedule: cleanSchedule,
        createdAt: new Date()
      };
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        // 現在のテンプレート一覧を取得
        const storedTemplates = localStorage.getItem('demo_templates');
        const currentTemplates = storedTemplates ? JSON.parse(storedTemplates) : [];
        
        // テンプレートを追加
        currentTemplates.push(templateData);
        
        // ローカルストレージに保存
        localStorage.setItem('demo_templates', JSON.stringify(currentTemplates));
        
        // ステートの更新
        setTemplates(currentTemplates);
        templateLogger.info('テンプレートをローカルストレージに保存:', templateId);
        return templateData;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        await setDocument('templates', templateId, {
          name,
          schedule: cleanSchedule,
          createdAt: serverTimestamp()
        });
        
        templateLogger.info('テンプレートをFirestoreに保存:', templateId);
        
        // テンプレート一覧を再取得
        await fetchTemplates();
        return templateData;
      }
      
      return null;
    } catch (error) {
      templateLogger.error('テンプレート保存エラー:', error);
      setError('テンプレートの保存中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, schedule, setDocument, fetchTemplates, extractScheduleDataOnly]);

  // テンプレートを削除
  const deleteTemplate = useCallback(async (templateId) => {
    if (!templateId) {
      setError('テンプレートIDは必須です。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    templateLogger.info('テンプレート削除開始:', templateId);
    
    try {
      // デモモードの場合はローカルストレージから削除
      if (demoMode) {
        // 現在のテンプレート一覧を取得
        const storedTemplates = localStorage.getItem('demo_templates');
        if (!storedTemplates) return true;
        
        const currentTemplates = JSON.parse(storedTemplates);
        
        // テンプレートを削除
        const updatedTemplates = currentTemplates.filter(template => template.id !== templateId);
        
        // ローカルストレージに保存
        localStorage.setItem('demo_templates', JSON.stringify(updatedTemplates));
        
        // ステートの更新
        setTemplates(updatedTemplates);
        templateLogger.info('テンプレートをローカルストレージから削除:', templateId);
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreから削除
      if (currentUser) {
        await deleteDocument('templates', templateId);
        
        templateLogger.info('テンプレートをFirestoreから削除:', templateId);
        
        // テンプレート一覧を再取得
        await fetchTemplates();
        return true;
      }
      
      return false;
    } catch (error) {
      templateLogger.error('テンプレート削除エラー:', error);
      setError('テンプレートの削除中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, deleteDocument, fetchTemplates]);

  // テンプレートを適用
  const applyTemplate = useCallback(async (templateId, clearExistingData = false) => {
    if (!templateId) {
      setError('テンプレートIDは必須です。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    templateLogger.info('テンプレート適用開始:', { 
      テンプレートID: templateId, 
      データクリア: clearExistingData 
    });
    
    try {
      // 既存データのクリアが要求された場合、先にクリア実行
      if (clearExistingData) {
        templateLogger.info('既存データのクリア開始');
        const clearResult = await clearWeekData(selectedWeek);
        
        if (!clearResult) {
          templateLogger.error('既存データのクリア失敗');
          setError('既存データのクリアに失敗しました。');
          return false;
        }
        
        templateLogger.info('既存データのクリア成功');
      }
      // テンプレートを検索
      const targetTemplate = templates.find(template => template.id === templateId);
      
      if (!targetTemplate || !targetTemplate.schedule) {
        templateLogger.error('テンプレートが見つからないか、無効です:', templateId);
        setError('テンプレートが見つからないか、無効です。');
        return false;
      }
      
      // 現在の週の開始日を取得
      const weekStart = getWeekStartDate(selectedWeek);
      const weekKey = getWeekIdentifier(weekStart);
      
      // テンプレートのスケジュールを現在の週に適用（日付を調整）
      const templateSchedule = targetTemplate.schedule;
      const adjustedSchedule = {};
      
      // テンプレートのスケジュールアイテム数をカウント
      let templateItemCount = 0;
      for (const day in templateSchedule) {
        for (const hour in templateSchedule[day]) {
          if (templateSchedule[day][hour] && templateSchedule[day][hour].categoryId) {
            templateItemCount++;
          }
        }
      }
      
      // デバッグ用にテンプレートの情報を確認
      templateLogger.debug('テンプレート適用前確認:', {
        週の開始日: weekStart,
        週のID: weekKey,
        スケジュールキー数: Object.keys(templateSchedule).length,
        アイテム数: templateItemCount
      });
      
      // 各曜日のスケジュールを処理
      for (let i = 1; i <= 7; i++) {
        const dayKey = `day${i}`;
        adjustedSchedule[dayKey] = {};
        
        // この曜日がテンプレートに存在するか確認
        if (templateSchedule[dayKey]) {
          // その日の日付を計算 - 週の開始日からの日数を加算
          const dayDate = new Date(weekStart.getTime()); // 確実にコピーする
          dayDate.setDate(weekStart.getDate() + (i - 1));
          // 時刻部分を確実にリセット
          dayDate.setHours(0, 0, 0, 0);
          
          // 各時間枠を処理
          for (let hour = 9; hour <= 22; hour++) {
            const hourKey = `hour${hour}`;
            
            // テンプレートにこの時間枠が存在するか確認
            if (templateSchedule[dayKey][hourKey] && templateSchedule[dayKey][hourKey].categoryId) {
              const item = templateSchedule[dayKey][hourKey];
              
              // ここで新しい日付オブジェクトを作成
              const newDate = new Date(dayDate.getTime()); // 確実にコピーする
              newDate.setHours(0, 0, 0, 0);
              
              // 新しいスケジュールIDを生成
              const newId = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              
              // 日付を現在の週に合わせて調整した新しいスケジュールアイテムを作成
              adjustedSchedule[dayKey][hourKey] = {
                id: newId,
                categoryId: item.categoryId,
                date: newDate
              };
            } else {
              // スケジュール項目が存在しない場合はnullを設定
              adjustedSchedule[dayKey][hourKey] = null;
            }
          }
        }
      }
      
      // 適用後のスケジュールアイテム数をカウント
      let totalItems = 0;
      for (const day in adjustedSchedule) {
        for (const hour in adjustedSchedule[day]) {
          if (adjustedSchedule[day][hour] && adjustedSchedule[day][hour].categoryId) {
            totalItems++;
          }
        }
      }
      
      // 変換後のスケジュールの確認
      templateLogger.debug('適用後のスケジュール確認:', {
        週のID: weekKey,
        アイテム数: totalItems
      });
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        localStorage.setItem(`demo_schedule_${weekKey}`, JSON.stringify(adjustedSchedule));
        
        templateLogger.info('テンプレートをローカルストレージに適用:', { 
          テンプレートID: templateId,
          テンプレート名: targetTemplate.name
        });
        
        // スケジュールを再取得
        await fetchSchedule(weekStart);
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        await setDocument('schedules', weekKey, adjustedSchedule);
        
        templateLogger.info('テンプレートをFirestoreに適用:', { 
          テンプレートID: templateId, 
          テンプレート名: targetTemplate.name 
        });
        
        // スケジュールを再取得
        await fetchSchedule(weekStart);
        return true;
      }
      
      return false;
    } catch (error) {
      templateLogger.error('テンプレート適用エラー:', error);
      setError('テンプレートの適用中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, templates, selectedWeek, setDocument, fetchSchedule, clearWeekData]);

  // スケジュール項目数をカウントするヘルパー関数
  function countScheduleItems(schedule) {
    if (!schedule) return 0;
    
    let count = 0;
    for (const day in schedule) {
      if (!schedule[day]) continue;
      
      for (const hour in schedule[day]) {
        if (schedule[day][hour] && schedule[day][hour].categoryId) {
          count++;
        }
      }
    }
    return count;
  }

  // コンポーネントマウント時にテンプレート一覧を取得
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // コンテキスト値
  const value = {
    templates,
    loading,
    error,
    fetchTemplates,
    saveTemplate,
    deleteTemplate,
    applyTemplate
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};