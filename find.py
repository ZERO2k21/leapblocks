import re

filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the monacoRef line (adjust for LF/CRLF)
idx = content.find('monacoRef = useRef')
print(repr(content[idx-4:idx+50]))
