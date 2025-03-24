import { doc, setDoc, collection, getDocs, query, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTION_ID } from './firebase';

// アプリケーションの基本ドキュメントが存在するか確認し、ない場合は作成
export const initializeAppData = async () => {
  try {
    // コレクションのルートドキュメントを確認または作成
    const appDocRef = doc(db, COLLECTION_ID, 'config');
    await setDoc(appDocRef, {
      name: 'learning-app',
      version: '1.0.0',
      initialized: true,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    console.log('App initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing app data:', error);
    // エラーメッセージを表示するだけで処理は続行する
    return true;
  }
};

// 初期カテゴリを設定する (ユーザー登録時に呼び出す)
export const createInitialCategories = async (userId) => {
  try {
    const categoriesRef = collection(db, `${COLLECTION_ID}/users/${userId}/categories`);
    
    // 初期カテゴリの作成
    const initialCategories = [
      { name: '国語', color: '#FF5252', createdAt: serverTimestamp() },
      { name: '数学', color: '#4CAF50', createdAt: serverTimestamp() },
      { name: '英語', color: '#2196F3', createdAt: serverTimestamp() },
      { name: '理科', color: '#FFC107', createdAt: serverTimestamp() },
      { name: '社会', color: '#9C27B0', createdAt: serverTimestamp() },
    ];
    
    // バッチ処理ではなく個別に作成する (シンプルに)
    for (const category of initialCategories) {
      await setDoc(doc(categoriesRef), category);
    }
    
    console.log('Initial categories created successfully');
    return true;
  } catch (error) {
    console.error('Error creating initial categories:', error);
    // エラーが発生してもユーザー登録は続行
    return true;
  }
};
