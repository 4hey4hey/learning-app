import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePokemonAchievement } from '../../contexts/PokemonAchievementContext';
import SyncStatusIndicator from '../Sync/SyncStatusIndicator';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { pokemonCollection } = usePokemonAchievement();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 獲得済みポケモン数を計算
  const collectedCount = pokemonCollection ? pokemonCollection.filter(pokemon => pokemon.collected).length : 0;

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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:h-16">
            <div className="flex items-center justify-between py-3 sm:py-0">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <img src="/logo.png" alt="Studyplan" className="h-14 sm:h-16" />
              </Link>
              
              <div className="flex sm:hidden items-center space-x-2">
                <SyncStatusIndicator />
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  ログアウト
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row">
              <nav className="flex overflow-x-auto pb-1 sm:pb-0 sm:ml-10 sm:items-center space-x-2 sm:space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ダッシュボード
                </Link>
                <Link
                  to="/analytics"
                  className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    location.pathname === '/analytics'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  学習分析
                </Link>
                <Link
                  to="/pokemon-collection"
                  className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                    location.pathname === '/pokemon-collection'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span>ポケモン</span>
                  {collectedCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" title="獲得済みポケモン数">{collectedCount}</span>
                  )}
                </Link>
                <Link
                  to="/settings"
                  className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    location.pathname === '/settings'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  設定
                </Link>
              </nav>
              
              <div className="hidden sm:flex items-center space-x-3">
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