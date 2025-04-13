// src/utils/modal/showMilestoneModal.js

/**
 * マイルストーンモーダルを直接DOMに追加して表示する関数
 * Reactのレンダリングに依存せず、確実にモーダルを表示するためのフォールバック機能
 * 
 * @param {Object} pokemonData ポケモンデータ
 * @returns {Function} モーダルを閉じる関数
 */
export function showMilestoneModal(pokemonData) {
  // デフォルト値を設定
  const pokemon = pokemonData || {
    id: "hitokage",
    name: "ヒトカゲ",
    imageUrl: "/pokemonimage/hitokake゙01.gif", 
    description: "15時間の学習達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！",
    condition: {
      type: "totalHours",
      value: 15
    },
    element: "fire",
    message: "学習の炎が燃え上がった！"
  };
  
  // タイプ表示用のスタイルとラベルを取得
  const getTypeStyle = (element) => {
    switch (element) {
      case 'fire': return 'background: #ffecec; color: #e53e3e;';
      case 'water': return 'background: #ebf8ff; color: #3182ce;';
      case 'grass': return 'background: #f0fff4; color: #38a169;';
      case 'electric': return 'background: #fffbeb; color: #dd6b20;';
      case 'flying': return 'background: #e6f6ff; color: #2b6cb0;';
      default: return 'background: #f7f7f7; color: #4a5568;';
    }
  };
  
  const getTypeLabel = (element) => {
    switch (element) {
      case 'fire': return '炎タイプ';
      case 'water': return '水タイプ';
      case 'grass': return '草タイプ';
      case 'electric': return '電気タイプ';
      case 'flying': return 'ひこうタイプ';
      default: return 'ノーマルタイプ';
    }
  };

  // 既存のモーダルを削除
  const existingModal = document.getElementById('direct-milestone-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // モーダルのHTML作成
  const modalDiv = document.createElement('div');
  modalDiv.id = 'direct-milestone-modal';
  modalDiv.style.cssText = 'position: fixed; z-index: 9999; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; animation: fadeIn 0.3s ease-out;';
  
  // CSSアニメーション
  const styleId = 'milestone-modal-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleElement);
  }

  modalDiv.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideIn 0.4s ease-out;">
      <h2 style="font-size: 28px; margin-bottom: 16px; color: #2d3748;">${pokemon.name}</h2>
      
      <div style="margin: 24px 0;">
        <img src="${pokemon.imageUrl}" alt="${pokemon.name}" style="width: 180px; height: 180px; object-fit: contain;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; ${getTypeStyle(pokemon.element)} font-size: 14px; font-weight: 500;">
          ${getTypeLabel(pokemon.element)}
        </span>
      </div>
      
      <p style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; line-height: 1.5;">
        ${pokemon.description}
      </p>
      
      <p style="font-style: italic; color: #4a5568; margin-bottom: 24px; font-size: 16px;">
        "「${pokemon.message}」"
      </p>
      
      <p style="font-size: 14px; color: #718096; margin-bottom: 24px;">
        獲得条件: 累計${pokemon.condition?.value || 15}時間の学習
      </p>
      
      <button id="milestone-close-button" style="padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.2s;">閉じる</button>
    </div>
  `;
  
  // ページに追加
  document.body.appendChild(modalDiv);
  
  // イベントリスナーの設定
  const closeButton = document.getElementById('milestone-close-button');
  const closeModal = () => {
    if (document.body.contains(modalDiv)) {
      document.body.removeChild(modalDiv);
    }
  };
  
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }
  
  // モーダル自体をクリックして閉じる（ただし内側のコンテンツクリックでは閉じない）
  modalDiv.addEventListener('click', (e) => {
    if (e.target === modalDiv) {
      closeModal();
    }
  });
  
  // ESCキーでモーダルを閉じる
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // 閉じる関数を返す
  return closeModal;
}

// 実装例:
// 1. このファイルを他のコンポーネントからインポート:
//    import { showMilestoneModal } from '../utils/modal/showMilestoneModal';
// 
// 2. 関数を直接呼び出し:
//    showMilestoneModal({
//      name: "ヒトカゲ",
//      imageUrl: "/pokemonimage/hitokake゙01.gif",
//      description: "15時間達成!",
//      element: "fire",
//      message: "学習の炎が燃え上がった！",
//      condition: { value: 15 }
//    });

// グローバルスコープに関数を公開する (シングルトンとしての直接呼び出し用)
window.showMilestoneModal = showMilestoneModal;
