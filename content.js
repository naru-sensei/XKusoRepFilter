// ブロックする文字列のリスト
let blockWordsList = ['しばらく観察していると'];
// 確認ダイアログを表示するかどうか
let showConfirmDialog = true;
// 確認済みのツイートIDを保存するセット
let confirmedTweetIds = new Set();
// 自分のIDとフォロワーのIDを保存するセット
let myAndFollowersIds = new Set();

// ハイライト済みのツイートIDを保存するセット
let highlightedTweetIds = new Set();

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

// 自分のIDとフォロワーのIDを取得する関数
function fetchMyAndFollowersIds() {
  // 自分のプロフィールリンクを探す
  const profileLinks = document.querySelectorAll('a[href^="/"][role="link"][aria-label]');
  
  profileLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/') && !href.includes('/status/')) {
      // 自分のIDを取得
      const myId = href.replace('/', '');
      if (myId && !myAndFollowersIds.has(myId)) {
        myAndFollowersIds.add(myId);
        console.log('XKusoRepFilter: 自分のIDを登録しました', myId);
      }
    }
  });
  
  // フォロワーリストはページから直接取得するのは難しいため、
  // タイムライン上でフォロー中のアカウントを検出します
  const followingIndicators = document.querySelectorAll('span[data-testid="userFollowing"]');
  
  followingIndicators.forEach(indicator => {
    // フォロー中のアカウントのツイート要素を探す
    const tweet = indicator.closest('article[data-testid="tweet"]');
    if (tweet) {
      // ツイートからユーザーIDを取得
      const userLinks = tweet.querySelectorAll('a[role="link"][href^="/"]');
      userLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
          const userId = href.replace('/', '');
          if (userId && !myAndFollowersIds.has(userId)) {
            myAndFollowersIds.add(userId);
            console.log('XKusoRepFilter: フォロワーIDを登録しました', userId);
          }
        }
      });
    }
  });
}

// 初期設定の読み込み
loadSettings();

// ストレージの変更を監視
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && (changes.blockWords || changes.showConfirmDialog)) {
    loadSettings();
  }
});

// 定期的に自分とフォロワーのIDを取得
setInterval(fetchMyAndFollowersIds, 10000);
// 初回実行
fetchMyAndFollowersIds();

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

// ツイートが自分またはフォロワーのものかチェックする関数
function isMyOrFollowersTweet(tweet) {
  // ツイートからユーザーIDを取得
  const userLinks = tweet.querySelectorAll('a[role="link"][href^="/"]');
  for (const link of userLinks) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/') && !href.includes('/status/')) {
      const userId = href.replace('/', '');
      // 自分またはフォロワーのIDかチェック
      if (myAndFollowersIds.has(userId)) {
        return true;
      }
    }
  }
  return false;
}

// ツイート内の特定の文字列をハイライトする関数
function highlightBlockWords(tweet, matchedWord) {
  // すでにハイライト済みの場合はスキップ
  const tweetId = getTweetId(tweet);
  if (highlightedTweetIds.has(tweetId)) return;
  
  // テキストノードを探す
  const textNodes = [];
  const walker = document.createTreeWalker(tweet, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.includes(matchedWord)) {
      textNodes.push(node);
    }
  }
  
  // テキストノード内のマッチした文字列をハイライト
  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    const parts = text.split(matchedWord);
    
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < parts.length; i++) {
        // 通常のテキスト部分を追加
        if (parts[i]) {
          fragment.appendChild(document.createTextNode(parts[i]));
        }
        
        // マッチした文字列をハイライトして追加
        if (i < parts.length - 1) {
          const highlight = document.createElement('span');
          highlight.textContent = matchedWord;
          highlight.style.backgroundColor = 'yellow';
          highlight.style.color = 'red';
          highlight.style.fontWeight = 'bold';
          fragment.appendChild(highlight);
        }
      }
      
      // 元のテキストノードをハイライト付きのフラグメントで置き換え
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
  
  // ハイライト済みとしてマーク
  highlightedTweetIds.add(tweetId);
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
      // 自分またはフォロワーのツイートはブロックせずにハイライトする
      if (isMyOrFollowersTweet(tweet)) {
        highlightBlockWords(tweet, matchedWord);
        tweet.dataset.filtered = 'highlighted';
      } else {
        // 自分とフォロワー以外のツイートはブロック対象
        if (showConfirmDialog) {
          // 確認ダイアログを表示
          showBlockConfirmation(tweet, tweetText, matchedWord);
        } else {
          // 確認なしでブロック
          blockTweet(tweet, tweetText);
        }
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
