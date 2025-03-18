document.addEventListener('DOMContentLoaded', function() {
  // デフォルト値を設定
  const defaultBlockWords = 'しばらく観察していると';
  
  // 保存されている設定を読み込む
  chrome.storage.sync.get(['blockWords'], function(result) {
    const blockWords = result.blockWords || defaultBlockWords;
    document.getElementById('blockWords').value = blockWords;
  });
  
  // 保存ボタンのクリックイベント
  document.getElementById('saveButton').addEventListener('click', function() {
    const blockWords = document.getElementById('blockWords').value;
    
    // 設定を保存
    chrome.storage.sync.set({blockWords: blockWords}, function() {
      // 保存完了メッセージを表示
      const status = document.getElementById('status');
      status.style.display = 'block';
      setTimeout(function() {
        status.style.display = 'none';
      }, 2000);
    });
  });
});
