import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
      // fabric ships pre-minified ESM (index.min.mjs) which causes TDZ errors
      // when Rollup/esbuild reprocesses the already-mangled variable names.
      // Force the unminified ESM entry so bundling works correctly.
      'fabric': path.resolve(__dirname, 'node_modules/fabric/dist/index.mjs'),
    },
  },
  define: {
    // Ensure process.env exists for libraries that check it
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      // Mark Electron/Node-only modules as external so they're stripped
      external: ['electron', 'serialport', 'child_process', 'fs', 'fs-extra', 'path', 'os', 'crypto', 'adm-zip'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'blockly'],
    exclude: ['electron', 'serialport'],
  },
});
