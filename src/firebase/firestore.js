// Firestoreデータ操作
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { db } from './config';

// オフラインサポートを有効化
export const enableOfflineSupport = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('オフラインサポートが有効化されました');
    return true;
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('オフラインサポートは複数タブで開いている場合には機能しません');
    } else if (error.code === 'unimplemented') {
      console.warn('現在のブラウザはオフラインサポートに対応していません');
    } else {
      console.error('オフラインサポート設定エラー:', error);
    }
    console.warn('オフラインサポートが無効です。オンライン接続が必要になります。');
    return false;
  }
};

// ユーザープロファイルの作成・更新
export const setUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('ユーザープロファイル更新エラー:', error);
    throw error;
  }
};

// ユーザープロファイルの取得
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('ユーザープロファイル取得エラー:', error);
    throw error;
  }
};

// データコレクションの取得（汎用関数）
export const getCollection = async (path, constraints = []) => {
  try {
    const collectionRef = collection(db, path);
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints) 
      : collectionRef;
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`コレクション取得エラー (${path}):`, error);
    throw error;
  }
};

// ドキュメントの取得（汎用関数）
export const getDocument = async (path, docId) => {
  try {
    const docRef = doc(db, path, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`ドキュメント取得エラー (${path}/${docId}):`, error);
    throw error;
  }
};

// ドキュメントの作成・更新（汎用関数）
export const setDocument = async (path, docId, data, merge = true) => {
  try {
    const docRef = doc(db, path, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge });
    return docId;
  } catch (error) {
    console.error(`ドキュメント保存エラー (${path}/${docId}):`, error);
    throw error;
  }
};

// ドキュメントの更新（汎用関数）
export const updateDocument = async (path, docId, data) => {
  try {
    const docRef = doc(db, path, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`ドキュメント更新エラー (${path}/${docId}):`, error);
    throw error;
  }
};

// ドキュメントの削除（汎用関数）
export const deleteDocument = async (path, docId) => {
  try {
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`ドキュメント削除エラー (${path}/${docId}):`, error);
    throw error;
  }
};
