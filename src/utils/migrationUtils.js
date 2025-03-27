import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { formatDateToString, normalizeDate } from './timeUtils';

/**
 * ローカルストレージからFirestoreへデータを移行するユーティリティ
 */
export const DataMigration = {
  /**
   * ローカルストレージに保存されている学習データをチェック
   * @returns {Object} 移行可能なデータの概要
   */
  checkLocalData: () => {
    try {
      let migratableData = {
        categories: false,
        schedules: [],
        templates: false,
        achievements: []
      };
      
      // 全てのローカルストレージキーを取得
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        allKeys.push(localStorage.key(i));
      }
      
      // カテゴリデータのチェック
      if (allKeys.includes('studyCategories')) {
        const categoriesStr = localStorage.getItem('studyCategories');
        try {
          const categories = JSON.parse(categoriesStr);
          if (Array.isArray(categories) && categories.length > 0) {
            migratableData.categories = true;
          }
        } catch (error) {
          console.error('カテゴリデータのパースエラー:', error);
        }
      }
      
      // スケジュールデータのチェック
      const scheduleKeys = allKeys.filter(key => key.startsWith('studySchedule_'));
      migratableData.schedules = scheduleKeys.map(key => {
        const dateStr = key.replace('studySchedule_', '');
        return { key, dateStr };
      });
      
      // テンプレートデータのチェック
      if (allKeys.includes('studyTemplates')) {
        const templatesStr = localStorage.getItem('studyTemplates');
        try {
          const templates = JSON.parse(templatesStr);
          if (Array.isArray(templates) && templates.length > 0) {
            migratableData.templates = true;
          }
        } catch (error) {
          console.error('テンプレートデータのパースエラー:', error);
        }
      }
      
      // 実績データのチェック
      const achievementKeys = allKeys.filter(key => key.startsWith('studyAchievements_'));
      migratableData.achievements = achievementKeys.map(key => {
        const dateStr = key.replace('studyAchievements_', '');
        return { key, dateStr };
      });
      
      return migratableData;
    } catch (error) {
      console.error('ローカルデータチェックエラー:', error);
      return null;
    }
  },
  
  /**
   * カテゴリデータを移行
   * @param {string} userId - ユーザーID
   * @returns {Promise<boolean>} 成功したかどうか
   */
  migrateCategories: async (userId) => {
    try {
      const categoriesStr = localStorage.getItem('studyCategories');
      if (!categoriesStr) return false;
      
      const categories = JSON.parse(categoriesStr);
      if (!Array.isArray(categories) || categories.length === 0) return false;
      
      // 既存のFirestoreデータをチェック
      const categoriesRef = collection(db, `users/${userId}/categories`);
      const snapshot = await getDocs(categoriesRef);
      
      // すでにデータがある場合は上書きしない
      if (!snapshot.empty) {
        console.log('カテゴリデータはすでに存在します');
        return true;
      }
      
      // カテゴリをFirestoreに保存
      for (const category of categories) {
        // カテゴリIDを確実に文字列に変換
        const categoryId = String(category.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        
        // 日付をサーバータイムスタンプまたは現在の日付に正規化
        const createdAt = category.createdAt ? normalizeDate(category.createdAt) : null;
        
        await setDoc(doc(db, `users/${userId}/categories`, categoryId), {
          name: category.name,
          color: category.color,
          createdAt: createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`${categories.length}件のカテゴリデータを移行しました`);
      return true;
    } catch (error) {
      console.error('カテゴリ移行エラー:', error);
      return false;
    }
  },
  
  /**
   * スケジュールデータを移行
   * @param {string} userId - ユーザーID
   * @param {Array} scheduleKeys - 移行するスケジュールキーの配列
   * @returns {Promise<{success: boolean, migrated: number, failed: number}>} 移行結果
   */
  migrateSchedules: async (userId, scheduleKeys) => {
    let migrated = 0;
    let failed = 0;
    
    try {
      if (!Array.isArray(scheduleKeys) || scheduleKeys.length === 0) {
        return { success: false, migrated, failed };
      }
      
      for (const { key, dateStr } of scheduleKeys) {
        try {
          const scheduleStr = localStorage.getItem(key);
          if (!scheduleStr) {
            failed++;
            continue;
          }
          
          const schedule = JSON.parse(scheduleStr);
          
          // 既存のFirestoreデータをチェック
          const scheduleDocRef = doc(db, `users/${userId}/schedules`, dateStr);
          const scheduleDoc = await getDoc(scheduleDocRef);
          
          // すでにデータがある場合はスキップ
          if (scheduleDoc.exists()) {
            console.log(`スケジュール ${dateStr} はすでに存在します`);
            migrated++;
            continue;
          }
          
          // 日付データを正規化
          const processedSchedule = {};
          
          // 各曜日のデータを処理
          for (const dayKey in schedule) {
            processedSchedule[dayKey] = {};
            
            // 各時間のデータを処理
            for (const hourKey in schedule[dayKey]) {
              const item = schedule[dayKey][hourKey];
              
              if (item) {
                // 日付文字列をDateオブジェクトに変換
                if (item.date) {
                  item.date = normalizeDate(item.date);
                }
                
                processedSchedule[dayKey][hourKey] = item;
              } else {
                processedSchedule[dayKey][hourKey] = null;
              }
            }
          }
          
          // Firestoreに保存
          await setDoc(scheduleDocRef, {
            ...processedSchedule,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          migrated++;
        } catch (error) {
          console.error(`スケジュール ${dateStr} の移行エラー:`, error);
          failed++;
        }
      }
      
      console.log(`スケジュールデータ: ${migrated}件成功, ${failed}件失敗`);
      return { success: migrated > 0, migrated, failed };
    } catch (error) {
      console.error('スケジュール移行エラー:', error);
      return { success: false, migrated, failed };
    }
  },
  
  /**
   * テンプレートデータを移行
   * @param {string} userId - ユーザーID
   * @returns {Promise<boolean>} 成功したかどうか
   */
  migrateTemplates: async (userId) => {
    try {
      const templatesStr = localStorage.getItem('studyTemplates');
      if (!templatesStr) return false;
      
      const templates = JSON.parse(templatesStr);
      if (!Array.isArray(templates) || templates.length === 0) return false;
      
      // 既存のFirestoreデータをチェック
      const templatesRef = collection(db, `users/${userId}/templates`);
      const snapshot = await getDocs(templatesRef);
      
      // すでにデータがある場合は上書きしない
      if (!snapshot.empty) {
        console.log('テンプレートデータはすでに存在します');
        return true;
      }
      
      // テンプレートをFirestoreに保存
      for (const template of templates) {
        const templateId = template.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 日付データを正規化
        const processedSchedule = {};
        
        if (template.schedule) {
          // 各曜日のデータを処理
          for (const dayKey in template.schedule) {
            processedSchedule[dayKey] = {};
            
            // 各時間のデータを処理
            for (const hourKey in template.schedule[dayKey]) {
              const item = template.schedule[dayKey][hourKey];
              
              if (item) {
                // 日付文字列をDateオブジェクトに変換
                if (item.date) {
                  item.date = normalizeDate(item.date);
                }
                
                processedSchedule[dayKey][hourKey] = item;
              } else {
                processedSchedule[dayKey][hourKey] = null;
              }
            }
          }
        }
        
        // 作成日時を正規化
        const createdAt = template.createdAt ? normalizeDate(template.createdAt) : null;
        
        await setDoc(doc(db, `users/${userId}/templates`, templateId), {
          name: template.name,
          schedule: processedSchedule,
          createdAt: createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`${templates.length}件のテンプレートデータを移行しました`);
      return true;
    } catch (error) {
      console.error('テンプレート移行エラー:', error);
      return false;
    }
  },
  
  /**
   * 実績データを移行
   * @param {string} userId - ユーザーID
   * @param {Array} achievementKeys - 移行する実績キーの配列
   * @returns {Promise<{success: boolean, migrated: number, failed: number}>} 移行結果
   */
  migrateAchievements: async (userId, achievementKeys) => {
    let migrated = 0;
    let failed = 0;
    
    try {
      if (!Array.isArray(achievementKeys) || achievementKeys.length === 0) {
        return { success: false, migrated, failed };
      }
      
      for (const { key, dateStr } of achievementKeys) {
        try {
          const achievementsStr = localStorage.getItem(key);
          if (!achievementsStr) {
            failed++;
            continue;
          }
          
          const achievements = JSON.parse(achievementsStr);
          
          // 既存のFirestoreデータをチェック
          const achievementsDocRef = doc(db, `users/${userId}/achievements`, dateStr);
          const achievementsDoc = await getDoc(achievementsDocRef);
          
          // すでにデータがある場合はスキップ
          if (achievementsDoc.exists()) {
            console.log(`実績 ${dateStr} はすでに存在します`);
            migrated++;
            continue;
          }
          
          // 各実績アイテムを処理
          const processedAchievements = {};
          
          for (const achievementKey in achievements) {
            const achievement = achievements[achievementKey];
            
            if (achievement) {
              // 日付文字列をDateオブジェクトに変換
              if (achievement.date) {
                achievement.date = normalizeDate(achievement.date);
              }
              
              processedAchievements[achievementKey] = achievement;
            }
          }
          
          // Firestoreに保存
          await setDoc(achievementsDocRef, processedAchievements);
          
          migrated++;
        } catch (error) {
          console.error(`実績 ${dateStr} の移行エラー:`, error);
          failed++;
        }
      }
      
      console.log(`実績データ: ${migrated}件成功, ${failed}件失敗`);
      return { success: migrated > 0, migrated, failed };
    } catch (error) {
      console.error('実績移行エラー:', error);
      return { success: false, migrated, failed };
    }
  },
  
  /**
   * 全てのデータを移行
   * @param {string} userId - ユーザーID
   * @returns {Promise<{success: boolean, results: Object}>} 移行結果
   */
  migrateAllData: async (userId) => {
    try {
      // 移行可能なデータをチェック
      const migratableData = DataMigration.checkLocalData();
      if (!migratableData) {
        return { success: false, results: null };
      }
      
      const results = {
        categories: false,
        schedules: { migrated: 0, failed: 0 },
        templates: false,
        achievements: { migrated: 0, failed: 0 }
      };
      
      // カテゴリを移行
      if (migratableData.categories) {
        results.categories = await DataMigration.migrateCategories(userId);
      }
      
      // スケジュールを移行
      if (migratableData.schedules.length > 0) {
        const scheduleResult = await DataMigration.migrateSchedules(userId, migratableData.schedules);
        results.schedules = {
          migrated: scheduleResult.migrated,
          failed: scheduleResult.failed
        };
      }
      
      // テンプレートを移行
      if (migratableData.templates) {
        results.templates = await DataMigration.migrateTemplates(userId);
      }
      
      // 実績を移行
      if (migratableData.achievements.length > 0) {
        const achievementResult = await DataMigration.migrateAchievements(userId, migratableData.achievements);
        results.achievements = {
          migrated: achievementResult.migrated,
          failed: achievementResult.failed
        };
      }
      
      // 移行が成功したかどうか判定
      const success = results.categories || 
                      results.schedules.migrated > 0 || 
                      results.templates || 
                      results.achievements.migrated > 0;
      
      return { success, results };
    } catch (error) {
      console.error('データ移行エラー:', error);
      return { success: false, results: null };
    }
  },
  
  /**
   * ローカルストレージデータの削除
   * 移行完了後のクリーンアップなどに使用
   * @returns {boolean} 成功したかどうか
   */
  clearLocalData: () => {
    try {
      // 全てのローカルストレージキーを取得
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        allKeys.push(localStorage.key(i));
      }
      
      // 学習データ関連のキーをフィルタリング
      const studyKeys = allKeys.filter(key => 
        key === 'studyCategories' || 
        key === 'studyTemplates' || 
        key.startsWith('studySchedule_') || 
        key.startsWith('studyAchievements_')
      );
      
      // データの削除
      studyKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`${studyKeys.length}件のローカルデータを削除しました`);
      return true;
    } catch (error) {
      console.error('ローカルデータ削除エラー:', error);
      return false;
    }
  }
};
