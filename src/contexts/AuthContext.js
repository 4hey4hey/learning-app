// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  collection
} from 'firebase/firestore';

// 認証エラーコードとメッセージのマッピング
const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
  'auth/invalid-email': '無効なメールアドレス形式です。',
  'auth/user-disabled': 'このアカウントは無効化されています。',
  'auth/user-not-found': 'アカウントが見つかりません。',
  'auth/wrong-password': 'パスワードが正しくありません。',
  'auth/weak-password': 'パスワードが弱すぎます。もっと強固なパスワードを設定してください。',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません。',
  'auth/network-request-failed': 'ネットワーク接続に問題があります。接続を確認してください。',
  'auth/too-many-requests': 'ログイン試行回数が多すぎます。しばらく時間を置いてからお試しください。',
  'auth/operation-not-allowed': 'この操作は許可されていません。管理者に問い合わせてください。',
  'auth/popup-closed-by-user': '認証ポップアップが閉じられました。再度お試しください。',
  'auth/unauthorized-domain': 'このドメインでの認証は許可されていません。'
};

// 初期カテゴリデータ
const INITIAL_CATEGORIES = [
  { name: '国語', color: '#FF5252' },
  { name: '数学', color: '#4CAF50' },
  { name: '英語', color: '#2196F3' },
  { name: '理科', color: '#FFC107' },
  { name: '社会', color: '#9C27B0' }
];

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // エラーメッセージ生成の共通関数
  const getAuthErrorMessage = (error) => {
    console.error('認証エラー:', error.code, error.message);
    return AUTH_ERROR_MESSAGES[error.code] || `認証エラー: ${error.message}`;
  };

  // ユーザードキュメント作成・更新の安全な関数
  const safeUpdateUserDoc = useCallback(async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const updateData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        lastLogin: serverTimestamp(),
        ...additionalData
      };

      // ドキュメントの存在確認
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // 新規ユーザーの場合
        updateData.createdAt = serverTimestamp();
        await setDoc(userRef, updateData);
        
        // 初期カテゴリの作成
        const categoriesRef = collection(db, `users/${user.uid}/categories`);
        
        for (const category of INITIAL_CATEGORIES) {
          const newCategoryRef = doc(categoriesRef);
          await setDoc(newCategoryRef, {
            ...category,
            createdAt: serverTimestamp()
          });
        }
      } else {
        // 既存ユーザーの場合
        await updateDoc(userRef, updateData);
      }
      
      return true;
    } catch (error) {
      console.error('ユーザードキュメント更新エラー:', error);
      throw error;
    }
  }, []);

  // ログイン処理
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      setError(null);
      
      // rememberMeオプションが有効な場合、認証情報を永続化
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ユーザードキュメントの更新
      try {
        await safeUpdateUserDoc(user, { lastLogin: serverTimestamp() });
      } catch (updateError) {
        console.warn('ユーザードキュメントの更新に失敗:', updateError);
      }
      
      return user;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, [safeUpdateUserDoc]);

  // サインアップ処理
  const signup = useCallback(async (email, password, displayName) => {
    try {
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // プロフィール更新
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // ユーザードキュメント作成
      await safeUpdateUserDoc(user);
      
      return user;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, [safeUpdateUserDoc]);

  // ログアウト処理
  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      return true;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, []);

  // パスワードリセット
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, []);



  // 認証状態の監視
  useEffect(() => {
    let unsubscribe = () => {};
    
    const initAuth = async () => {
      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            if (user) {
              const userRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userRef);
              
              if (!userDoc.exists()) {
                await safeUpdateUserDoc(user);
              }

              setCurrentUser({
                ...user,
                ...(userDoc.exists() ? userDoc.data() : {})
              });
            } else {
              setCurrentUser(null);
            }
          } catch (error) {
            console.error('認証状態チェック中のエラー:', error);
            setCurrentUser(null);
            setError(getAuthErrorMessage(error));
          } finally {
            setLoading(false);
          }
        }, (authError) => {
          console.error('認証リスナーエラー:', authError);
          setLoading(false);
          setError(getAuthErrorMessage(authError));
        });
      } catch (error) {
        console.error('認証状態監視の設定エラー:', error);
        setLoading(false);
        setError(getAuthErrorMessage(error));
      }
    };
    
    initAuth();
    
    // クリーンアップ関数
    return () => unsubscribe();
  }, [safeUpdateUserDoc]);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    loading,
    error,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};