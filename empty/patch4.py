filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Patch: add backdrop image behind the grid in the stage canvas
old = '                        <div style={{ flex: 1, position: "relative", background: "#fff", overflow: "hidden" }}>'
new = '                        <div style={{ flex: 1, position: "relative", background: backdrop ? "transparent" : "#fff", overflow: "hidden" }}>\n                            {/* Backdrop image */}\n                            {backdrop && <img src={backdrop} alt="backdrop" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />}'

if old in content:
    content = content.replace(old, new, 1)
    print("Stage backdrop patch applied")
else:
    # try CRLF
    old_c = old.replace('\n', '\r\n')
    if old_c in content:
        content = content.replace(old_c, new, 1)
        print("Stage backdrop patch applied (CRLF)")
    else:
        print("NOT FOUND - showing context:")
        idx = content.find('Stage Canvas')
        print(repr(content[idx:idx+300]))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
