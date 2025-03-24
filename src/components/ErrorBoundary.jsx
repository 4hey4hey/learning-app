// src/components/ErrorBoundary.jsx

import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // エラー発生時に状態を更新
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // エラー情報をログに記録
    console.error('アプリケーションエラー:', error);
    console.error('コンポーネントスタック:', errorInfo.componentStack);
    
    // エラー情報を状態に保存
    this.setState({
      errorInfo
    });
    
    // エラーロギングサービスにエラーを送信することも可能
    // この例ではコンソールに出力するだけ
  }

  handleRetry = () => {
    // アプリケーションを再読み込み
    window.location.href = '/';
  }

  render() {
    // エラーが発生した場合はフォールバックUIを表示
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                エラーが発生しました
              </h1>
              
              <p className="mt-2 text-gray-600">
                申し訳ありませんが、アプリケーションでエラーが発生しました。
              </p>
              
              <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200 text-left">
                <p className="text-sm font-mono text-red-800 whitespace-pre-wrap">
                  {this.state.error && (this.state.error.toString())}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium text-red-700 cursor-pointer">
                      詳細情報
                    </summary>
                    <p className="mt-1 text-xs font-mono text-red-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </p>
                  </details>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={this.handleRetry}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  アプリケーションを再起動
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // エラーがなければ子コンポーネントを通常通り表示
    return this.props.children;
  }
}

export default ErrorBoundary;