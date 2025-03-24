import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTION_ID } from './firebase';

// 実績ステータスの定義
export const ACHIEVEMENT_STATUS = {
  COMPLETED: 'completed',    // 完了 (◎)
  PARTIAL: 'partial',        // 部分的に完了 (△)
  FAILED: 'failed',          // 未達成 (✗)
  PENDING: 'pending'         // 未記録
};

// 実績を記録
export const saveAchievement = async (userId, scheduleId, day, hour, status) => {
  try {
    // デモモードの場合はローカルストレージに保存
    if (userId === 'demo-user-id') {
      try {
        const achievements = JSON.parse(localStorage.getItem('studyAchievements') || '{}');
        const key = `${day}_${hour}`;
        
        if (!achievements[key]) {
          achievements[key] = {};
        }
        
        achievements[key] = {
          day,
          hour,
          status,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('studyAchievements', JSON.stringify(achievements));
        return { id: key, day, hour, status };
      } catch (error) {
        console.error('Error saving achievement to localStorage:', error);
        throw error;
      }
    }
    
    // Firestoreに保存
    try {
      // 既存のデータがあれば更新、なければ新規作成
      const achievementsRef = collection(db, `${COLLECTION_ID}/users/${userId}/achievements`);
      const q = query(
        achievementsRef,
        where('day', '==', day),
        where('hour', '==', hour)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // 既存のドキュメントを更新
        const docRef = doc(db, `${COLLECTION_ID}/users/${userId}/achievements/${snapshot.docs[0].id}`);
        await updateDoc(docRef, {
          status,
          updatedAt: serverTimestamp()
        });
        
        return {
          id: snapshot.docs[0].id,
          day,
          hour,
          status
        };
      } else {
        // 新しいドキュメントを作成
        const docRef = await addDoc(achievementsRef, {
          day,
          hour,
          scheduleId: scheduleId || null,
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return {
          id: docRef.id,
          day,
          hour,
          status
        };
      }
    } catch (error) {
      console.error('Error saving achievement to Firestore:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving achievement:', error);
    throw error;
  }
};

// 実績一覧を取得
export const getAchievements = async (userId, startDate, endDate) => {
  try {
    // デモモードの場合はローカルストレージから取得
    if (userId === 'demo-user-id') {
      try {
        const achievements = JSON.parse(localStorage.getItem('studyAchievements') || '{}');
        return Object.values(achievements);
      } catch (error) {
        console.error('Error getting achievements from localStorage:', error);
        return [];
      }
    }
    
    // Firestoreから取得
    try {
      const achievementsRef = collection(db, `${COLLECTION_ID}/users/${userId}/achievements`);
      
      let q = achievementsRef;
      if (startDate && endDate) {
        q = query(
          achievementsRef,
          where('updatedAt', '>=', startDate),
          where('updatedAt', '<=', endDate)
        );
      }
      
      const snapshot = await getDocs(q);
      const achievements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      
      return achievements;
    } catch (error) {
      console.error('Error getting achievements from Firestore:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

// 特定の週の実績を取得
export const getWeekAchievements = async (userId) => {
  try {
    const achievements = await getAchievements(userId);
    
    // デモモードまたはFirestoreから取得した全ての実績から、
    // day1-day7のものだけを抽出して返す
    const weekAchievements = {};
    
    achievements.forEach(achievement => {
      const { day, hour, status } = achievement;
      if (day && hour && status && day.startsWith('day') && parseInt(day.substring(3)) >= 1 && parseInt(day.substring(3)) <= 7) {
        if (!weekAchievements[day]) {
          weekAchievements[day] = {};
        }
        weekAchievements[day][hour] = status;
      }
    });
    
    return weekAchievements;
  } catch (error) {
    console.error('Error getting week achievements:', error);
    return {};
  }
};
