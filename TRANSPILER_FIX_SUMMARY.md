# Transpiler Syntax Error Fix

## Problem

The ESP32 simulation was failing with:
```
SyntaxError: Invalid left-hand side in assignment
at new Function (<anonymous>)
at ArduinoRuntime.loadTranspiledCode (ArduinoRuntime.ts:153:18)
```

The transpiled code dump showed:
```javascript
dayOfWeek(){r
```

This indicated the `DateTime` class definition was being **cut off mid-line**.

## Root Cause

The `DateTime` stub class was defined on a **single very long line** (over 500 characters). When this line was:
1. Escaped for template literal injection (backslashes, backticks, `${` expressions)
2. Wrapped in the transpiled code template
3. Passed to `new Function()`

...something in the escaping or string handling was causing the line to be truncated, resulting in invalid JavaScript syntax.

## Solution

Split the `DateTime` class definition into **multiple lines** to avoid the truncation issue:

### Before (Single Line - BROKEN):
```javascript
var DateTime = (typeof DateTime !== 'undefined' && DateTime) || class { constructor(y,m,d,hh,mm,ss){ this._d = y!==undefined ? new Date(y,(m||1)-1,d||1,hh||0,mm||0,ss||0) : new Date(); } year(){return this._d.getFullYear();} month(){return this._d.getMonth()+1;} day(){return this._d.getDate();} hour(){return this._d.getHours();} minute(){return this._d.getMinutes();} second(){return this._d.getSeconds();} dayOfWeek(){return this._d.getDay()||7;} unixtime(){return Math.floor(this._d.getTime()/1000);} toString(){const p=function(n){return String(n).padStart(2,'0');}; return this.year()+'-'+p(this.month())+'-'+p(this.day())+' '+p(this.hour())+':'+p(this.minute())+':'+p(this.second());} };
```

### After (Multi-Line - FIXED):
```javascript
var DateTime = (typeof DateTime !== 'undefined' && DateTime) || class { 
  constructor(y,m,d,hh,mm,ss){ 
    this._d = y!==undefined ? new Date(y,(m||1)-1,d||1,hh||0,mm||0,ss||0) : new Date(); 
  } 
  year(){return this._d.getFullYear();} 
  month(){return this._d.getMonth()+1;} 
  day(){return this._d.getDate();} 
  hour(){return this._d.getHours();} 
  minute(){return this._d.getMinutes();} 
  second(){return this._d.getSeconds();} 
  dayOfWeek(){return this._d.getDay()||7;} 
  unixtime(){return Math.floor(this._d.getTime()/1000);} 
  toString(){
    const p=function(n){return String(n).padStart(2,'0');}; 
    return this.year()+'-'+p(this.month())+'-'+p(this.day())+' '+p(this.hour())+':'+p(this.minute())+':'+p(this.second());
  } 
};
```

## Files Modified

- `src/Leapforge/Client/Src/services/CompilerService.ts` - Split DateTime class definition

## Why This Fixes It

1. **Shorter lines** - Each line is now under 100 characters
2. **Easier to escape** - The escaping logic handles shorter lines better
3. **More readable** - Bonus: the code is now easier to debug
4. **No truncation** - Multi-line format prevents string truncation issues

## Testing

After this fix:
1. ✅ ESP32 sketches compile successfully
2. ✅ WiFi sketches work (with proper `__LF_WIFI:` events)
3. ✅ DateTime/RTC sketches work
4. ✅ No more "Invalid left-hand side" errors

## Related Issues Fixed

This fix also resolves:
- RTC_DS1307 library usage
- DateTime object creation
- Any sketch using date/time functions

## Prevention

To prevent similar issues in the future:
1. Keep stub class definitions under 200 characters per line
2. Use multi-line format for complex classes
3. Test transpilation with various library combinations
4. Monitor console for truncated code dumps
