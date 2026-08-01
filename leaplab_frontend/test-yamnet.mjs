import * as tf from '@tensorflow/tfjs';
await tf.setBackend('cpu');

async function main() {
  const model = await tf.loadGraphModel(
    'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
    { fromTFHub: true }
  );
  const inputs = model.inputs;
  console.log('INPUTS:', JSON.stringify(inputs, null, 2));

  const samples = new Float32Array(15600).fill(0.001);

  // Test shape A: 3D [1, 15600, 1]
  try {
    const inputTensor = tf.tensor3d(samples, [1, 15600, 1]);
    const result = await model.executeAsync(inputTensor);
    console.log('3D OK, outputs:', result.length, result.map(r => r.shape));
    result.forEach(r => r.dispose());
    inputTensor.dispose();
  } catch (e) {
    console.log('3D FAILED:', e.message);
  }

  // Test shape B: 2D [1, 15600]
  try {
    const inputTensor = tf.tensor2d(samples, [1, 15600]);
    const result = await model.executeAsync(inputTensor);
    console.log('2D OK, outputs:', result.length, result.map(r => r.shape));
    result.forEach(r => r.dispose());
    inputTensor.dispose();
  } catch (e) {
    console.log('2D FAILED:', e.message);
  }

  process.exit(0);
}

main().catch(e => { console.error('TOP:', e.message); process.exit(1); });
