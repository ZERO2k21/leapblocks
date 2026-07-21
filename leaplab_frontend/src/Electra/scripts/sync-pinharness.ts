import * as fs from 'fs';
import * as path from 'path';

const tsPath = path.join(__dirname, '../Client/Src/engine/Arduino/PinHarness.ts');

try {
  const tsContent = fs.readFileSync(tsPath, 'utf8');
  const match = tsContent.match(/export const LEAP_PINS.*?= ({[\s\S]*?});/);
  if (!match) throw new Error('Could not parse PinHarness.ts');

  const pinData = JSON.parse(match[1]) as Record<string, { viewBox: { minX: number; minY: number; width: number; height: number }; pins: { name: string; x: number; y: number }[] }>;
  const newTsContent = `/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export const LEAP_PINS: Record<string, { viewBox: { minX: number, minY: number, width: number, height: number }, pins: { name: string, x: number, y: number }[] }> = ${JSON.stringify(pinData, null, 2)};
`;

  fs.writeFileSync(tsPath, newTsContent, 'utf8');
  console.log('✅ Successfully formatted PinHarness.ts');
  console.log(`   TS: ${tsPath}`);
} catch (error) {
  console.error('❌ Error formatting PinHarness.ts:', (error as Error).message);
  process.exit(1);
}
