import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase の設定
// 重要：正確な値を使用してください
const firebaseConfig = {
  apiKey: "AIzaSyCi9zffZ9DKqlH20MlYlMOdgIcgyWYsqdk",
  authDomain: "history-9a233.firebaseapp.com",
  projectId: "history-9a233",
  storageBucket: "history-9a233.appspot.com",
  messagingSenderId: "628189169902",
  appId: "1:628189169902:web:fc8d5279045f1771498bff",
  measurementId: "G-D1T96ND9ZE"
};

// コレクションID
export const COLLECTION_ID = 'learning-app';

// Firebase 初期化
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase auth initialized:", auth ? "success" : "failed");
