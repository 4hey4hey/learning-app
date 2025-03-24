import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { signup, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();

  // Firebaseエラーコードを日本語メッセージに変換する関数
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
      'auth/weak-password': 'パスワードは6文字以上で設定してください',
      'auth/invalid-email': '有効なメールアドレスを入力してください',
      'auth/operation-not-allowed': 'メール/パスワードでの登録が無効になっています',
      'auth/network-request-failed': 'ネットワークエラーが発生しました。インターネット接続を確認してください',
      'auth/configuration-not-found': 'Firebase設定エラー: このブラウザからの認証が許可されていません'
    };
    
    return errorMessages[errorCode] || 'アカウント作成中にエラーが発生しました';
  };

  useEffect(() => {
    // 認証コンテキストからのエラーをローカルのエラーステートに反映
    if (authError) {
      setError(getErrorMessage(authError.code) || authError.message);
    }
  }, [authError]);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const validatePassword = (password) => {
    // パスワード強度チェック
    if (password.length < 6) {
      return 'パスワードは6文字以上である必要があります';
    }
    
    // 大文字、小文字、数字の組み合わせを推奨
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return '推奨: 大文字、小文字、数字を組み合わせるとより安全です';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // フォーム入力のバリデーション
    if (!displayName.trim()) {
      return setError('ユーザー名を入力してください');
    }
    
    if (!email.trim()) {
      return setError('メールアドレスを入力してください');
    }
    
    // パスワード一致チェック
    if (password !== confirmPassword) {
      return setError('パスワードが一致しません');
    }
    
    // パスワード強度チェック
    const passwordError = validatePassword(password);
    if (passwordError && passwordError.includes('必要があります')) {
      return setError(passwordError);
    }
    
    try {
      setError('');
      setSuccessMessage('');
      setLoading(true);
      
      await signup(email, password, displayName);
      setSuccessMessage('アカウントが作成されました！ダッシュボードにリダイレクトします...');
      
      // 少し待ってからリダイレクト（成功メッセージを表示するため）
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('登録エラー:', error);
      setError(getErrorMessage(error.code) || error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            勉強計画アプリ
          </h1>
          <h2 className="mt-2 text-center text-xl font-bold text-gray-900">
            アカウント登録
          </h2>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
              ユーザー名
            </label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              required
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="ユーザー名"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // パスワード入力時にリアルタイムでバリデーション
                const passwordError = validatePassword(e.target.value);
                if (passwordError && !passwordError.includes('推奨')) {
                  setError(passwordError);
                } else if (error && error.includes('パスワード')) {
                  setError('');
                }
              }}
            />
            {password && validatePassword(password)?.includes('推奨') && (
              <p className="mt-1 text-xs text-yellow-600">
                {validatePassword(password)}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              パスワード（確認）
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="パスワード（確認）"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                // リアルタイムでパスワード一致をチェック
                if (password !== e.target.value) {
                  if (e.target.value && password.startsWith(e.target.value)) {
                    // まだ入力中なので何もしない
                  } else {
                    setError('パスワードが一致しません');
                  }
                } else {
                  if (error === 'パスワードが一致しません') {
                    setError('');
                  }
                }
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '登録中...' : 'アカウント登録'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              既にアカウントをお持ちの方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
