var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  devtool: 'source-map',
  target: 'node-webkit',
  entry: [
    './app/Index'
  ],
  devServer: {
      contentBase: '../dist'
  },
  output: {
    path: path.join(__dirname, '..', 'dist'),
    filename: 'bundle.js',
    publicPath: ''
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      title: 'Pullover'
    }),
    new ExtractTextPlugin('styles.css')
  ],
  resolve: {
    extensions: ['', '.js', '.jsx', '.scss']
  },
  module: {
    loaders: [
      // Bootstrap fonts
      { test: /\.woff$/,   loader: 'url-loader?limit=10000&mimetype='
        + 'application/font-woff&name=./fonts/[name].[ext]' },
      { test: /\.woff2$/,   loader: 'url-loader?limit=10000&mimetype='
        + 'application/font-woff2&name=./fonts/[name].[ext]' },
      { test: /\.ttf$/,    loader: 'file-loader?name=./fonts/[name].[ext]' },
      { test: /\.eot$/,    loader: 'file-loader?name=./fonts/[name].[ext]' },
      { test: /\.svg$/,    loader: 'file-loader?name=./fonts/[name].[ext]' },

      // JSON
      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        test: /\.jsx?$/,
        loaders: ['babel-loader?optional=runtime'],
        include: path.join(__dirname, 'app')
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader',
          'css?sourceMap!' +
          'sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
        include: path.join(__dirname, 'app')
      }
    ]
  }
}
