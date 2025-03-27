import { useState, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { useFirestore } from '../useFirestore';
import { generateEmptyWeekSchedule, formatDateToString, getWeekStartDate, getWeekIdentifier } from '../../utils/timeUtils';

/**
 * テンプレート管理カスタムフック
 * スケジュールテンプレートの保存、適用、削除を管理
 * @param {Function} fetchSchedule - スケジュール取得関数
 * @param {Date} selectedWeek - 選択中の週
 */
export const useTemplateManagement = (fetchSchedule, selectedWeek) => {
  const { currentUser } = useAuth();
  const { getCollection, setDocument, deleteDocument, loading: firestoreLoading } = useFirestore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * データの変更を検出する関数
   * @param {Object} oldData - 変更前のデータ
   * @param {Object} newData - 変更後のデータ
   * @returns {boolean} 変更があるかどうか
   */
  const hasChanges = useCallback((oldData, newData) => {
    if (!oldData && !newData) return false;
    if (!oldData || !newData) return true;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }, []);

  /**
   * スケジュールの構造を検証して修復する関数
   * @param {Object} inputSchedule - 入力スケジュール
   * @returns {Object} 修復されたスケジュール
   */
  const validateAndFixScheduleStructure = (inputSchedule) => {
    const days = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
    const hours = Array.from({ length: 14 }, (_, i) => `hour${i + 9}`);
    const emptySchedule = generateEmptyWeekSchedule();
    
    // 入力がオブジェクトでない場合は空のスケジュールを返す
    if (!inputSchedule || typeof inputSchedule !== 'object') {
      return emptySchedule;
    }
    
    // 正しい構造を持つスケジュールを作成
    const fixedSchedule = { ...emptySchedule };
    
    // 各曜日と時間のデータを検証して修復
    days.forEach(day => {
      if (inputSchedule[day] && typeof inputSchedule[day] === 'object') {
        hours.forEach(hour => {
          if (inputSchedule[day][hour] !== undefined) {
            fixedSchedule[day][hour] = inputSchedule[day][hour];
          }
        });
      }
    });
    
    return fixedSchedule;
  };

  /**
   * 日付データの検証と修復
   * @param {Object} template - テンプレートデータ
   * @returns {Object} 修復されたテンプレートデータ
   */
  const validateTemplateDate = (template) => {
    if (!template) return template;
    
    try {
      let createdAt = template.createdAt;
      
      // createdAtが無効な場合は現在時刻で修復
      if (!createdAt) {
        createdAt = new Date();
      } else if (!(createdAt instanceof Date)) {
        try {
          const dateObj = new Date(createdAt);
          if (isNaN(dateObj.getTime())) {
            createdAt = new Date(); // 無効な日付の場合は現在時刻に置き換え
          } else {
            createdAt = dateObj;
          }
        } catch (e) {
          createdAt = new Date();
        }
      }
      
      return {
        ...template,
        createdAt,
        schedule: validateAndFixScheduleStructure(template.schedule)
      };
    } catch (error) {
      console.error('テンプレート日付検証エラー:', error);
      return {
        ...template,
        createdAt: new Date(),
        schedule: validateAndFixScheduleStructure(template.schedule)
      };
    }
  };

  /**
   * テンプレートデータの取得
   * @returns {Promise<Array>} テンプレートの配列
   */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    
    try {
      if (currentUser) {
        // Firestoreからテンプレートを取得
        const templatesData = await getCollection('templates');
        
        // テンプレートがない場合はデフォルトを作成しない（ユーザーが必要に応じて作成する）
        if (!templatesData || templatesData.length === 0) {
          setTemplates([]);
          return [];
        }
        
        // テンプレート内のスケジュール構造と日付を検証して修復
        const validatedTemplates = templatesData.map(template => validateTemplateDate(template));
        
        // 日付の新しい順で並び替え
        validatedTemplates.sort((a, b) => {
          try {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return b.createdAt - a.createdAt; // 降順に並べる
          } catch (error) {
            return 0;
          }
        });
        
        setTemplates(validatedTemplates);
        return validatedTemplates;
      }
      
      // ユーザーがログインしていない場合は空の配列を返す
      setTemplates([]);
      return [];
    } catch (error) {
      console.error('テンプレート取得エラー:', error);
      setTemplates([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCollection]);

  /**
   * 新しいテンプレートの保存
   * @param {string} name - テンプレート名
   * @param {Object} schedule - スケジュールデータ
   * @returns {Promise<string>} 保存されたテンプレートのID
   */
  const saveTemplate = useCallback(async (name, schedule) => {
    if (!name) {
      throw new Error('テンプレート名は必須です');
    }
    
    setLoading(true);
    
    try {
      // スケジュール構造を検証して修復
      const validatedSchedule = validateAndFixScheduleStructure(schedule);
      
      // テンプレートIDを生成
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 現在時刻を生成し、確実に有効な日付を置く
      let createdAt = new Date();
      
      // 日付が無効な場合はタイムスタンプを使用
      if (isNaN(createdAt.getTime())) {
        console.warn('日付生成エラー、エポック時間を使用します');
        const timestamp = Date.now();
        createdAt = new Date(timestamp);
      }
      
      // テンプレートデータを作成
      const templateData = {
        name,
        schedule: validatedSchedule,
        createdAt: createdAt
      };
      
      // 新しいテンプレートを作成
      const newTemplate = {
        id: templateId,
        ...templateData
      };
      
      if (currentUser) {
        // テンプレートをFirestoreに保存
        await setDocument('templates', templateId, templateData);
      }
      
      // ローカルステートを更新
      setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
      return templateId;
    } catch (error) {
      console.error('テンプレート保存エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setDocument]);

  /**
   * テンプレートの適用
   * @param {string} templateId - テンプレートID
   * @returns {Promise<boolean>} 適用成功かどうか
   */
  const applyTemplate = useCallback(async (templateId) => {
    try {
      setLoading(true);
      
      // テンプレートを検索
      const template = templates.find(t => t.id === templateId);
      if (!template || !template.schedule) {
        console.error('有効なテンプレートが見つかりません');
        return false;
      }

      // スケジュール構造を検証して修復
      const validatedSchedule = validateAndFixScheduleStructure(template.schedule);

      // 現在表示中の週の開始日を取得し、正規化
      const normalizedWeekStart = getWeekStartDate(selectedWeek);
      normalizedWeekStart.setHours(0, 0, 0, 0);
      
      // 週識別子を取得
      const weekKey = getWeekIdentifier(normalizedWeekStart);
      const dateStr = weekKey;
      
      // 現在のスケジュールを取得
      let currentSchedule = null;
      if (currentUser) {
        try {
          currentSchedule = await getCollection('schedules').then(data => {
            return data.find(item => item.id === dateStr);
          });
        } catch (error) {
          console.error('現在のスケジュール取得エラー:', error);
        }
      } else {
        console.error('ユーザーがログインしていません');
      }
      
      // ディープコピーを作成
      const updatedSchedule = {};
      
      // 各曜日の予定に適切な日付を設定
      const days = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
      days.forEach((day, index) => {
        updatedSchedule[day] = {};
        const dayDate = new Date(normalizedWeekStart);
        dayDate.setDate(normalizedWeekStart.getDate() + index);
        // 時間部分を確実にリセット
        dayDate.setHours(0, 0, 0, 0);
        
        // その日の各時間の予定に日付を設定
        const validDaySchedule = validatedSchedule[day] || {};
        // 時間帯のキーを確実に設定
        const hours = Array.from({ length: 14 }, (_, i) => `hour${i + 9}`);
        
        // すべての時間帯について処理
        hours.forEach(hourKey => {
          // テンプレートに設定があればそれを使用、なければnull
          if (validDaySchedule[hourKey]) {
            updatedSchedule[day][hourKey] = {
              ...validDaySchedule[hourKey],
              date: dayDate,
              id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            };
          } else {
            updatedSchedule[day][hourKey] = null;
          }
        });
      });
      
      // スケジュールにカテゴリ情報が含まれているか確認
      const hasScheduleItems = Object.values(updatedSchedule).some(day => 
        Object.values(day).some(hour => hour && hour.categoryId)
      );
      
      if (!hasScheduleItems) {
        console.error('テンプレートに有効なスケジュールアイテムがありません');
        return false;
      }
      
      // 変更があるか確認
      const hasDataChanged = hasChanges(currentSchedule, updatedSchedule);
      
      if (!hasDataChanged) {
        console.log('実質的な変更がありません。保存をスキップします。');
        return true; // 変更がなくても成功とみなす
      }
      
      // 保存処理
      console.log('変更を検出しました。データを保存します。');
      console.log('スケジュールデータ:', dateStr);
      
      try {
        if (currentUser) {
          // スケジュールをFirestoreに保存
          await setDocument('schedules', dateStr, updatedSchedule);
        } else {
          console.log('ユーザーがログインしていないため、データを保存できません');
          return false;
        }
      } catch (saveError) {
        console.error('スケジュール保存エラー:', saveError);
        return false;
      }

      // スケジュールを再読み込み
      if (fetchSchedule) {
        try {
          const reloadedSchedule = await fetchSchedule(selectedWeek);
          console.log('スケジュールを再読み込み完了:', reloadedSchedule ? '成功' : '失敗');
        } catch (fetchError) {
          console.error('スケジュールの再読み込みエラー:', fetchError);
        }
      }

      return true;
    } catch (error) {
      console.error('テンプレート適用エラー:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, templates, selectedWeek, setDocument, fetchSchedule, getCollection, hasChanges]);

  /**
   * テンプレートの削除
   * @param {string} templateId - 削除するテンプレートのID
   * @returns {Promise<boolean>} 削除成功かどうか
   */
  const deleteTemplate = useCallback(async (templateId) => {
    if (!templateId) {
      throw new Error('テンプレートIDは必須です');
    }
    
    setLoading(true);
    
    try {
      if (currentUser) {
        // Firestoreからテンプレートを削除
        await deleteDocument('templates', templateId);
      } else {
        throw new Error('ユーザーがログインしていません');
      }
      
      // ローカルステートを更新
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
      return true;
    } catch (error) {
      console.error('テンプレート削除エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, deleteDocument]);

  return {
    templates,
    loading: loading || firestoreLoading,
    fetchTemplates,
    saveTemplate,
    applyTemplate,
    deleteTemplate
  };
};
