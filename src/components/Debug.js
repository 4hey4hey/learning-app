import React from 'react';

const Debug = () => {
  return (
    <div className="fixed top-0 left-0 bg-red-100 p-2 z-50 text-xs">
      <p>デバッグモード - アプリが読み込まれています</p>
      <p>現在時刻: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default Debug;
