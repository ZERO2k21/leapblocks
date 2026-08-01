const urls = [
  'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1/model.json?tfjs-format=file',
  'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/1/default/1/model.json?tfjs-format=file',
];

async function main() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'tfjs-format': 'file' } });
      console.log('URL:', url);
      console.log('STATUS:', res.status, res.statusText, 'FINAL:', res.url);
      const text = await res.text();
      if (res.ok) {
        const json = JSON.parse(text);
        console.log('inputs:', JSON.stringify(json.inputs, null, 2));
        if (json.signatures) console.log('signatures:', JSON.stringify(json.signatures, null, 2));
        process.exit(0);
      } else {
        console.log('BODY[:300]:', text.slice(0, 300).replace(/\n/g, ' '));
      }
    } catch (e) {
      console.log('URL:', url, 'ERR:', e.message);
    }
  }
}
main();
