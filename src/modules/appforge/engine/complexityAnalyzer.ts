// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Complexity Analyzer
// Determines build method per component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import componentsData from '../data/components.json';
import type { AFProject } from '../AppForgeStudio';

type BuildMethod = 'inject' | 'smali' | 'cloud';

interface AnalysisResult {
  method: BuildMethod;
  permissions: string[];
  features: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: string;
  breakdown: { inject: string[]; smali: string[]; cloud: string[] };
}

export function analyzeProject(project: AFProject): AnalysisResult {
  const allComponents = project.screens.flatMap(s => s.components);
  const breakdown = { inject: [] as string[], smali: [] as string[], cloud: [] as string[] };
  const permissions: string[] = [];
  const features: string[] = [];

  allComponents.forEach(comp => {
    const def = (componentsData as any[]).find(d => d.name === comp.type);
    if (!def) return;

    const method = def.buildMethod as BuildMethod || 'inject';
    breakdown[method].push(comp.type);

    // Auto-detect permissions
    if (['Camera', 'ImagePicker'].includes(comp.type)) permissions.push('CAMERA');
    if (['LocationSensor', 'Map'].includes(comp.type)) permissions.push('ACCESS_FINE_LOCATION');
    if (['BluetoothClient', 'BluetoothServer'].includes(comp.type)) permissions.push('BLUETOOTH', 'BLUETOOTH_CONNECT');
    if (['WiFiDirect'].includes(comp.type)) permissions.push('ACCESS_WIFI_STATE', 'CHANGE_WIFI_STATE');
    if (['File', 'SQLite'].includes(comp.type)) permissions.push('READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE');
    if (['PhoneCall'].includes(comp.type)) permissions.push('CALL_PHONE');
    if (['Texting'].includes(comp.type)) permissions.push('SEND_SMS');
    if (['ContactPicker'].includes(comp.type)) permissions.push('READ_CONTACTS');
    if (['SpeechRecognizer'].includes(comp.type)) permissions.push('RECORD_AUDIO');
    if (['NFC'].includes(comp.type)) permissions.push('NFC');
    if (['Pedometer', 'AccelerometerSensor'].includes(comp.type)) permissions.push('BODY_SENSORS');

    features.push(comp.type);
  });

  // Determine primary method
  let method: BuildMethod = 'inject';
  if (breakdown.smali.length > 0) method = 'smali';
  if (breakdown.cloud.length > 0) method = 'cloud';

  // Complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (allComponents.length > 10 || breakdown.smali.length > 3) complexity = 'moderate';
  if (allComponents.length > 25 || breakdown.cloud.length > 0) complexity = 'complex';

  // Time estimate
  const times: Record<string, string> = { simple: '10-30 sec', moderate: '30-90 sec', complex: '2-5 min' };

  return {
    method,
    permissions: [...new Set(permissions)],
    features: [...new Set(features)],
    complexity,
    estimatedTime: times[complexity],
    breakdown,
  };
}
