import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // ── Node environment — unit tests (no browser, no DOM) ──────────────
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'src/modules/electra/engine/__tests__/**/*.test.ts',
            'src/Electra/Client/Src/engine/esp32c3/tests/**/*.test.ts',
            'src/Electra/Client/Src/simulation/**/*.test.ts',
            'test/**/*.test.ts',
          ],
          globals: true,
        },
        resolve: {
          alias: {
            // Stub out electron so imports don't crash in Node
            electron: path.join(dirname, 'src/test/__mocks__/electron.ts'),
          },
        },
      },
      // ── Storybook browser tests ──────────────────────────────────────────
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
