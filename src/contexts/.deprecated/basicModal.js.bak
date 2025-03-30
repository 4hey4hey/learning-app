/**
 * 最もシンプルなモーダル表示関数
 * 直接画像を組み込み、文字列としてDOMに追加するだけの機能
 */
export function showBasicModal() {
  // 既存モーダルの削除
  const existingModal = document.getElementById('basic-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // モーダル要素の作成
  const modalElement = document.createElement('div');
  modalElement.id = 'basic-modal';
  
  // インラインスタイルでスタイル設定
  modalElement.style.position = 'fixed';
  modalElement.style.zIndex = '9999999';
  modalElement.style.top = '0';
  modalElement.style.left = '0';
  modalElement.style.width = '100%';
  modalElement.style.height = '100%';
  modalElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
  modalElement.style.display = 'flex';
  modalElement.style.justifyContent = 'center';
  modalElement.style.alignItems = 'center';
  
  // モーダルの内容を作成
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.borderRadius = '8px';
  modalContent.style.padding = '24px';
  modalContent.style.maxWidth = '500px';
  modalContent.style.textAlign = 'center';
  modalContent.style.position = 'relative';
  modalElement.appendChild(modalContent);
  
  // タイトル
  const title = document.createElement('h2');
  title.textContent = 'ヒトカゲ';
  title.style.fontSize = '24px';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '16px';
  modalContent.appendChild(title);
  
  // 画像コンテナ
  const imageContainer = document.createElement('div');
  imageContainer.style.margin = '16px 0';
  imageContainer.style.height = '150px';
  imageContainer.style.display = 'flex';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.alignItems = 'center';
  modalContent.appendChild(imageContainer);
  
  const imageHolder = document.createElement('div');
  imageHolder.id = 'image-container';
  imageHolder.style.width = '150px';
  imageHolder.style.height = '150px';
  imageHolder.style.backgroundColor = '#ffcccc';
  imageHolder.style.display = 'flex';
  imageHolder.style.justifyContent = 'center';
  imageHolder.style.alignItems = 'center';
  imageHolder.style.borderRadius = '8px';
  imageContainer.appendChild(imageHolder);
  
  // 画像
  const img = document.createElement('img');
  img.src = '/pokemonimage/hitokake゙01.gif';
  img.alt = 'ヒトカゲ';
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  
  // 画像ロード時の処理
  img.onload = function() {
    imageHolder.style.backgroundColor = 'transparent';
    console.log('✅ 画像のロードに成功しました');
  };
  
  // 画像エラー時の処理
  img.onerror = function() {
    this.style.display = 'none';
    const errorText = document.createElement('span');
    errorText.textContent = 'ヒトカゲの画像';
    errorText.style.color = '#ff5555';
    errorText.style.fontWeight = 'bold';
    imageHolder.appendChild(errorText);
    console.error('❌ 画像のロードに失敗しました');
  };
  
  imageHolder.appendChild(img);
  
  // 説明テキスト
  const description = document.createElement('p');
  description.textContent = '15時間達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！';
  description.style.backgroundColor = '#f7f7f7';
  description.style.padding = '16px';
  description.style.borderRadius = '8px';
  description.style.margin = '16px 0';
  description.style.textAlign = 'left';
  modalContent.appendChild(description);
  
  // メッセージ
  const message = document.createElement('p');
  message.textContent = '"学習の炎が燃え上がった！"';
  message.style.fontStyle = 'italic';
  message.style.color = '#666';
  message.style.marginBottom = '24px';
  modalContent.appendChild(message);
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  modalContent.appendChild(buttonContainer);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.id = 'close-basic-modal';
  closeButton.textContent = '閉じる';
  closeButton.style.padding = '8px 16px';
  closeButton.style.backgroundColor = '#3182ce';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  buttonContainer.appendChild(closeButton);
  
  // ボディに追加
  document.body.appendChild(modalElement);
  
  // 閉じるボタンのイベントリスナー設定
  closeButton.addEventListener('click', function() {
    document.body.removeChild(modalElement);
  });
  
  // モーダル外クリックで閉じる
  modalElement.addEventListener('click', function(event) {
    if (event.target === modalElement) {
      document.body.removeChild(modalElement);
    }
  });
  
  // ESCキーで閉じる
  const handleEscape = function(event) {
    if (event.key === 'Escape') {
      if (document.body.contains(modalElement)) {
        document.body.removeChild(modalElement);
      }
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // デバッグ情報
  console.log('🔍 基本モーダルを表示しました');
  console.log('📂 画像パス: /pokemonimage/hitokake゙01.gif');
  
  // イメージのロード状態を確認（別の方法）
  const testImg = new Image();
  testImg.onload = function() {
    console.log('✅ 画像の読み込みに成功しました (プリロード)');
  };
  testImg.onerror = function() {
    console.error('❌ 画像の読み込みに失敗しました (プリロード)');
    console.log('📊 画像情報:', {
      path: '/pokemonimage/hitokake゙01.gif',
      exists: false,
      可能な問題: [
        'パスが間違っている',
        'ファイルが存在しない',
        'CORSポリシーの問題',
        'サーバーエラー'
      ]
    });
  };
  testImg.src = '/pokemonimage/hitokake゙01.gif';
}

// グローバルにエクスポート
window.showBasicModal = showBasicModal;