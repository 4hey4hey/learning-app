/**
 * 非常にシンプルなモーダル表示関数
 * モジュールのインポートや複雑なロジックに依存せず、直接DOMを操作する
 */
export function showSimpleModal(title, message, imageUrl) {
  // 既存のモーダルがあれば削除
  const existingModal = document.getElementById('super-simple-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // 新しいモーダル要素を作成
  const modal = document.createElement('div');
  modal.id = 'super-simple-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999999;
  `;
  
  // モーダルの内容
  modal.innerHTML = `
    <div style="
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    ">
      <h2 style="
        font-size: 24px;
        margin-bottom: 16px;
      ">${title || 'マイルストーン達成'}</h2>
      
      ${imageUrl ? `
        <div style="margin: 16px 0;">
          <img 
            src="${imageUrl}" 
            alt="${title}" 
            style="max-width: 150px; max-height: 150px; object-fit: contain;"
            onerror="this.style.display='none'; this.parentNode.innerHTML += '<p>画像を読み込めませんでした</p>';"
          />
        </div>
      ` : ''}
      
      <p style="
        margin: 16px 0;
        background-color: #f8f8f8;
        padding: 12px;
        border-radius: 4px;
      ">${message || '学習のマイルストーンを達成しました！'}</p>
      
      <button 
        onclick="document.body.removeChild(document.getElementById('super-simple-modal'))" 
        style="
          background-color: #4299e1;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        "
      >閉じる</button>
    </div>
  `;
  
  // モーダル外側をクリックしても閉じるようにする
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // ボディに追加
  document.body.appendChild(modal);
  
  // ESCキーで閉じる機能
  const handleEsc = (event) => {
    if (event.key === 'Escape') {
      const modalElement = document.getElementById('super-simple-modal');
      if (modalElement) {
        document.body.removeChild(modalElement);
      }
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  // モーダルを閉じる関数を返す
  return () => {
    const modalElement = document.getElementById('super-simple-modal');
    if (modalElement) {
      document.body.removeChild(modalElement);
    }
  };
}

// 使用例
// showSimpleModal('ヒトカゲ', '15時間達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！', '/pokemonimage/hitokake゙01.gif');
