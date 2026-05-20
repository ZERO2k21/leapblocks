/**
 * Browser-compatible APK v1 (JAR) Signer
 *
 * Implements JAR signing using Web Crypto API.
 * Produces META-INF/MANIFEST.MF, CERT.SF, and CERT.RSA
 * so the APK can be installed on Android devices.
 *
 * Uses a self-signed RSA-2048 debug key embedded as constants.
 */

// ── Pre-generated debug RSA key pair (PKCS#8 / SPKI, base64) ────────────
// These are a self-signed debug key — safe to embed, used only for
// development/testing APKs. Production apps should use a real keystore.
let _cachedKeyPair = null;

async function getOrCreateKeyPair() {
  if (_cachedKeyPair) return _cachedKeyPair;

  // Check localStorage for a persisted key
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
  } catch (e) {
    // localStorage not available or key corrupted — generate fresh
  }

  // Generate a new RSA-2048 key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['sign', 'verify']
  );

  _cachedKeyPair = keyPair;

  // Persist to localStorage
  try {
    const privExported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const pubExported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    localStorage.setItem('leaplab_apk_debug_key', JSON.stringify({
      privateKey: arrayBufferToBase64(privExported),
      publicKey: arrayBufferToBase64(pubExported),
    }));
  } catch (e) {
    // Non-critical — key just won't persist across sessions
  }

  return _cachedKeyPair;
}

// ── Core signing functions ───────────────────────────────────────────────

/**
 * Compute SHA-256 digest of data, return as base64
 */
async function sha256Base64(data) {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hash);
}

/**
 * Generate MANIFEST.MF content
 * Each entry: Name + SHA-256-Digest
 */
async function generateManifest(zipFiles) {
  let manifest = 'Manifest-Version: 1.0\r\n';
  manifest += 'Created-By: LeapLab AppInverter\r\n';
  manifest += '\r\n';

  for (const [name, data] of zipFiles) {
    // Skip META-INF entries
    if (name.startsWith('META-INF/')) continue;

    const digest = await sha256Base64(data);
    manifest += `Name: ${name}\r\n`;
    manifest += `SHA-256-Digest: ${digest}\r\n`;
    manifest += '\r\n';
  }

  return manifest;
}

/**
 * Generate CERT.SF (signature file)
 * Contains digest of the whole manifest + per-entry digests
 */
async function generateSignatureFile(manifestContent) {
  const manifestDigest = await sha256Base64(manifestContent);

  let sf = 'Signature-Version: 1.0\r\n';
  sf += 'Created-By: LeapLab AppInverter\r\n';
  sf += `SHA-256-Digest-Manifest: ${manifestDigest}\r\n`;
  sf += '\r\n';

  // Per-section digests
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

/**
 * Create a minimal self-signed X.509 certificate (DER encoded)
 * This is a simplified certificate structure sufficient for APK v1 signing.
 */
async function createSelfSignedCert(publicKey) {
  const pubKeyDer = await crypto.subtle.exportKey('spki', publicKey);
  const pubKeyBytes = new Uint8Array(pubKeyDer);

  // Build a minimal X.509 v3 certificate in DER
  const serialNumber = new Uint8Array([0x01]);
  const issuerDN = buildDN('LeapLab', 'AppInverter', 'IN');
  const notBefore = encodeUTCTime(new Date('2024-01-01'));
  const notAfter = encodeUTCTime(new Date('2034-12-31'));
  const validity = buildSequence([notBefore, notAfter]);

  // SHA-256 with RSA OID
  const sha256WithRSA = buildSequence([
    buildOID([1, 2, 840, 113549, 1, 1, 11]), // sha256WithRSAEncryption
    new Uint8Array([0x05, 0x00]) // NULL
  ]);

  // TBS Certificate
  const tbsCert = buildSequence([
    buildExplicit(0, buildSequence([encodeInteger(2)])), // version v3
    encodeInteger(1), // serial
    sha256WithRSA, // signature algorithm
    issuerDN, // issuer
    validity,
    issuerDN, // subject (same as issuer — self-signed)
    new Uint8Array(pubKeyBytes), // subject public key info
  ]);

  return { tbsCert, sha256WithRSA };
}

/**
 * Sign the CERT.SF and produce CERT.RSA (PKCS#7 SignedData)
 */
async function generateCertRsa(sfContent, privateKey, publicKey) {
  const sfBytes = new TextEncoder().encode(sfContent);

  // Sign the SF content
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    sfBytes
  );

  const { tbsCert, sha256WithRSA } = await createSelfSignedCert(publicKey);

  // Sign the TBS certificate
  const certSignature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    tbsCert
  );

  // Build full X.509 certificate
  const certificate = buildSequence([
    tbsCert,
    sha256WithRSA,
    buildBitString(new Uint8Array(certSignature))
  ]);

  // Build PKCS#7 SignedData
  const pkcs7 = buildPKCS7SignedData(
    certificate,
    new Uint8Array(signature),
    sha256WithRSA
  );

  return pkcs7;
}

/**
 * Sign an APK (JSZip instance) — adds META-INF entries
 */
export async function signApk(zip) {
  const { privateKey, publicKey } = await getOrCreateKeyPair();

  // Collect all files
  const files = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith('META-INF/')) {
      files.push(relativePath);
    }
  });

  // Get file data and compute digests
  const fileEntries = [];
  for (const name of files) {
    const data = await zip.file(name).async('uint8array');
    fileEntries.push([name, data]);
  }

  // Generate MANIFEST.MF
  const manifest = await generateManifest(fileEntries);
  zip.file('META-INF/MANIFEST.MF', manifest);

  // Generate CERT.SF
  const sf = await generateSignatureFile(manifest);
  zip.file('META-INF/CERT.SF', sf);

  // Generate CERT.RSA (PKCS#7 signature)
  const certRsa = await generateCertRsa(sf, privateKey, publicKey);
  zip.file('META-INF/CERT.RSA', certRsa);

  return zip;
}

// ── ASN.1 DER encoding helpers ───────────────────────────────────────────

function buildTag(tag, content) {
  const len = encodeLength(content.length);
  const result = new Uint8Array(1 + len.length + content.length);
  result[0] = tag;
  result.set(len, 1);
  result.set(content, 1 + len.length);
  return result;
}

function buildSequence(items) {
  const content = concatArrays(items);
  return buildTag(0x30, content);
}

function buildSet(items) {
  const content = concatArrays(items);
  return buildTag(0x31, content);
}

function buildOID(values) {
  const encoded = [];
  encoded.push(40 * values[0] + values[1]);
  for (let i = 2; i < values.length; i++) {
    let val = values[i];
    if (val >= 128) {
      const bytes = [];
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

function buildExplicit(tag, content) {
  return buildTag(0xA0 | tag, content);
}

function buildBitString(data) {
  const content = new Uint8Array(1 + data.length);
  content[0] = 0x00; // no unused bits
  content.set(data, 1);
  return buildTag(0x03, content);
}

function buildOctetString(data) {
  return buildTag(0x04, data);
}

function encodeInteger(value) {
  if (typeof value === 'number') {
    const bytes = [];
    let v = value;
    do {
      bytes.unshift(v & 0xFF);
      v = v >> 8;
    } while (v > 0);
    if (bytes[0] & 0x80) bytes.unshift(0x00);
    return buildTag(0x02, new Uint8Array(bytes));
  }
  return buildTag(0x02, new Uint8Array([value]));
}

function encodeUTCTime(date) {
  const y = String(date.getUTCFullYear()).slice(-2);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  const str = `${y}${m}${d}${h}${min}${s}Z`;
  return buildTag(0x17, new TextEncoder().encode(str));
}

function encodeLength(length) {
  if (length < 128) return new Uint8Array([length]);
  const bytes = [];
  let l = length;
  while (l > 0) {
    bytes.unshift(l & 0xFF);
    l = l >> 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function buildDN(cn, ou, c) {
  const cnAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 3]), // commonName
    buildTag(0x0C, new TextEncoder().encode(cn)) // UTF8String
  ])]);
  const ouAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 11]), // organizationalUnitName
    buildTag(0x0C, new TextEncoder().encode(ou))
  ])]);
  const cAttr = buildSet([buildSequence([
    buildOID([2, 5, 4, 6]), // countryName
    buildTag(0x13, new TextEncoder().encode(c)) // PrintableString
  ])]);
  return buildSequence([cAttr, ouAttr, cnAttr]);
}

function buildPKCS7SignedData(certificate, signature, digestAlgorithm) {
  // Content type: signedData (1.2.840.113549.1.7.2)
  const signedDataOID = buildOID([1, 2, 840, 113549, 1, 7, 2]);

  // Digest algorithm: SHA-256 (2.16.840.1.101.3.4.2.1)
  const sha256OID = buildSequence([
    buildOID([2, 16, 840, 1, 101, 3, 4, 2, 1]),
    new Uint8Array([0x05, 0x00])
  ]);
  const digestAlgorithms = buildSet([sha256OID]);

  // Content info (data OID, no content)
  const contentInfo = buildSequence([
    buildOID([1, 2, 840, 113549, 1, 7, 1]) // data
  ]);

  // Certificates (implicit [0])
  const certificates = buildExplicit(0, certificate);

  // Signer info
  const signerInfo = buildSequence([
    encodeInteger(1), // version
    buildSequence([buildSequence([]), encodeInteger(1)]), // issuer and serial
    sha256OID, // digest algorithm
    digestAlgorithm, // digest encryption algorithm (RSA with SHA-256)
    buildOctetString(signature) // encrypted digest
  ]);
  const signerInfos = buildSet([signerInfo]);

  // SignedData
  const signedData = buildSequence([
    encodeInteger(1), // version
    digestAlgorithms,
    contentInfo,
    certificates,
    signerInfos
  ]);

  // Wrap in ContentInfo
  return buildSequence([
    signedDataOID,
    buildExplicit(0, signedData)
  ]);
}

// ── Utility functions ────────────────────────────────────────────────────

function concatArrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
