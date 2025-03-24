import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 認証状態の確認
  return currentUser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
