import re

filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Patch 1: Fix state section - add backdrop, spriteFilter, installedExtensions
old_state = '    const [stageView, setStageView] = useState("stage"); // "stage" | "sprites"'
new_state = '''    const [stageView, setStageView] = useState("stage");
    const [backdrop, setBackdropImg] = useState(null);
    const [sidePanel, setSidePanel] = useState("files");
    const [spriteFilter, setSpriteFilter] = useState("");
    const [installedExtensions, setInstalledExtensions] = useState([]);'''

# Also remove the old sidePanel line that follows
old_side = '''    const [stageView, setStageView] = useState("stage"); // "stage" | "sprites"

    // Sidebar panel
    const [sidePanel, setSidePanel] = useState("files"); // "files" | "outline"'''

if old_side in content:
    content = content.replace(old_side, new_state, 1)
    print("Patch 1 applied (LF)")
else:
    old_side_crlf = old_side.replace('\n', '\r\n')
    if old_side_crlf in content:
        content = content.replace(old_side_crlf, new_state, 1)
        print("Patch 1 applied (CRLF)")
    else:
        print("Patch 1 NOT FOUND - searching for stageView context:")
        idx = content.find('stageView')
        print(repr(content[idx:idx+200]))

# Patch 2: Add handlers before updateSpriteProperty
handlers = '''
    // Sprite Library - add from library
    const addSpriteFromLibrary = (sp) => {
        const id = sp.name.toLowerCase() + '-' + Date.now();
        const newSprite = { id, name: sp.name, type: sp.type, x: (Math.random()-0.5)*80, y: (Math.random()-0.5)*80, angle: 90, size: 100, visible: true, speech: '', currentCostume: 'default', costumes: { default: sp.img } };
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(id);
        const fname = sp.name + '.py';
        setProjectFiles(prev => prev[fname] ? prev : { ...prev, [fname]: "# " + sp.name + " sprite" + "\\nsprite = Sprite('" + sp.name + "')" + "\\nsprite.say('Hi! I am " + sp.name + "')" + "\\nsprite.move_right(50)\\n" });
        setActiveFile(fname);
        addLog('Added sprite: ' + sp.name, 'success');
        setSidePanel('files');
    };
    // Backdrop
    const handleSetBackdrop = (bd) => { setBackdropImg(bd.img || null); addLog('Backdrop: ' + bd.name, 'success'); setSidePanel('files'); };
    // CSV Upload
    const handleCSVUpload = () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv';
        inp.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const fname = file.name.replace('.csv', '') + '_reader.py';
                const snippet = "import csv\\n\\n# Auto-generated reader for: " + file.name + "\\nrows = []\\nfor row in '" + file.name + "'.split(','):\\n    rows.append(row)\\nprint('Loaded', len(rows), 'items')\\n";
                setProjectFiles(prev => ({ ...prev, [fname]: snippet }));
                setActiveFile(fname);
                addLog('CSV uploaded: ' + file.name, 'success');
            };
            reader.readAsText(file);
        };
        inp.click();
    };
    // Python Upload
    const handlePythonUpload = () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.py';
        inp.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { setProjectFiles(prev => ({ ...prev, [file.name]: ev.target.result })); setActiveFile(file.name); addLog('Imported: ' + file.name, 'success'); };
            reader.readAsText(file);
        };
        inp.click();
    };
    // Extension install
    const installExtension = (ext) => {
        if (installedExtensions.find(e => e.id === ext.id)) { addLog(ext.name + ' already installed', 'info'); return; }
        setInstalledExtensions(prev => [...prev, ext]);
        const snippet = "\\n" + ext.code + "\\n";
        setProjectFiles(prev => ({ ...prev, [activeFile]: (prev[activeFile] || '') + snippet }));
        addLog('Extension added: ' + ext.name, 'success');
    };
'''

marker2 = '    // ── Utility'
if marker2 in content:
    content = content.replace(marker2, handlers + marker2, 1)
    print("Patch 2 applied")
else:
    print("Patch 2 NOT FOUND - searching:")
    idx = content.find('Utility')
    print(repr(content[idx-5:idx+30]))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("DONE: All patches saved successfully")
