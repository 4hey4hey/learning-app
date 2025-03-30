/**
 * 別の画像形式を使用するモーダル
 */
export function showPngModal() {
  // 既存モーダルの削除
  const existingModal = document.getElementById('png-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // モーダル要素の作成
  const modalElement = document.createElement('div');
  modalElement.id = 'png-modal';
  
  // スタイル設定
  Object.assign(modalElement.style, {
    position: 'fixed',
    zIndex: '9999999',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });
  
  // モーダルの内容を作成
  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    textAlign: 'center',
    position: 'relative'
  });
  modalElement.appendChild(modalContent);
  
  // タイトル
  const title = document.createElement('h2');
  title.textContent = 'ヒトカゲ';
  Object.assign(title.style, {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px'
  });
  modalContent.appendChild(title);
  
  // 代替画像: データURI形式の簡易的な画像
  const svgDataURI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <circle cx="75" cy="75" r="60" fill="orange" />
    <circle cx="55" cy="60" r="8" fill="black" />
    <circle cx="95" cy="60" r="8" fill="black" />
    <path d="M 60 90 Q 75 110 90 90" stroke="black" stroke-width="3" fill="none" />
    <path d="M 30 40 L 50 30 L 40 10" stroke="orange" stroke-width="8" fill="none" />
    <path d="M 100 40 L 110 20 L 130 30" stroke="orange" stroke-width="8" fill="none" />
    <path d="M 75 130 Q 90 150 110 140" stroke="red" stroke-width="5" fill="none" />
  </svg>`;
  
  // 画像コンテナ
  const imageContainer = document.createElement('div');
  Object.assign(imageContainer.style, {
    margin: '16px 0',
    height: '150px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });
  modalContent.appendChild(imageContainer);
  
  // 画像
  const img = document.createElement('img');
  img.alt = 'ヒトカゲ';
  Object.assign(img.style, {
    maxWidth: '100%',
    maxHeight: '100%'
  });
  
  // SVGデータURIを使用
  img.src = svgDataURI;
  
  imageContainer.appendChild(img);
  
  // 説明テキスト
  const description = document.createElement('p');
  description.textContent = '15時間達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！';
  Object.assign(description.style, {
    backgroundColor: '#f7f7f7',
    padding: '16px',
    borderRadius: '8px',
    margin: '16px 0',
    textAlign: 'left'
  });
  modalContent.appendChild(description);
  
  // メッセージ
  const message = document.createElement('p');
  message.textContent = '"学習の炎が燃え上がった！"';
  Object.assign(message.style, {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: '24px'
  });
  modalContent.appendChild(message);
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  modalContent.appendChild(buttonContainer);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.textContent = '閉じる';
  Object.assign(closeButton.style, {
    padding: '8px 16px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  });
  buttonContainer.appendChild(closeButton);
  
  // ボディに追加
  document.body.appendChild(modalElement);
  
  // 閉じるボタンのイベントリスナー設定
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modalElement);
  });
  
  // モーダル外クリックで閉じる
  modalElement.addEventListener('click', (event) => {
    if (event.target === modalElement) {
      document.body.removeChild(modalElement);
    }
  });
  
  // ESCキーで閉じる
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      if (document.body.contains(modalElement)) {
        document.body.removeChild(modalElement);
      }
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  console.log('🖼️ SVGデータURI画像を使用したモーダルを表示しました');
}

// グローバルにエクスポート
window.showPngModal = showPngModal;