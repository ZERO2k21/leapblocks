let _cachedKeyPair: CryptoKeyPair | null = null;

async function getOrCreateKeyPair(): Promise<CryptoKeyPair> {
  if (_cachedKeyPair) return _cachedKeyPair;

  try {
    const stored = localStorage.getItem('leaplab_apk_debug_key');
    if (stored) {
      const { privateKey, publicKey } = JSON.parse(stored);
      const privKeyBuf = base64ToArrayBuffer(privateKey);
      const pubKeyBuf = base64ToArrayBuffer(publicKey);

      _cachedKeyPair = {
        privateKey: await crypto.subtle.importKey(
          'pkcs8', privKeyBuf,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          true, ['sign']
        ),
        publicKey: await crypto.subtle.importKey(
          'spki', pubKeyBuf,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          true, ['verify']
        )
      };
      return _cachedKeyPair;
    }
  } catch {
    //
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  _cachedKeyPair = keyPair;

  try {
    const privExported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const pubExported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    localStorage.setItem('leaplab_apk_debug_key', JSON.stringify({
      privateKey: arrayBufferToBase64(privExported),
      publicKey: arrayBufferToBase64(pubExported),
    }));
  } catch {
    //
  }

  return _cachedKeyPair;
}

async function sha256Base64(data: ArrayBuffer | string): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hash);
}

async function generateManifest(zipFiles: [string, ArrayBuffer][]): Promise<string> {
  let manifest = 'Manifest-Version: 1.0\r\n';
  manifest += 'Created-By: LeapLab AppInverter\r\n';
  manifest += '\r\n';

  for (const [name, data] of zipFiles) {
    if (name.startsWith('META-INF/')) continue;

    const digest = await sha256Base64(data);
    manifest += `Name: ${name}\r\n`;
    manifest += `SHA-256-Digest: ${digest}\r\n`;
    manifest += '\r\n';
  }

  return manifest;
}

async function generateSignatureFile(manifestContent: string): Promise<string> {
  const manifestDigest = await sha256Base64(manifestContent);

  let sf = 'Signature-Version: 1.0\r\n';
  sf += 'Created-By: LeapLab AppInverter\r\n';
  sf += `SHA-256-Digest-Manifest: ${manifestDigest}\r\n`;
  sf += '\r\n';

  const sections = manifestContent.split('\r\n\r\n').filter(s => s.includes('Name:'));
  for (const section of sections) {
    const nameMatch = section.match(/Name:\s*(.+)/);
    if (!nameMatch) continue;

    const sectionDigest = await sha256Base64(section + '\r\n\r\n');
    sf += `Name: ${nameMatch[1].trim()}\r\n`;
    sf += `SHA-256-Digest: ${sectionDigest}\r\n`;
    sf += '\r\n';
  }

  return sf;
}

async function createSelfSignedCert(publicKey: CryptoKey): Promise<{ tbsCert: Uint8Array; sha256WithRSA: Uint8Array }> {
  const pubKeyDer = await crypto.subtle.exportKey('spki', publicKey);
  const pubKeyBytes = new Uint8Array(pubKeyDer);

  const serialNumber = new Uint8Array([0x01]);
  const issuerDN = buildDN('LeapLab', 'AppInverter', 'IN');
  const notBefore = encodeUTCTime(new Date('2024-01-01'));
  const notAfter = encodeUTCTime(new Date('2034-12-31'));
  const validity = buildSequence([notBefore, notAfter]);

  const sha256WithRSA = buildSequence([
    buildOID([1, 2, 840, 113549, 1, 1, 11]),
    new Uint8Array([0x05, 0x00])
  ]);

  const tbsCert = buildSequence([
    buildExplicit(0, buildSequence([encodeInteger(2)])),
    encodeInteger(1),
    sha256WithRSA,
    issuerDN,
    validity,
    issuerDN,
    new Uint8Array(pubKeyBytes),
  ]);

  return { tbsCert, sha256WithRSA };
}

async function generateCertRsa(sfContent: string, privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
  const sfBytes = new TextEncoder().encode(sfContent);

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    sfBytes
  );

  const { tbsCert, sha256WithRSA } = await createSelfSignedCert(publicKey);

  const certSignature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    tbsCert
  );

  const certificate = buildSequence([
    tbsCert,
    sha256WithRSA,
    buildBitString(new Uint8Array(certSignature))
  ]);

  const pkcs7 = buildPKCS7SignedData(
    certificate,
    new Uint8Array(signature),
    sha256WithRSA
  );

  return pkcs7;
}

export async function signApk(zip: any): Promise<any> {
  const { privateKey, publicKey } = await getOrCreateKeyPair();

  const files: string[] = [];
  zip.forEach((relativePath: string, zipEntry: any) => {
    if (!zipEntry.dir && !relativePath.startsWith('META-INF/')) {
      files.push(relativePath);
    }
  });

  const fileEntries: [string, ArrayBuffer][] = [];
  for (const name of files) {
    const data = await zip.file(name).async('uint8array') as ArrayBuffer;
    fileEntries.push([name, data]);
  }

  const manifest = await generateManifest(fileEntries);
  zip.file('META-INF/MANIFEST.MF', manifest);

  const sf = await generateSignatureFile(manifest);
  zip.file('META-INF/CERT.SF', sf);

  const certRsa = await generateCertRsa(sf, privateKey, publicKey);
  zip.file('META-INF/CERT.RSA', certRsa);

  return zip;
}

function buildTag(tag: number, content: Uint8Array): Uint8Array {
  const len = encodeLength(content.length);
  const result = new Uint8Array(1 + len.length + content.length);
  result[0] = tag;
  result.set(len, 1);
  result.set(content, 1 + len.length);
  return result;
}

function buildSequence(items: Uint8Array[]): Uint8Array {
  const content = concatArrays(items);
  return buildTag(0x30, content);
}

function buildSet(items: Uint8Array[]): Uint8Array {
  const content = concatArrays(items);
  return buildTag(0x31, content);
}

function buildOID(values: number[]): Uint8Array {
  const encoded: number[] = [];
  encoded.push(40 * values[0] + values[1]);
  for (let i = 2; i < values.length; i++) {
    let val = values[i];
    if (val >= 128) {
      const bytes: number[] = [];
      while (val > 0) {
        bytes.unshift(val & 0x7F);
        val = val >> 7;
      }
      for (let j = 0; j < bytes.length - 1; j++) {
        encoded.push(bytes[j] | 0x80);
      }
      encoded.push(bytes[bytes.length - 1]);
    } else {
      encoded.push(val);
    }
  }
  return buildTag(0x06, new Uint8Array(encoded));
}

function buildExplicit(tag: number, content: Uint8Array): Uint8Array {
  return buildTag(0xA0 | tag, content);
}

function buildBitString(data: Uint8Array): Uint8Array {
  const content = new Uint8Array(1 + data.length);
  content[0] = 0x00;
  content.set(data, 1);
  return buildTag(0x03, content);
}

function buildOctetString(data: Uint8Array): Uint8Array {
  return buildTag(0x04, data);
}

function encodeInteger(value: number | Uint8Array): Uint8Array {
  if (typeof value === 'number') {
    const bytes: number[] = [];
    let v = value;
    do {
      bytes.unshift(v & 0xFF);
      v = v >> 8;
    } while (v > 0);
    if (bytes[0] & 0x80) bytes.unshift(0x00);
    return buildTag(0x02, new Uint8Array(bytes));
  }
  return buildTag(0x02, new Uint8Array([value as unknown as number]));
}

function encodeUTCTime(date: Date): Uint8Array {
  const y = String(date.getUTCFullYear()).slice(-2);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  const str = `${y}${m}${d}${h}${min}${s}Z`;
  return buildTag(0x17, new TextEncoder().encode(str));
}

function encodeLength(length: number): Uint8Array {
  if (length < 128) return new Uint8Array([length]);
  const bytes: number[] = [];
  let l = length;
  while (l > 0) {
    bytes.unshift(l & 0xFF);
    l = l >> 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function buildDN(cn: string, ou: string, c: string): Uint8Array {
  const cnAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 3]),
    buildTag(0x0C, new TextEncoder().encode(cn))
  ])]);
  const ouAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 11]),
    buildTag(0x0C, new TextEncoder().encode(ou))
  ])]);
  const cAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 6]),
    buildTag(0x13, new TextEncoder().encode(c))
  ])]);
  return buildSequence([cAttr, ouAttr, cnAttr]);
}

function buildPKCS7SignedData(certificate: Uint8Array, signature: Uint8Array, digestAlgorithm: Uint8Array): Uint8Array {
  const signedDataOID = buildOID([1, 2, 840, 113549, 1, 7, 2]);

  const sha256OID = buildSequence([
    buildOID([2, 16, 840, 1, 101, 3, 4, 2, 1]),
    new Uint8Array([0x05, 0x00])
  ]);
  const digestAlgorithms = buildSet([sha256OID]);

  const contentInfo = buildSequence([
    buildOID([1, 2, 840, 113549, 1, 7, 1])
  ]);

  const certificates = buildExplicit(0, certificate);

  const signerInfo = buildSequence([
    encodeInteger(1),
    buildSequence([buildSequence([]), encodeInteger(1)]),
    sha256OID,
    digestAlgorithm,
    buildOctetString(signature)
  ]);
  const signerInfos = buildSet([signerInfo]);

  const signedData = buildSequence([
    encodeInteger(1),
    digestAlgorithms,
    contentInfo,
    certificates,
    signerInfos
  ]);

  return buildSequence([
    signedDataOID,
    buildExplicit(0, signedData)
  ]);
}

function concatArrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
