const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/diskmon.js',
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
      {
        test: /diskmon\.html/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]',
        },
      },
      {
        test: /diskmon\.json/,
        loader: 'file-loader',
        query: {
          name: '[path][name].[ext]',
        },
      },
    ],
  },
  output: {
    path: './dist',
    filename: 'diskmon.js',
    libraryTarget: 'umd',
  },
  externals: [nodeExternals()],
};
