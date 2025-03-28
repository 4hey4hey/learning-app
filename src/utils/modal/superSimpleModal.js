// superSimpleModal.js
// 最小限のJavaScriptで単純なアラート表示を行う関数

// グローバルスコープで実行できるように関数を追加
window.showSuperSimpleModal = function(title, message) {
  alert(title + '\n\n' + message);
};

export default window.showSuperSimpleModal;
