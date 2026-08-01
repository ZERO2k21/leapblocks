/**
 * Release Upload Script for LeapBlocks / LeapLab
 * 
 * This script automates uploading the packaged installer (.exe), the latest.yml metadata,
 * and the differential update .blockmap to the Creoleap LMS API.
 * 
 * Usage:
 *   npx ts-node scripts/upload-release.ts
 * 
 * Or pass options:
 *   npx ts-node scripts/upload-release.ts --token <your-admin-token> --url <api-base-url> --notes "Release notes here"
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Read command line arguments
const args = process.argv.slice(2);
const getArgValue = (flag: string): string | null => {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
};

let token: string | null = getArgValue('--token') || process.env.LEAPLAB_ADMIN_TOKEN || null;
let apiBaseUrl: string = getArgValue('--url') || 'https://lms-api.creoleap.workers.dev';
let releaseNotes: string | null = getArgValue('--notes');

const OUT_DIR = path.join(__dirname, '../out');

// Setup readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

async function main(): Promise<void> {
  console.log('\n==================================================');
  console.log('🚀  Creoleap LeapBlocks - Release Uploader  🚀');
  console.log('==================================================\n');

  // 1. Verify that build files exist in out/
  const latestYmlPath = path.join(OUT_DIR, 'latest.yml');
  if (!fs.existsSync(latestYmlPath)) {
    console.error('❌ Error: out/latest.yml not found. Have you run "bun run dist:win" or "bun run dist"?');
    process.exit(1);
  }

  // Read latest.yml
  const latestYmlContent = fs.readFileSync(latestYmlPath, 'utf8');
  
  // Parse version and installer path from latest.yml
  const versionMatch = latestYmlContent.match(/^version:\s*(.+)$/m);
  const pathMatch = latestYmlContent.match(/^path:\s*(.+)$/m);
  
  if (!versionMatch || !pathMatch) {
    console.error('❌ Error: Could not parse version or installer path from out/latest.yml');
    process.exit(1);
  }

  const version = versionMatch[1].trim();
  const exeFilename = pathMatch[1].trim();
  const exePath = path.join(OUT_DIR, exeFilename);
  const blockmapPath = path.join(OUT_DIR, `${exeFilename}.blockmap`);

  console.log(`📦 Found Release Files:`);
  console.log(`   - Version: v${version}`);
  console.log(`   - Setup File: ${exeFilename} (${(fs.statSync(exePath).size / (1024 * 1024)).toFixed(2)} MB)`);
  if (fs.existsSync(blockmapPath)) {
    console.log(`   - Blockmap: ${path.basename(blockmapPath)} (${(fs.statSync(blockmapPath).size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`   - Blockmap: Not found (optional)`);
  }
  console.log(`   - latest.yml: Found\n`);

  // 2. Ask for API Base URL if not specified
  if (!getArgValue('--url')) {
    const urlInput = await askQuestion(`🌐 Enter LMS API Base URL [default: https://lms-api.creoleap.workers.dev]: `);
    if (urlInput.trim()) {
      apiBaseUrl = urlInput.trim();
    }
  }

  // Normalize API base url (remove trailing slash)
  if (apiBaseUrl.endsWith('/')) {
    apiBaseUrl = apiBaseUrl.slice(0, -1);
  }

  // 3. Ask for Admin Token if not specified
  if (!token) {
    console.log('🔑 Authentication Required:');
    token = await askQuestion('   Enter Admin Token: ');
    if (!token.trim()) {
      console.error('❌ Error: Admin Token is required.');
      rl.close();
      process.exit(1);
    }
    token = token.trim();
  }

  // 4. Prompt for release notes if not specified
  if (!releaseNotes) {
    console.log('\n📝 Release Notes:');
    releaseNotes = await askQuestion('   Enter release notes (optional): ');
  }

  rl.close();

  // 5. Prepare Multipart Form Data
  console.log('\n📤 Preparing upload package...');
  const formData = new FormData();
  formData.append('version', version);
  formData.append('releaseNotes', releaseNotes || '');
  formData.append('latestYml', latestYmlContent);

  // Read and append exe file
  const exeBuffer = fs.readFileSync(exePath);
  const exeBlob = new Blob([exeBuffer], { type: 'application/octet-stream' });
  formData.append('file', exeBlob, exeFilename);

  // Read and append blockmap if exists
  if (fs.existsSync(blockmapPath)) {
    const blockmapBuffer = fs.readFileSync(blockmapPath);
    const blockmapBlob = new Blob([blockmapBuffer], { type: 'application/octet-stream' });
    formData.append('blockmap', blockmapBlob, path.basename(blockmapPath));
  }

  // 6. Send the POST Request
  const uploadUrl = `${apiBaseUrl}/api/admin/leapblocks/versions`;
  console.log(`🌐 Uploading to: ${uploadUrl}`);
  console.log('⏳ This might take a couple of minutes depending on your connection speed...');

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = (await response.json()) as any;

    if (!response.ok || !result.success) {
      console.error('\n❌ Upload Failed!');
      console.error(`   HTTP Status: ${response.status} ${response.statusText}`);
      console.error(`   Error message: ${result.message || JSON.stringify(result)}`);
      process.exit(1);
    }

    console.log('\n✅ Upload Successful!');
    console.log(`🎉 Version ${version} is now live!`);
    console.log(`🔗 Executable URL: ${result.data?.exeUrl || 'N/A'}`);
    console.log(`🔗 latest.yml URL: ${result.data?.latestYmlUrl || 'N/A'}`);
    if (result.data?.blockmapUrl) {
      console.log(`🔗 Blockmap URL: ${result.data.blockmapUrl}`);
    }
  } catch (error: any) {
    console.error('\n❌ Network or Server Error:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch((err: any) => {
  console.error('\n❌ An unexpected error occurred:', err);
  rl.close();
  process.exit(1);
});
