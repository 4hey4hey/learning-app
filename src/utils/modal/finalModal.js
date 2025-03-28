/**
 * 確実に動作する最終的なモーダル
 * 画像に依存せず、テキストとCSSのみでモーダルを構成
 * @param {Object} pokemonData - ポケモンデータオブジェクト
 */
export function showFinalModal(pokemonData = null) {
  // デフォルトのポケモンデータ（ヒトカゲ）
  const defaultPokemon = {
    id: "hitokage",
    name: "ヒトカゲ",
    description: "15時間の学習達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！",
    message: "学習の炎が燃え上がった！",
    element: "fire",
    condition: { value: 15 }
  };
  
  // 引数がなければデフォルト値を使用
  const pokemon = pokemonData || defaultPokemon;
  
  // 既存モーダルがあれば削除
  const existingModal = document.getElementById('final-milestone-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // モーダルの外側コンテナ
  const modal = document.createElement('div');
  modal.id = 'final-milestone-modal';
  
  // スタイル設定 - モーダル外側
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '100000',
    fontFamily: 'Arial, sans-serif'
  });
  
  // モーダル内容
  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '25px',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    animation: 'fadeIn 0.3s'
  });
  
  // スタイル設定
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fireAnimation {
      0% { transform: scale(0.95); }
      50% { transform: scale(1.05); }
      100% { transform: scale(0.95); }
    }
    
    @keyframes shineEffect {
      0% { box-shadow: 0 0 20px ${shadowColor}; }
      50% { box-shadow: 0 0 40px ${shadowColor}; }
      100% { box-shadow: 0 0 20px ${shadowColor}; }
    }
  `;
  document.head.appendChild(style);
  
  // ヘッダーセクション
  const header = document.createElement('div');
  Object.assign(header.style, {
    marginBottom: '20px'
  });
  
  // タイトル
  const title = document.createElement('h2');
  title.textContent = 'おめでとう！マイルストーン達成！';
  Object.assign(title.style, {
    fontSize: '28px',
    color: '#FF5722',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
  });
  header.appendChild(title);
  
  // サブタイトル
  const subtitle = document.createElement('h3');
  subtitle.textContent = `${pokemon.name}をゲットしました！`;
  Object.assign(subtitle.style, {
    fontSize: '18px',
    color: '#FF9800',
    margin: '0',
    fontWeight: 'bold'
  });
  header.appendChild(subtitle);
  
  modalContent.appendChild(header);
  
  // ポケモンタイプに応じたスタイルを設定
  let bgColor = '#FFECB3';
  let shadowColor = 'rgba(255, 87, 34, 0.4)';
  
  switch(pokemon.element) {
    case 'fire':
      bgColor = '#FFECB3';
      shadowColor = 'rgba(255, 87, 34, 0.4)';
      break;
    case 'water':
      bgColor = '#E1F5FE';
      shadowColor = 'rgba(3, 169, 244, 0.4)';
      break;
    case 'grass':
      bgColor = '#E8F5E9';
      shadowColor = 'rgba(76, 175, 80, 0.4)';
      break;
    case 'electric':
      bgColor = '#FFF9C4';
      shadowColor = 'rgba(255, 193, 7, 0.4)';
      break;
    case 'flying':
      bgColor = '#E0F7FA';
      shadowColor = 'rgba(0, 188, 212, 0.4)';
      break;
  }
  
  // ポケモン画像を表示するコンテナ
  const iconContainer = document.createElement('div');
  Object.assign(iconContainer.style, {
    width: '200px',
    height: '200px',
    margin: '0 auto 20px auto',
    backgroundColor: bgColor,
    borderRadius: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    animation: 'fireAnimation 2s infinite',
    boxShadow: `0 0 30px ${shadowColor}`,
    overflow: 'hidden'
  });
  
  // ポケモンGIF画像の要素を作成
  const pokemonImage = document.createElement('img');
  
  // ポケモンIDに応じた画像パスを設定（画像ファイル名はIDを基に決定）
  const getImagePath = (pokemonId) => {
    // コードが実行されているパスに基づいて相対パスを設定
    const basePath = './';
    
    const imageMap = {
      'hitokage': `${basePath}pokemonimage/ヒトカゲ01.gif`,
      'zenigame': `${basePath}pokemonimage/ゼニガメ01.gif`,
      'fushigidane': `${basePath}pokemonimage/フシギダネ01.gif`,
      'pikachu': `${basePath}pokemonimage/ピカチュウ_お祝い.gif`,
      'nyoromo': `${basePath}pokemonimage/ニョロモ.gif`,  // 仮のパス
      'kodakku': `${basePath}pokemonimage/コダック01.gif`,
      'poppo': `${basePath}pokemonimage/ポッポ.gif`,  // 仮のパス
      'koiking': `${basePath}pokemonimage/コイキング01.gif`
    };
    
    // 大文字化した画像名も試行するバリエーション
    const variations = [
      pokemonId, // 元のキー
      `${basePath}pokemonimage/${pokemon.name}01.gif`,  // 名前を使ったバリエーション
      `${basePath}pokemonimage/${pokemon.name}.gif`,     // 数字なしバージョン
      pokemon.imageUrl // 直接指定されている場合
    ];
    
    // マッピングにある場合はそのパスを返す、なければデフォルト画像
    return imageMap[pokemonId] || pokemon.imageUrl || `${basePath}pokemonimage/ピカチュウ_お祝い.gif`;
  };
  
  // 画像のパスを設定
  pokemonImage.src = getImagePath(pokemon.id);
  pokemonImage.alt = pokemon.name;
  
  // 画像のスタイルを設定
  Object.assign(pokemonImage.style, {
    width: '90%',
    height: '90%',
    objectFit: 'contain',
    animation: 'shineEffect 3s infinite'
  });
  
  // 画像の読み込みエラー時の処理
  pokemonImage.onerror = () => {
    console.error(`ポケモン画像の読み込みに失敗しました: ${pokemonImage.src}`);
    // エラー時はフォールバックとして絵文字を表示
    pokemonImage.style.display = 'none';
    
    const fallbackIcon = document.createElement('span');
    let emoji = '✨';
    // ポケモンタイプに応じた絵文字を設定
    switch(pokemon.element) {
      case 'fire': emoji = '🔥'; break;
      case 'water': emoji = '💧'; break;
      case 'grass': emoji = '🌿'; break;
      case 'electric': emoji = '⚡'; break;
      case 'flying': emoji = '🕊️'; break;
    }
    
    fallbackIcon.textContent = emoji;
    fallbackIcon.ariaLabel = pokemon.element;
    Object.assign(fallbackIcon.style, {
      fontSize: '60px'
    });
    iconContainer.appendChild(fallbackIcon);
  };
  
  iconContainer.appendChild(pokemonImage);
  
  modalContent.appendChild(iconContainer);
  
  // 説明文
  const description = document.createElement('p');
  description.textContent = pokemon.description;
  Object.assign(description.style, {
    backgroundColor: '#FFF3E0',
    padding: '15px',
    borderRadius: '8px',
    margin: '20px 0',
    textAlign: 'left',
    color: '#E65100',
    fontSize: '16px',
    lineHeight: '1.6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  });
  modalContent.appendChild(description);
  
  // 引用
  const quote = document.createElement('p');
  quote.textContent = `"${pokemon.message}"`;
  Object.assign(quote.style, {
    fontStyle: 'italic',
    color: '#FF9800',
    margin: '15px 0 25px 0',
    fontSize: '16px'
  });
  modalContent.appendChild(quote);
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.textContent = '閉じる';
  Object.assign(closeButton.style, {
    backgroundColor: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 25px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });
  
  // ホバーエフェクト
  closeButton.onmouseover = () => {
    closeButton.style.backgroundColor = '#E64A19';
  };
  closeButton.onmouseout = () => {
    closeButton.style.backgroundColor = '#FF5722';
  };
  
  buttonContainer.appendChild(closeButton);
  modalContent.appendChild(buttonContainer);
  
  // モーダルを組み立てる
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // イベントリスナー
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // ESCキーでも閉じられるようにする
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  console.log(`🎉 ${pokemon.name}のマイルストーンモーダルを表示しました`);
  return () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };
}

// グローバルにエクスポート
window.showFinalModal = showFinalModal;