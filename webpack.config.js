const path = require('path');
const ZipPlugin = require('zip-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const manifest = require('./manifest.json');

module.exports = {
  mode: 'production',
  entry: {
    background: './background.js',
    content: './content.js',
    popup: './popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'popup.html', to: '.' },
        { from: 'icon.png', to: '.' },
        { from: 'docs/image.png', to: 'docs/image.png' },
        { from: 'README.md', to: '.' }
      ],
    }),
    new ZipPlugin({
      filename: `XKusoRepFilter-v${manifest.version}.zip`
    })
  ]
};
