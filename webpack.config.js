const path = require('path');


module.exports = {
  entry: './main.js',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'build.js'
  },
  target: 'electron-main',
  node: {
    __dirname: false,
    __filename: false,
  },
  watch: true,
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }]
    }]
  },
  devtool: '#eval-source-map'
}
