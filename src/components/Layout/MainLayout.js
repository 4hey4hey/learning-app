import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SyncStatusIndicator from '../Sync/SyncStatusIndicator';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">勉強計画アプリ</span>
              </Link>
              <nav className="ml-10 flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ダッシュボード
                </Link>
                <Link
                  to="/analytics"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/analytics'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  学習分析
                </Link>
                <Link
                  to="/settings"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/settings'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  設定
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              {/* 同期状態インジケーター */}
              <SyncStatusIndicator />
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;