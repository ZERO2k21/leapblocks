import { describe, it } from 'vitest';
import { HeartBeatSensorElement } from './heart-beat-sensor-element';
import { renderToPng, savePng } from './utils/test-utils';

describe('HeartBeatSensorElement', () => {
  it('should render to svg', async () => {
    const pngData = await renderToPng(new HeartBeatSensorElement());
    await savePng('leap-heart-beat-sensor', pngData);
  });
});
