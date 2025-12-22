import type { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  // Externalize all node_modules - they will be loaded at runtime
  // This is essential for native modules like serialport
  externals: [
    nodeExternals({
      // Allowlist modules that SHOULD be bundled (none for main process)
      allowlist: [],
    }),
  ],
};
