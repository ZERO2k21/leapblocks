/**
 * leapCodex/codex.ts
 * Main entry point for the LeapCodex module.
 *
 * LeapCodex handles Python code generation and the Python editor UI
 * for the LeapBlocks intermediate (embed) environment.
 *
 * Structure:
 *   client/
 *     components/  — React UI components (PythonEditorTab)
 *     hooks/       — React hooks (future)
 *     styles/      — Style objects (future)
 *   server/
 *     generators/  — Code generators (pythonGenerator)
 *
 * Usage:
 *   import { pythonGenerator, initPythonGenerator, PythonEditorTab } from 'src/leapCodex/codex';
 */
export { pythonGenerator, initPythonGenerator } from './server/generators/pythonGenerator';
export { PythonEditorTab } from './client/components/pythonEditorTab';
