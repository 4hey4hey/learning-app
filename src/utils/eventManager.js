/**
 * eventManager.js
 * イベントリスナーの管理とイベント発火を統一的に扱うユーティリティ
 */

// イベントタイプの定義
export const EVENT_TYPES = {
  ACHIEVEMENT_CHANGED: 'achievementDataChanged',
  SCHEDULE_CHANGED: 'scheduleDataChanged',
  MILESTONE_REACHED: 'milestoneReached',
  POKEMON_ACQUIRED: 'pokemonAcquired'
};

// イベントマネージャークラス
class EventManager {
  constructor() {
    this.listeners = {};
    this.debugMode = false; // デバッグモードを無効化
  }

  /**
   * イベントリスナーを登録
   * @param {string} eventType - イベントタイプ
   * @param {Function} callback - コールバック関数
   * @param {Object} options - オプション（識別子など）
   * @returns {Function} リスナー登録解除関数
   */
  addListener(eventType, callback, options = {}) {
    if (typeof callback !== 'function') {
      console.error('EventManager: コールバックは関数である必要があります');
      return () => {};
    }

    const id = options.id || `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }

    this.listeners[eventType].push({
      id,
      callback,
      options
    });

    // 登録解除関数を返す
    return () => this.removeListener(eventType, id);
  }

  /**
   * イベントリスナーを削除
   * @param {string} eventType - イベントタイプ
   * @param {string} id - リスナーID
   * @returns {boolean} 削除成功したかどうか
   */
  removeListener(eventType, id) {
    if (!this.listeners[eventType]) return false;

    const initialLength = this.listeners[eventType].length;
    this.listeners[eventType] = this.listeners[eventType].filter(listener => listener.id !== id);
    
    const removed = initialLength > this.listeners[eventType].length;
    return removed;
  }

  /**
   * イベントを発火
   * @param {string} eventType - イベントタイプ
   * @param {Object} data - イベントデータ
   * @param {boolean} dispatchDOMEvent - DOMイベントも発火するかどうか
   */
  dispatchEvent(eventType, data = {}, dispatchDOMEvent = true) {
    // 登録済みのリスナーを呼び出し
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`EventManager: リスナー実行エラー [${eventType}]`, error);
        }
      });
    }

    // DOMイベントも発火する場合
    if (dispatchDOMEvent && typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        const event = new CustomEvent(eventType, { detail: data });
        window.dispatchEvent(event);
      } catch (error) {
        console.error(`EventManager: DOMイベント発火エラー [${eventType}]`, error);
      }
    }
  }

  /**
   * 特定タイプのリスナーをすべて削除
   * @param {string} eventType - イベントタイプ
   */
  clearListeners(eventType) {
    if (eventType) {
      delete this.listeners[eventType];
    } else {
      this.listeners = {};
    }
  }

  /**
   * デバッグモードの設定
   * @param {boolean} enabled - デバッグモードを有効にするかどうか
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// シングルトンインスタンスを作成
const eventManager = new EventManager();

export default eventManager;