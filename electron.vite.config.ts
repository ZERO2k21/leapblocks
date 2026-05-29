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
    base: './',
    plugins: [react()],
    publicDir: 'public',
    assetsInclude: ['**/*.wasm'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
        // fabric ships pre-minified ESM (index.min.mjs) which causes TDZ errors
        // when Rollup/esbuild reprocesses the already-mangled variable names.
        'fabric': path.resolve(__dirname, 'node_modules/fabric/dist/index.mjs'),
      },
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
      // Speed up builds by reducing minification in dev
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: false,
    },
    optimizeDeps: {
      include: [
        'avr8js',
        'reactflow',
        'zustand',
        'uuid',
        'lucide-react',
        'blockly/core',
        'blockly/blocks',
        'blockly/javascript',
      ],
      esbuildOptions: {
        // Prevent AMD define() conflicts with Blockly
        define: {
          define: 'undefined',
        },
        // Speed up dependency pre-bundling
        target: 'es2020',
      },
    },

    build: {
      outDir: 'dist/renderer',
      minify: 'esbuild', // esbuild is faster than terser
      target: 'es2020',
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd'],
        output: {
          // Manual chunking for better caching
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'reactflow-vendor': ['reactflow'],
            'blockly-vendor': ['blockly/core', 'blockly/blocks', 'blockly/javascript'],
            'avr-vendor': ['avr8js'],
          },
        },
      },
      // Increase worker threads for parallel processing
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    // Development server optimizations
    server: {
      hmr: {
        overlay: false, // Disable error overlay for faster HMR
      },
      watch: {
        // Ignore node_modules for faster file watching
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
    },
  },
});
