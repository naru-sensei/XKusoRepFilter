document.addEventListener('DOMContentLoaded', function() {
  // デフォルト値を設定
  const defaultBlockWords = 'しばらく観察していると';
  const defaultShowConfirmDialog = true;
  
  // 保存されている設定を読み込む
  chrome.storage.sync.get(['blockWords', 'showConfirmDialog'], function(result) {
    const blockWords = result.blockWords || defaultBlockWords;
    document.getElementById('blockWords').value = blockWords;
    
    const showConfirmDialog = result.showConfirmDialog !== undefined ? result.showConfirmDialog : defaultShowConfirmDialog;
    document.getElementById('showConfirmDialog').checked = showConfirmDialog;
  });
  
  // 保存ボタンのクリックイベント
  document.getElementById('saveButton').addEventListener('click', function() {
    const blockWords = document.getElementById('blockWords').value;
    const showConfirmDialog = document.getElementById('showConfirmDialog').checked;
    
    // 設定を保存
    chrome.storage.sync.set({
      blockWords: blockWords,
      showConfirmDialog: showConfirmDialog
    }, function() {
      // 保存完了メッセージを表示
      const status = document.getElementById('status');
      status.style.display = 'block';
      setTimeout(function() {
        status.style.display = 'none';
      }, 2000);
    });
  });
});
