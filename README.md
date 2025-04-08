# XKusoRepFilter

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/GOROman/XKusoRepFilter/build.yml?branch=main)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/GOROman/XKusoRepFilter)
![GitHub](https://img.shields.io/github/license/GOROman/XKusoRepFilter)

X（旧Twitter）で特定の文字列「しばらく観察していると」などを含む投稿をブロックするChrome拡張機能です。

![alt text](docs/image.png)

## 機能

- X（旧Twitter）のタイムラインで、特定の文字列を含む投稿を非表示にします
- ブロックする文字列は設定画面でカスタマイズ可能
- デフォルトでは「しばらく観察していると」という文字列を含む投稿をブロック
- ブロック前に確認ダイアログを表示するオプション（デフォルトでON）
- 自分の投稿とフォロワーの投稿はブロックされません
- 認証済みアカウント（青・黄色・グレーのチェックマーク）の投稿はブロックされません
- 自分やフォロワーの投稿に特定の文字列が含まれる場合、背景黄色・文字赤でハイライト表示されます
- ダークモード対応のモダンな設定画面

## インストール方法

### リリースからインストール

1. [Releasesページ](https://github.com/GOROman/XKusoRepFilter/releases)から最新の拡張機能パッケージ（.zip）をダウンロード
2. ファイルを解凍
3. Chromeで `chrome://extensions/` を開く
4. 右上の「デベロッパーモード」をオンにする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 解凍したフォルダを選択

### ソースからインストール

1. このリポジトリをクローン
   ```
   git clone https://github.com/GOROman/XKusoRepFilter.git
   ```
2. 依存関係をインストール
   ```
   npm install
   ```
3. 拡張機能をビルド
   ```
   npm run build
   ```
4. Chromeで `chrome://extensions/` を開く
5. 右上の「デベロッパーモード」をオンにする
6. 「パッケージ化されていない拡張機能を読み込む」をクリック
7. `dist` フォルダを選択

## 使い方

1. インストール後、Chromeツールバーの拡張機能アイコンをクリック
2. 「XKusoRepFilter」アイコンをクリック
3. ブロックしたい文字列を入力（1行に1つ）
4. 「保存」ボタンをクリック
5. X（Twitter）のページを更新すると設定が反映されます

## 開発者向け情報

### CI/CDパイプライン

このプロジェクトはGitHub Actionsを使用して自動ビルドとリリースを行っています。

- `main`ブランチへのプッシュ時に自動ビルドが実行されます
- タグ（`v*`形式）を付けてプッシュすると、自動的にリリースが作成されます

リリースを作成するには、以下のコマンドを実行します（例：バージョン1.3.0の場合）：

```bash
git tag -a v1.3.0 -m "v1.3.0リリース"
git push origin v1.3.0
```

### ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発ビルド
npm run build

# パッケージ作成
npm run package
```

## 更新履歴

### v1.4.1
- 認証済みアカウント（青・黄色・グレーのチェックマーク）の検出機能を修正
- X（旧Twitter）のUI変更に対応

### v1.4.0
- 初期リリース

_❤️❤️❤️ナル先生 参上❤️❤️❤️_

