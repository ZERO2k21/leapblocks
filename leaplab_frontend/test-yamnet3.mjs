const urls = [
  'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/1/default/1/model.json',
  'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/1/default/1/model.json?tfjs-format=file',
  'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1/model.json?tfjs-format=file',
];

async function tryFetch(url, headers) {
  try {
    const res = await fetch(url, { headers });
    console.log('URL:', url);
    console.log('  status:', res.status, 'final:', res.url);
    const ct = res.headers.get('content-type');
    console.log('  content-type:', ct);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log('  bytes:', buf.length, 'head:', buf.slice(0, 40).toString());
      if (ct && ct.includes('json')) {
        const j = JSON.parse(buf.toString());
        console.log('  inputs:', JSON.stringify(j.inputs));
        console.log('  weightsManifest keys:', JSON.stringify(Object.keys(j.weightsManifest || {})));
        console.log('  shards:', (j.weightsManifest || []).map(w => w.paths).flat());
      }
      return buf;
    } else {
      const t = (await res.text()).slice(0, 200);
      console.log('  body:', t.replace(/\n/g, ' '));
    }
  } catch (e) {
    console.log('URL:', url, 'ERR:', e.message);
  }
  return null;
}

(async () => {
  for (const u of urls) {
    await tryFetch(u, { 'tfjs-format': 'file', 'Accept': '*/*' });
  }
  // try raw no-format
  await tryFetch('https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/1/default/1/model.json', {});
})();
