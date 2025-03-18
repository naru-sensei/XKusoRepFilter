// 拡張機能がインストールされた時に実行される
chrome.runtime.onInstalled.addListener(function() {
  // デフォルト設定を保存
  chrome.storage.sync.get(['blockWords'], function(result) {
    if (!result.blockWords) {
      chrome.storage.sync.set({blockWords: 'しばらく観察していると'});
    }
  });
});
