// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase設定
// 注: 学習管理アプリケーション専用のFirebaseプロジェクトを作成し、
// そのプロジェクトの認証情報で以下を更新することを推奨します
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Firebase初期化
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase初期化成功');
} catch (error) {
  console.error('Firebase初期化エラー:', error);
  throw new Error('Firebaseの初期化に失敗しました。環境変数を確認してください。');
}

// Firebase サービスの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);
export let analytics;

// Analytics初期化はブラウザ環境でのみ実行
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Analytics初期化エラー:', error);
}

// 開発環境の場合はエミュレーターに接続
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Firebase エミュレーターに接続しました');
  } catch (error) {
    console.warn('Firebase エミュレーター接続エラー:', error);
  }
}

export default app;