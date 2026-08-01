const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  await page.setContent(`<html><body><div id="out">pending</div></body></html>`);

  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js' });
  await page.waitForFunction(() => window.tf && window.tf.version !== undefined);

  const result = await page.evaluate(async () => {
    const out = { attempts: [] };
    try {
      out.attempts.push('start loadGraphModel tfhub');
      const model = await window.tf.loadGraphModel(
        'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1',
        { fromTFHub: true }
      );
      out.ok = true;
      out.inputs = model.inputs;
      
      out.attempts.push('run inference 1D');
      const samples = new Float32Array(15600).fill(0.001);
      const inputTensor = window.tf.tensor1d(samples);
      const res = await model.executeAsync(inputTensor);
      out.inferenceOk = true;
      out.outputShapes = res.map(r => r.shape);
      
      // clean up
      res.forEach(r => r.dispose());
      inputTensor.dispose();
    } catch (e) {
      out.ok = false;
      out.error = e.message;
    }
    return out;
  });

  console.log('RESULT:', JSON.stringify(result, null, 2));
  console.log('CONSOLE:');
  logs.forEach((l) => console.log('  ' + l.slice(0, 300)));
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
