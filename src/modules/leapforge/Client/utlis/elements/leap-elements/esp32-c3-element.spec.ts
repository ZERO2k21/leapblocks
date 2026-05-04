import { describe, it } from 'vitest';
import { ESP32C3Element } from './esp32-c3-element';
import { renderToPng, savePng } from './utils/test-utils';

describe('ESP32C3Element', () => {
  it('should render to svg', async () => {
    const pngData = await renderToPng(new ESP32C3Element());
    await savePng('leap-esp32-c3', pngData);
  });
});
