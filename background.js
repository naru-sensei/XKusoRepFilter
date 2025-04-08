// 拡張機能がインストールされた時に実行される
chrome.runtime.onInstalled.addListener(function() {
  // デフォルト設定を保存
  chrome.storage.sync.get(['blockWords', 'showConfirmDialog', 'filterMode'], function(result) {
    let updates = {};
    
    if (!result.blockWords) {
      updates.blockWords = 'しばらく観察していると';
    }
    
    if (result.showConfirmDialog === undefined) {
      updates.showConfirmDialog = true;
    }
    
    if (result.filterMode === undefined) {
      updates.filterMode = 'block'; // デフォルトは「ブロックモード」
    }
    
    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });
});
