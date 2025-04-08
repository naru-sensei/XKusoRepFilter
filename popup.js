document.addEventListener('DOMContentLoaded', function() {
  // デフォルト値を設定
  const defaultBlockWords = 'しばらく観察していると\n紹介したこのブロガー\n彼の指導のもと';
  const defaultShowConfirmDialog = true;
  const defaultShowOnlyInvestmentSpam = false;

  
  // UI要素
  const blockWordsTextarea = document.getElementById('blockWords');
  const showConfirmDialogCheckbox = document.getElementById('showConfirmDialog');
  const showOnlyInvestmentSpamCheckbox = document.getElementById('showOnlyInvestmentSpam');

  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('status');
  const formGroups = document.querySelectorAll('.form-group');
  
  // フォームグループにアニメーション効果を追加
  formGroups.forEach((group, index) => {
    group.style.opacity = '0';
    group.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      group.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      group.style.opacity = '1';
      group.style.transform = 'translateY(0)';
    }, 100 * (index + 1));
  });
  
  // 保存されている設定を読み込む
  chrome.storage.sync.get(['blockWords', 'showConfirmDialog', 'showOnlyInvestmentSpam'], function(result) {
    const blockWords = result.blockWords || defaultBlockWords;
    blockWordsTextarea.value = blockWords;
    
    const showConfirmDialog = result.showConfirmDialog !== undefined ? result.showConfirmDialog : defaultShowConfirmDialog;
    showConfirmDialogCheckbox.checked = showConfirmDialog;
    
    const showOnlyInvestmentSpam = result.showOnlyInvestmentSpam !== undefined ? result.showOnlyInvestmentSpam : defaultShowOnlyInvestmentSpam;
    showOnlyInvestmentSpamCheckbox.checked = showOnlyInvestmentSpam;

    
    // テキストエリアにフォーカスアニメーション
    blockWordsTextarea.addEventListener('focus', function() {
      this.parentElement.style.transform = 'scale(1.01)';
    });
    
    blockWordsTextarea.addEventListener('blur', function() {
      this.parentElement.style.transform = 'scale(1)';
    });
  });
  
  // 保存ボタンのクリックイベント
  saveButton.addEventListener('click', function() {
    // ボタンにクリックエフェクト
    this.classList.add('clicked');
    
    // ボタンのテキストを変更
    const originalText = this.textContent;
    this.textContent = '保存中...';
    
    const blockWords = blockWordsTextarea.value;
    const showConfirmDialog = showConfirmDialogCheckbox.checked;
    const showOnlyInvestmentSpam = showOnlyInvestmentSpamCheckbox.checked;

    
    // 設定を保存
    chrome.storage.sync.set({
      blockWords: blockWords,
      showConfirmDialog: showConfirmDialog,
      showOnlyInvestmentSpam: showOnlyInvestmentSpam
    }, function() {
      // 保存完了メッセージを表示
      statusMessage.style.display = 'block';
      statusMessage.style.opacity = '0';
      statusMessage.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        statusMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        statusMessage.style.opacity = '1';
        statusMessage.style.transform = 'translateY(0)';
      }, 10);
      
      // ボタンのテキストを元に戻す
      saveButton.textContent = '保存完了！';
      
      setTimeout(function() {
        saveButton.textContent = originalText;
        saveButton.classList.remove('clicked');
        statusMessage.style.opacity = '0';
        statusMessage.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          statusMessage.style.display = 'none';
        }, 300);
      }, 2000);
    });
  });
  
  // バージョン情報を表示
  const manifestData = chrome.runtime.getManifest();
  const versionElement = document.getElementById('version');
  if (versionElement && manifestData.version) {
    versionElement.textContent = `XKusoRepFilter v${manifestData.version}`;
    
    // バージョン表示にアニメーション効果を追加
    versionElement.style.opacity = '0';
    versionElement.style.transform = 'translateY(5px)';
    
    setTimeout(() => {
      versionElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      versionElement.style.opacity = '1';
      versionElement.style.transform = 'translateY(0)';
    }, 500);
    
    // クリックでバージョン情報のアニメーション
    versionElement.addEventListener('click', function() {
      this.style.transform = 'scale(1.1)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 300);
    });
  }
});
