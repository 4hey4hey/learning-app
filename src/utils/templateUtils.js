import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTION_ID } from './firebase';
import { generateEmptyWeekSchedule } from './timeUtils';

// テンプレートを保存
export const saveTemplate = async (userId, templateName, schedule) => {
  try {
    // デモモードの場合はローカルストレージに保存
    if (userId === 'demo-user-id') {
      const templates = JSON.parse(localStorage.getItem('studyTemplates') || '[]');
      
      // 日付オブジェクトをJSON形式で保存可能な形式に変換
      const serializableSchedule = JSON.parse(JSON.stringify(schedule));
      
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        schedule: serializableSchedule,
        createdAt: new Date().toISOString()
      };
      
      templates.push(newTemplate);
      localStorage.setItem('studyTemplates', JSON.stringify(templates));
      return newTemplate;
    }
    
    // Firestoreに保存
    try {
      const templatesRef = collection(db, `${COLLECTION_ID}/users/${userId}/templates`);
      const docRef = await addDoc(templatesRef, {
        name: templateName,
        schedule,
        createdAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        name: templateName,
        schedule,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error saving template to Firestore:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
};

// テンプレート一覧を取得
export const getTemplates = async (userId) => {
  try {
    // デモモードの場合はローカルストレージから取得
    if (userId === 'demo-user-id') {
      try {
        const templates = JSON.parse(localStorage.getItem('studyTemplates') || '[]');
        
        // 日付文字列をDate型に変換
        return templates.map(template => ({
          ...template,
          createdAt: new Date(template.createdAt)
        }));
      } catch (error) {
        console.error('Error parsing templates from localStorage:', error);
        return [];
      }
    }
    
    // Firestoreから取得
    try {
      const templatesRef = collection(db, `${COLLECTION_ID}/users/${userId}/templates`);
      const snapshot = await getDocs(templatesRef);
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      return templates;
    } catch (error) {
      console.error('Error getting templates from Firestore:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

// テンプレートを削除
export const deleteTemplate = async (userId, templateId) => {
  try {
    // デモモードの場合はローカルストレージから削除
    if (userId === 'demo-user-id') {
      try {
        const templates = JSON.parse(localStorage.getItem('studyTemplates') || '[]');
        const filteredTemplates = templates.filter(t => t.id !== templateId);
        localStorage.setItem('studyTemplates', JSON.stringify(filteredTemplates));
        return true;
      } catch (error) {
        console.error('Error deleting template from localStorage:', error);
        throw error;
      }
    }
    
    // Firestoreから削除
    try {
      await deleteDoc(doc(db, `${COLLECTION_ID}/users/${userId}/templates/${templateId}`));
      return true;
    } catch (error) {
      console.error('Error deleting template from Firestore:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
