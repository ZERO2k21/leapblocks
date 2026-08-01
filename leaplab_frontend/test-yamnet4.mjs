const urls = [
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/yamnet/dist/model.json',
  'https://unpkg.com/@tensorflow-models/yamnet/model.json',
  'https://raw.githubusercontent.com/tensorflow/tfjs-examples/master/yamnet/model.json',
  'https://storage.googleapis.com/kaggle-models/yamnet/model.json',
  'https://www.kaggle.com/models/google/yamnet/frameworks/tfjs/variations/classification/1/model.json',
];

(async () => {
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'tfjs-format': 'file', 'Accept': '*/*' } });
      const ct = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      let looksJson = buf.length > 0 && (buf[0] === 0x7b || buf[0] === 0x5b);
      console.log(`[${res.status}] ${u}`);
      console.log(`   ct=${ct} bytes=${buf.length} jsonStart=${looksJson} head=${buf.slice(0, 30).toString()}`);
    } catch (e) {
      console.log(`[ERR] ${u} :: ${e.message}`);
    }
  }
})();
