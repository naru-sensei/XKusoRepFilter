// ブロックする文字列のリスト
let blockWordsList = ['しばらく観察していると'];
// 確認ダイアログを表示するかどうか
let showConfirmDialog = true;
// 確認済みのツイートIDを保存するセット
let confirmedTweetIds = new Set();

// 設定を読み込む
function loadSettings() {
  chrome.storage.sync.get(['blockWords', 'showConfirmDialog'], function(result) {
    if (result.blockWords) {
      // 改行で分割して配列に変換
      blockWordsList = result.blockWords.split('\n').filter(word => word.trim() !== '');
      console.log('XKusoRepFilter: 設定を読み込みました', blockWordsList);
    }
    
    if (result.showConfirmDialog !== undefined) {
      showConfirmDialog = result.showConfirmDialog;
      console.log('XKusoRepFilter: 確認ダイアログ設定を読み込みました', showConfirmDialog);
    }
  });
}

// 初期設定の読み込み
loadSettings();

// ストレージの変更を監視
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.blockWords) {
    loadSettings();
  }
});

// ツイートIDを取得する関数
function getTweetId(tweet) {
  // ツイート要素からリンクを探す
  const links = tweet.querySelectorAll('a[href*="/status/"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    const match = href.match(/\/status\/(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  // IDが見つからない場合はユニークな文字列を生成
  return 'tweet-' + Math.random().toString(36).substring(2, 15);
}

// 確認ダイアログを表示する関数
function showBlockConfirmation(tweet, tweetText, matchedWord) {
  // すでに確認ダイアログが表示されている場合は何もしない
  if (tweet.querySelector('.xkuso-confirm-dialog')) return;
  
  // ツイートIDを取得
  const tweetId = getTweetId(tweet);
  
  // すでに確認済みの場合はブロックする
  if (confirmedTweetIds.has(tweetId)) {
    blockTweet(tweet, tweetText);
    return;
  }
  
  // 確認ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'xkuso-confirm-dialog';
  dialog.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; background-color: rgba(29, 161, 242, 0.9); color: white; padding: 10px; z-index: 9999; display: flex; justify-content: space-between; align-items: center;';
  
  // ダイアログのメッセージ
  const message = document.createElement('div');
  message.textContent = `"マッチした文字列: ${matchedWord}" このツイートをブロックしますか？`;
  dialog.appendChild(message);
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  
  // ブロックボタン
  const blockButton = document.createElement('button');
  blockButton.textContent = 'ブロック';
  blockButton.style.cssText = 'margin-right: 10px; padding: 5px 10px; background-color: #e0245e; border: none; color: white; border-radius: 4px; cursor: pointer;';
  blockButton.onclick = function() {
    confirmedTweetIds.add(tweetId);
    blockTweet(tweet, tweetText);
    tweet.removeChild(dialog);
  };
  buttonContainer.appendChild(blockButton);
  
  // キャンセルボタン
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'キャンセル';
  cancelButton.style.cssText = 'padding: 5px 10px; background-color: #657786; border: none; color: white; border-radius: 4px; cursor: pointer;';
  cancelButton.onclick = function() {
    tweet.removeChild(dialog);
    tweet.dataset.filtered = 'ignored';
  };
  buttonContainer.appendChild(cancelButton);
  
  dialog.appendChild(buttonContainer);
  
  // ツイートにダイアログを追加
  tweet.style.position = 'relative';
  tweet.appendChild(dialog);
}

// ツイートをブロックする関数
function blockTweet(tweet, tweetText) {
  // ツイートを非表示にする
  tweet.style.display = 'none';
  // 処理済みとしてマーク
  tweet.dataset.filtered = 'true';
  console.log('XKusoRepFilter: ツイートをブロックしました', tweetText);
}

// ツイートをフィルタリングする関数
function filterTweets() {
  // タイムラインの各ツイート要素を取得
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  
  tweets.forEach(tweet => {
    // すでに処理済みの場合はスキップ
    if (tweet.dataset.filtered) return;
    
    // ツイートのテキスト内容を取得
    const tweetText = tweet.textContent || '';
    
    // ブロックワードが含まれているかチェック
    let matchedWord = null;
    for (const word of blockWordsList) {
      if (tweetText.includes(word)) {
        matchedWord = word;
        break;
      }
    }
    
    if (matchedWord) {
      if (showConfirmDialog) {
        // 確認ダイアログを表示
        showBlockConfirmation(tweet, tweetText, matchedWord);
      } else {
        // 確認なしでブロック
        blockTweet(tweet, tweetText);
      }
    }
  });
}

// MutationObserverを使用してDOMの変更を監視
const observer = new MutationObserver(function(mutations) {
  filterTweets();
});

// 監視の開始
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 初回実行
filterTweets();

// 定期的にフィルタリングを実行（スクロール時などの対策）
setInterval(filterTweets, 2000);
