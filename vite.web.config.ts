import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
      // fabric ships pre-minified ESM (index.min.mjs) which causes TDZ errors
      // when Rollup/esbuild reprocesses the already-mangled variable names.
      // Force the unminified ESM entry so bundling works correctly.
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
  },
  define: {
    // Ensure process.env exists for libraries that check it
    'process.env.NODE_ENV': JSON.stringify('production'),
    // Prevent UMD modules (like Blockly) from using Monaco's AMD loader
    'define.amd': 'false',
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    minify: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      // Mark Electron/Node-only modules as external so they're stripped
      external: ['electron', 'serialport', 'child_process', 'fs', 'fs-extra', 'path', 'os', 'crypto', 'monaco-editor'],
      output: {
        manualChunks: {
          // Vendor chunks - separate large libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-blockly': ['blockly'],

          // UI components
          'ui-components': [
            './src/components/SpriteLibrary.tsx',
            './src/components/BackdropLibrary.tsx',
            './src/components/SoundLibrary.tsx',
            './src/leapignite/client/components/JuniorExtensionLibrary.jsx',
          ],

          // Extensions - lazy load these
          'extensions': [
            './src/extensions/ExtensionManager.ts',
            './src/extensions/ObjectDetectionExtension.ts',
            './src/extensions/MusicExtension.ts',
            './src/extensions/extensionDefinitions.ts',
          ],

          // VM and generators
          'vm-engine': [
            './src/vm/AnimationVM.ts',
            './src/generators/animation-generator.ts',
            './src/generators/arduino-generator.ts',
          ],

          // Blocks definitions
          'blocks': [
            './src/blocks/animation-blocks.ts',
            './src/blocks/arduino-blocks.ts',
            './src/blocks/esp32-blocks.ts',
            './src/blocks/leapBlocks.ts',
          ],

          // Audio engine
          'audio': [
            './src/leapAudio/src/audioEngine.js',
            './src/leapAudio/src/soundBank.js',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'blockly'],
    exclude: ['electron', 'serialport', 'monaco-editor'],
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/compile': 'http://localhost:3001',
      '/transpile': 'http://localhost:3001',
      '/libraries': 'http://localhost:3001',
    },
    watch: {
      // Exclude arduino-cli data/staging dirs and temp files from Vite's watcher
      // so compilation doesn't trigger a page reload
      ignored: [
        '**/data/**',
        '**/forge-lib/data/**',
        '**/forge-lib/staging/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/tmp/**',
        '**/temp/**',
      ],
    },
  },
});
