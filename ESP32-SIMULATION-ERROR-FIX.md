# ESP32 Simulation Error Fix

## Error Message
```
SyntaxError: Unexpected identifier 'machine'
at new Function (<anonymous>)
at ArduinoRuntime.loadTranspiledCode
```

## Root Cause

The error "Unexpected identifier 'machine'" indicates a JavaScript syntax error in the transpiled code. This can happen due to several reasons:

### Possible Causes:

1. **Template Literal Injection Issue**
   - The transpiled code is wrapped in a template literal
   - If user code contains backticks `` ` `` or `${` sequences, it breaks the template
   
2. **Comment Parsing Issue**
   - Multi-line comments with special characters
   - Comments containing code-like syntax

3. **String Literal Issues**
   - Strings with unescaped quotes
   - Strings with special characters

## Quick Fix

### Option 1: Check Your Arduino Code

Look for these patterns in your Arduino sketch:

```cpp
// ❌ BAD - Contains backticks or ${
String message = `Hello ${name}`;  // Template literals don't exist in C++

// ❌ BAD - Unescaped quotes
String text = "He said "hello"";  // Should use \"

// ✅ GOOD
String message = "Hello " + name;
String text = "He said \"hello\"";
```

### Option 2: Clear and Restart

1. Clear your Arduino code editor
2. Write a simple test sketch:
```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("Test");
}

void loop() {
  delay(1000);
}
```
3. Try simulating again

### Option 3: Check for Hidden Characters

- Copy your code to a plain text editor
- Look for unusual characters or formatting
- Retype any suspicious lines

## Permanent Fix (For Developers)

The issue is in `CompilerService.ts` where the transpiled code is wrapped in a template literal. The fix is to properly escape the user code before injection:

### Current Code (Line ~262):
```typescript
const wrapped = `
// Library stubs...
${js}  // ← This can break if js contains backticks or ${
if (typeof __setup === 'function') { __exports.setup = __setup; }
`;
```

### Fixed Code:
```typescript
// Escape template literal special characters
const escapedJs = js
  .replace(/\\/g, '\\\\')   // Escape backslashes first
  .replace(/`/g, '\\`')      // Escape backticks
  .replace(/\${/g, '\\${');  // Escape template expressions

const wrapped = `
// Library stubs...
${escapedJs}
if (typeof __setup === 'function') { __exports.setup = __setup; }
`;
```

Or better yet, use string concatenation instead of template literals:

```typescript
const wrapped = 
  '// Library stubs...\n' +
  '// ... all the var declarations ...\n' +
  js + '\n' +
  'if (typeof __setup === \'function\') { __exports.setup = __setup; }\n' +
  'if (typeof __loop === \'function\') { __exports.loop = __loop; }\n';
```

## Testing

After applying the fix:

1. Try simulating with various Arduino sketches
2. Test with code containing:
   - String literals with quotes
   - Multi-line comments
   - Special characters
   - Template-like syntax (even though C++ doesn't support it)

## Additional Notes

- The error log shows the DateTime class was cut off at `dayOfWeek(){r` - this is just console truncation, not the actual error
- The real error is likely earlier in the transpiled code
- Check the full transpiled code dump in the console for the exact location of the syntax error

## Need Help?

If the error persists:
1. Share your Arduino sketch code
2. Check the browser console for the full "TRANSPILED CODE DUMP"
3. Look for the line with the syntax error
4. The error will be near where "machine" appears unexpectedly
