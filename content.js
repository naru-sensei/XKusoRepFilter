// ブロックする文字列のリスト
let blockWordsList = ['しばらく観察していると', '紹介したこのブロガー', '彼の指導のもと'];
// 確認ダイアログを表示するかどうか
let showConfirmDialog = true;
// 確認済みのツイートIDを保存するセット
let confirmedTweetIds = new Set();
// 自分のIDとフォロワーのIDを保存するセット
let myAndFollowersIds = new Set();


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

// 確認ダイアログ用のCSSスタイルを追加
function addConfirmDialogStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .xkuso-confirm-dialog {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
    }
    
    .xkuso-confirm-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    
    .xkuso-confirm-dialog-button {
      margin-left: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    
    .xkuso-confirm-dialog-block {
      background-color: #f44336;
      color: white;
    }
    
    .xkuso-confirm-dialog-cancel {
      background-color: #e0e0e0;
    }
  `;
  document.head.appendChild(style);
  console.log('XKusoRepFilter: 確認ダイアログスタイルを追加しました');
}

// スタイルを追加
addConfirmDialogStyles();

// 定期的に自分とフォロワーのIDを取得
setInterval(fetchMyAndFollowersIds, 10000);
// 初回実行
fetchMyAndFollowersIds();

// ツイートIDを取得する関数
function getTweetId(tweet) {
  // すでにIDが設定されている場合はそれを返す
  if (tweet.dataset.tweetId) {
    return tweet.dataset.tweetId;
  }
  
  // ツイート要素からリンクを探す
  const links = tweet.querySelectorAll('a[href*="/status/"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    const match = href.match(/\/status\/(\d+)/);
    if (match && match[1]) {
      // IDをデータ属性に保存
      tweet.dataset.tweetId = match[1];
      return match[1];
    }
  }
  
  // IDが見つからない場合はユニークな文字列を生成して保存
  const uniqueId = 'tweet-' + Math.random().toString(36).substring(2, 15);
  tweet.dataset.tweetId = uniqueId;
  return uniqueId;
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

  // 自分またはフォロワーのツイートの場合は何もしない
  if (isMyOrFollowersTweet(tweet)) return;
  
  // 確認ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'xkuso-confirm-dialog';
  dialog.style.cssText = 'position: absolute; bottom: 5px; right: 5px; background-color: rgba(29, 161, 242, 0.9); color: white; padding: 5px; z-index: 9999; display: flex; border-radius: 4px;';
  
  // ブロックボタン
  const blockButton = document.createElement('button');
  blockButton.textContent = 'Block';
  blockButton.style.cssText = 'margin-right: 5px; padding: 12px 24px; background-color: #e0245e; border: none; color: white; border-radius: 9999px; cursor: pointer; font-size: 14px; font-weight: bold;';
  blockButton.onclick = function(e) {
    e.stopPropagation(); // イベントの伝播を停止
    confirmedTweetIds.add(tweetId);
    blockTweet(tweet, tweetText);
    if (tweet.contains(dialog)) {
      tweet.removeChild(dialog);
    }
  };
  dialog.appendChild(blockButton);
  
  // ツイートにダイアログを追加
  tweet.style.position = 'relative';
  tweet.appendChild(dialog);
}

// ツイートをブロックする関数
function blockTweet(tweet, tweetText) {
  // ツイートのフォントを薄く表示
  tweet.style.opacity = '0.3';
  tweet.style.color = '#888';
  
  // ツイート内のすべての要素にスタイルを適用
  const allElements = tweet.querySelectorAll('*');
  allElements.forEach(element => {
    element.style.color = 'inherit';
  });
  
  // ツイートの背景色を変更
  tweet.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
  
  // ボーダーを薄く表示
  tweet.style.border = '1px solid rgba(0, 0, 0, 0.05)';
  
  // クリックやインタラクションを無効化
  tweet.style.pointerEvents = 'none';
  
  // 処理済みとしてマーク
  tweet.dataset.filtered = 'true';
  console.log('XKusoRepFilter: ツイートを薄く表示しました', tweetText);
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

// 認証済みアカウントかチェックする関数
function isVerifiedAccount(tweet) {
  try {
    // 認証済みアカウントのマークを探す
    // 認証済みアカウントは青いチェックマークアイコンが表示される
    const verifiedBadge = tweet.querySelector('svg[aria-label="認証済みアカウント"]');
    if (verifiedBadge) {
      return true;
    }
    
    // 英語表記の場合もチェック
    const verifiedBadgeEn = tweet.querySelector('svg[aria-label="Verified Account"]');
    if (verifiedBadgeEn) {
      return true;
    }
    
    // その他の言語の場合もチェックするため、チェックマークの色で判定
    const svgElements = tweet.querySelectorAll('svg');
    for (const svg of svgElements) {
      // 青いチェックマークを探す
      const paths = svg.querySelectorAll('path[fill="rgb(29, 155, 240)"]');
      if (paths.length > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('XKusoRepFilter: 認証済みアカウントチェック中にエラーが発生しました', error);
    return false;
  }
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
      // 自分、フォロワー、または認証済みアカウントのツイートはブロックしない
      if (isMyOrFollowersTweet(tweet) || isVerifiedAccount(tweet)) {
        tweet.dataset.filtered = 'skipped';
        if (isVerifiedAccount(tweet)) {
          console.log('XKusoRepFilter: 認証済みアカウントのツイートをスキップしました');
        }
      } else {
        // 自分、フォロワー、認証済みアカウント以外のツイートはブロック対象
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
