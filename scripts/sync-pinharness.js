/**
 * Script to sync PinHarness.json to PinHarness.ts
 * Run this after editing PinHarness.json to update the TypeScript file
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../src/Electra/Client/Src/engine/Arduino/PinHarness.json');
const tsPath = path.join(__dirname, '../src/Electra/Client/Src/engine/Arduino/PinHarness.ts');

try {
    // Read the JSON file
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const pinData = JSON.parse(jsonContent);

    // Generate TypeScript file content
    const tsContent = `/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export const LEAP_PINS: Record<string, { viewBox: { minX: number, minY: number, width: number, height: number }, pins: { name: string, x: number, y: number }[] }> = ${JSON.stringify(pinData, null, 2)};
`;

    // Write the TypeScript file
    fs.writeFileSync(tsPath, tsContent, 'utf8');

    console.log('✅ Successfully synced PinHarness.json → PinHarness.ts');
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   TS:   ${tsPath}`);
} catch (error) {
    console.error('❌ Error syncing PinHarness files:', error.message);
    process.exit(1);
}
