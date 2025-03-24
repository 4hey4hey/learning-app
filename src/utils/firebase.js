import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


// コレクションID
export const COLLECTION_ID = 'learning-app';

// Firebase 初期化
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase auth initialized:", auth ? "success" : "failed");
