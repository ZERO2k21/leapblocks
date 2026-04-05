import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // ─── Main process (src/index.ts) ────────────────────────────────────────
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/index.ts'),
      },
    },
  },

  // ─── Preload script (src/preload.ts) ────────────────────────────────────
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/preload.ts'),
      },
    },
  },

  // ─── Renderer process (src/renderer.tsx) ────────────────────────────────
  renderer: {
    root: '.',
    plugins: [react()],
    publicDir: 'public',
    resolve: {
      alias: {
        '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
        // fabric ships pre-minified ESM (index.min.mjs) which causes TDZ errors
        // when Rollup/esbuild reprocesses the already-mangled variable names.
        'fabric': path.resolve(__dirname, 'node_modules/fabric/dist/index.mjs'),
      },
    },

    build: {
      outDir: 'dist/renderer',
      minify: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
