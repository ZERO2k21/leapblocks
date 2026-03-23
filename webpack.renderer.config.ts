import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { 
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            ['@tailwindcss/postcss', {}],
            ['autoprefixer', {}],
          ],
        },
      },
    },
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        blockly: {
          test: /[\\/]node_modules[\\/]blockly[\\/]/,
          name: 'blockly',
          chunks: 'all',
        },
      },
    },
  },
  devServer: {
    static: {
      directory: require('path').join(__dirname, 'public'),
    },
  },
};
