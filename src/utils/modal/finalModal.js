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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '100000',
    fontFamily: 'Arial, sans-serif',
    backdropFilter: 'blur(5px)'
  });
  
  // モーダル内容
  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    animation: 'fadeIn 0.5s',
    border: `4px solid ${bgColor}`
  });
  
  // エフェクト追加のスタイル
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-30px); }
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

    @keyframes celebrationEffect {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }

    @keyframes glowEffect {
      0%, 100% { text-shadow: 0 0 5px ${shadowColor}; }
      50% { text-shadow: 0 0 20px ${shadowColor}, 0 0 30px ${shadowColor}; }
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
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    animation: 'glowEffect 2s infinite'
  });
  header.appendChild(title);
  
  // サブタイトル
  const subtitle = document.createElement('h3');
  subtitle.textContent = `${pokemon.name}をゲットしました！`;
  Object.assign(subtitle.style, {
    fontSize: '22px',
    color: '#FF9800',
    margin: '5px 0 15px 0',
    fontWeight: 'bold',
    animation: 'celebrationEffect 2s infinite'
  });
  header.appendChild(subtitle);
  
  modalContent.appendChild(header);
  
  // ポケモン画像を表示するコンテナ
  const iconContainer = document.createElement('div');
  Object.assign(iconContainer.style, {
    width: '200px',
    height: '200px',
    margin: '10px auto 25px auto',
    backgroundColor: bgColor,
    borderRadius: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    animation: 'fireAnimation 2s infinite',
    boxShadow: `0 0 30px ${shadowColor}`,
    overflow: 'hidden',
    border: `2px solid ${shadowColor}`
  });
  
  // ポケモンGIF画像の要素を作成
  const pokemonImage = document.createElement('img');
  
  // 画像のパスを定義する関数
  const getImagePath = (pokemonId) => {
    console.log('ポケモンID:', pokemonId);
    console.log('ポケモンデータ:', pokemon);

    // 直接指定された画像パスがあればそれを使う
    if (pokemon.imageUrl) {
      console.log('直接指定された画像パス:', pokemon.imageUrl);
      return pokemon.imageUrl;
    }
    
    // 絶対パスと相対パスのバリエーションを試す
    const paths = [
      `pokemonimage/${pokemon.id}.gif`,
      `pokemonimage/${pokemon.id}01.gif`,
      `./pokemonimage/${pokemon.id}.gif`,
      `./pokemonimage/${pokemon.id}01.gif`,
      `/pokemonimage/${pokemon.id}.gif`,
      `/pokemonimage/${pokemon.id}01.gif`
    ];

    // 見つかったデフォルト値
    const defaultPath = `/pokemonimage/pikachu_oiwai.gif`;

    console.log('考慮される画像パス候補:', paths);
    
    // ポケモン要素に応じて適切なパスを返す
    switch(pokemonId) {
      case 'hitokage': return `/pokemonimage/hitokage01.gif`;
      case 'zenigame': return `/pokemonimage/zenigame01.gif`;
      case 'fushigidane': return `/pokemonimage/fushigidane01.gif`;
      case 'pikachu': return `/pokemonimage/pikachu_oiwai.gif`;
      case 'nyoromo': return `/pokemonimage/nyoromo.gif`;
      case 'kodakku': return `/pokemonimage/kodakku01.gif`;
      case 'poppo': return `/pokemonimage/poppo.gif`;
      case 'koiking': return `/pokemonimage/koiking01.gif`;
      default: return defaultPath;
    }
  };
  
  // 画像ロード時の成功処理
  pokemonImage.onload = () => {
    console.log('画像読み込み成功:', pokemonImage.src);
  };
  
  // 画像のパスを設定
  pokemonImage.src = getImagePath(pokemon.id);
  pokemonImage.alt = pokemon.name;
  
  // 画像のスタイルを設定
  Object.assign(pokemonImage.style, {
    width: '90%',
    height: '90%',
    objectFit: 'contain',
    animation: 'shineEffect 3s infinite',
    transform: 'scale(1.1)'
  });
  
  // 画像の読み込みエラー時の処理
  pokemonImage.onerror = () => {
    console.error('画像エラー:', pokemonImage.src);
    
    // 代替パスを試す
    const alternativePaths = [
      `../pokemonimage/${pokemon.id}01.gif`,
      `../pokemonimage/${pokemon.id}.gif`,
      `../../pokemonimage/${pokemon.id}01.gif`,
      `/pokemonimage/${pokemon.id}01.gif`,
      `/pokemonimage/${pokemon.id}.gif`
    ];
    
    // 現在のパスを除外
    const currentPath = pokemonImage.src;
    const remainingPaths = alternativePaths.filter(path => !currentPath.endsWith(path));
    
    if (remainingPaths.length > 0) {
      console.log('代替パスを試します:', remainingPaths[0]);
      pokemonImage.src = remainingPaths[0];
      
      // 次のパス継続のために現在のエラーハンドラを替える
      pokemonImage.onerror = function() {
        // 次の代替パスがあれば試す
        const nextPaths = remainingPaths.slice(1);
        if (nextPaths.length > 0) {
          console.log('次の代替パスを試します:', nextPaths[0]);
          pokemonImage.src = nextPaths[0];
          
          // 再帰的に次のパスも試す
          const newAltPaths = nextPaths.slice(1);
          if (newAltPaths.length > 0) {
            pokemonImage.onerror = function() {
              // 最後のパスを試す
              console.log('最後の代替パスを試します:', newAltPaths[0]);
              pokemonImage.src = newAltPaths[0];
              
              // もうパスがない場合は絵文字にフォールバック
              pokemonImage.onerror = function() {
                console.log('全てのパスが失敗しました。絵文字を表示します。');
                fallbackToEmoji();
              };
            };
          } else {
            // 代替パスがなくなった場合は絵文字にフォールバック
            pokemonImage.onerror = function() {
              console.log('全てのパスが失敗しました。絵文字を表示します。');
              fallbackToEmoji();
            };
          }
        } else {
          // 代替パスがなくなった場合は絵文字にフォールバック
          console.log('代替パスがありません。絵文字を表示します。');
          fallbackToEmoji();
        }
      };
    } else {
      // 代替パスがない場合は絵文字にフォールバック
      fallbackToEmoji();
    }
  };
  
  // 絵文字フォールバック処理を関数化
  const fallbackToEmoji = () => {
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
      fontSize: '100px',
      filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
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
    borderRadius: '12px',
    margin: '20px 0',
    textAlign: 'left',
    color: '#E65100',
    fontSize: '17px',
    lineHeight: '1.6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #FFE0B2'
  });
  modalContent.appendChild(description);
  
  // クオート
  const quote = document.createElement('p');
  quote.textContent = `"${pokemon.message}"`;
  Object.assign(quote.style, {
    fontStyle: 'italic',
    color: '#FF9800',
    margin: '20px 0 30px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    animation: 'celebrationEffect 3s infinite'
  });
  modalContent.appendChild(quote);
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.marginTop = '20px';
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.textContent = '閉じる';
  Object.assign(closeButton.style, {
    backgroundColor: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 35px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    position: 'relative',
    overflow: 'hidden'
  });
  
  // ボタンのアニメーション効果を追加
  const buttonStyle = document.createElement('style');
  buttonStyle.textContent = `
    .close-button-shine::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
      transform: rotate(30deg);
      animation: shimmerEffect 2s infinite;
    }
    
    @keyframes shimmerEffect {
      0% { transform: translateX(-100%) rotate(30deg); }
      100% { transform: translateX(100%) rotate(30deg); }
    }
  `;
  document.head.appendChild(buttonStyle);
  
  // シャインエフェクト用のクラスを追加
  closeButton.classList.add('close-button-shine');
  
  // ホバーエフェクト
  closeButton.onmouseover = () => {
    closeButton.style.backgroundColor = '#E64A19';
    closeButton.style.transform = 'scale(1.05)';
    closeButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
  };
  closeButton.onmouseout = () => {
    closeButton.style.backgroundColor = '#FF5722';
    closeButton.style.transform = 'scale(1)';
    closeButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };
  
  // ボタンプレス時のエフェクト
  closeButton.onmousedown = () => {
    closeButton.style.transform = 'scale(0.95)';
    closeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  };
  closeButton.onmouseup = () => {
    closeButton.style.transform = 'scale(1.05)';
    closeButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
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