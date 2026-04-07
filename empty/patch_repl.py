filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix runRepl call - remove the second argument (globals)
old = 'await skulptRef.current.runRepl(line, replGlobals.current);'
new = 'await skulptRef.current.runRepl(line);'

if old in content:
    content = content.replace(old, new, 1)
    print("runRepl call fixed")
else:
    print("NOT FOUND - checking:")
    idx = content.find('runRepl')
    print(repr(content[idx:idx+80]))

# Also fix the softResetAll call - the new engine doesn't expose this via callbacks
old2 = 'skulptRef.current.callbacks.actions.softResetAll();'
new2 = '// reset stage\n        if (skulptRef.current?.callbacks?.actions?.softResetAll) skulptRef.current.callbacks.actions.softResetAll();'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("softResetAll guarded")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
