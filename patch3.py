filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# --- Patch A: Expand activity bar icons ---
old_bar = '''                    {[
                        { id: "files", icon: <Folder size={20} />, tip: "Files" },
                        { id: "search", icon: <Search size={20} />, tip: "Search" },
                        { id: "debug", icon: <Bug size={20} />, tip: "Debug" },
                        { id: "packages", icon: <Package size={20} />, tip: "Packages" },
                    ].map(({ id, icon, tip }) => ('''

new_bar = '''                    {[
                        { id: "files",      icon: <Folder size={20} />,  tip: "Project Files" },
                        { id: "sprites",    icon: <span style={{fontSize:16}}>🧸</span>,  tip: "Add Sprite from Library" },
                        { id: "backdrops",  icon: <span style={{fontSize:16}}>🖼</span>,  tip: "Choose Backdrop" },
                        { id: "extensions", icon: <span style={{fontSize:16}}>🧩</span>,  tip: "Add Extension" },
                        { id: "search",     icon: <Search size={20} />,  tip: "Search" },
                        { id: "debug",      icon: <Bug size={20} />,     tip: "Debugger" },
                        { id: "packages",   icon: <Package size={20} />, tip: "PIP Packages" },
                    ].map(({ id, icon, tip }) => ('''

# Try LF then CRLF
if old_bar in content:
    content = content.replace(old_bar, new_bar, 1)
    print("Patch A applied (LF)")
else:
    old_bar_crlf = old_bar.replace('\n', '\r\n')
    if old_bar_crlf in content:
        content = content.replace(old_bar_crlf, new_bar, 1)
        print("Patch A applied (CRLF)")
    else:
        print("Patch A NOT FOUND - context:")
        idx = content.find('{ id: "files"')
        print(repr(content[idx:idx+200]))

# --- Patch B: Add bottom activity bar icons (CSV, Python upload) after packages ---
# Find the bottom of the activity bar (after the map) and add upload icons below
old_bottom_bar = '                </div>\n\n                {/* ── LEFT SIDEBAR'
new_bottom_bar = '''                    <div style={{flex:1}} />
                    {/* Upload CSV */}
                    <div onClick={handleCSVUpload} title="Upload CSV file"
                        style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:2}}>
                        <span style={{fontSize:16}}>📊</span>
                    </div>
                    {/* Upload Python */}
                    <div onClick={handlePythonUpload} title="Upload Python file (.py)"
                        style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:8}}>
                        <span style={{fontSize:16}}>🐍</span>
                    </div>
                </div>

                {/* ── LEFT SIDEBAR'''

if old_bottom_bar in content:
    content = content.replace(old_bottom_bar, new_bottom_bar, 1)
    print("Patch B applied (LF)")
else:
    old_bottom_bar_crlf = old_bottom_bar.replace('\n', '\r\n')
    if old_bottom_bar_crlf in content:
        content = content.replace(old_bottom_bar_crlf, new_bottom_bar, 1)
        print("Patch B applied (CRLF)")
    else:
        print("Patch B NOT FOUND, context:")
        idx = content.find('LEFT SIDEBAR')
        print(repr(content[idx-100:idx+30]))

# --- Patch C: Add sprite / backdrop / extension panels (insert before packages panel) ---
old_panels_start = '{sidePanel === "packages" && ('
new_panels = '''
                    {sidePanel === "sprites" && (
                        <>
                        <div style={{padding:"10px 12px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>SPRITE LIBRARY</span>
                        </div>
                        <input value={spriteFilter} onChange={e=>setSpriteFilter(e.target.value)}
                            placeholder="Search sprites..."
                            style={{margin:"0 8px 8px",padding:"5px 8px",fontSize:12,border:`1px solid ${C.BORDER}`,borderRadius:6,outline:"none",width:"calc(100% - 16px)"}} />
                        <div style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"0 8px 8px"}}>
                            {SPRITE_LIBRARY.filter(s=>s.name.toLowerCase().includes(spriteFilter.toLowerCase())).map(sp=>(
                                <div key={sp.name} onClick={()=>addSpriteFromLibrary(sp)}
                                    style={{background:"#F5F0FF",border:"2px solid transparent",borderRadius:10,padding:8,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
                                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.PURPLE;e.currentTarget.style.background=C.LIGHT_PURPLE;}}
                                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.background="#F5F0FF";}}>
                                    <img src={sp.img} alt={sp.name} style={{width:44,height:44,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}} />
                                    <div style={{fontSize:10,fontWeight:600,color:C.TEXT,marginTop:4}}>{sp.name}</div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {sidePanel === "backdrops" && (
                        <>
                        <div style={{padding:"10px 12px 6px"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>BACKDROPS</span>
                        </div>
                        <div style={{flex:1,overflowY:"auto",padding:"0 8px 8px"}}>
                            {BACKDROP_LIBRARY.map(bd=>(
                                <div key={bd.name} onClick={()=>handleSetBackdrop(bd)}
                                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:8,cursor:"pointer",marginBottom:4,background:backdrop===bd.img?"#EDE7F6":"transparent",border:backdrop===bd.img?`1px solid ${C.PURPLE}`:"1px solid transparent",transition:"all 0.2s"}}
                                    onMouseEnter={e=>e.currentTarget.style.background="#F5F0FF"}
                                    onMouseLeave={e=>e.currentTarget.style.background=backdrop===bd.img?"#EDE7F6":"transparent"}>
                                    <div style={{width:36,height:24,borderRadius:4,overflow:"hidden",flexShrink:0,background:bd.img?"#ddd":"#fff",border:"1px solid #ddd"}}>
                                        {bd.img && <img src={bd.img} alt={bd.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />}
                                        {!bd.img && <div style={{width:"100%",height:"100%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#999"}}>Blank</div>}
                                    </div>
                                    <span style={{fontSize:12,color:C.TEXT}}>{bd.name}</span>
                                    {backdrop===bd.img && <span style={{marginLeft:"auto",fontSize:10,color:C.PURPLE}}>✓</span>}
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {sidePanel === "extensions" && (
                        <>
                        <div style={{padding:"10px 12px 6px"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>EXTENSIONS</span>
                        </div>
                        <div style={{flex:1,overflowY:"auto",padding:"0 8px 8px"}}>
                            {EXTENSIONS.map(ext=>{
                                const isIn = !!installedExtensions.find(e=>e.id===ext.id);
                                return (
                                <div key={ext.id} style={{background:"#F9F6FF",border:`1px solid ${isIn?C.PURPLE:C.BORDER}`,borderRadius:8,padding:"8px 10px",marginBottom:6,cursor:"pointer"}} onClick={()=>installExtension(ext)}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                        <span style={{fontSize:18}}>{ext.icon}</span>
                                        <span style={{fontSize:12,fontWeight:700,color:C.TEXT}}>{ext.name}</span>
                                        {isIn && <span style={{marginLeft:"auto",fontSize:10,color:C.GREEN,fontWeight:700}}>✓ Added</span>}
                                    </div>
                                    <div style={{fontSize:11,color:C.MUTED,lineHeight:1.4}}>{ext.desc}</div>
                                    {!isIn && <div style={{marginTop:6,fontSize:10,color:C.PURPLE,fontWeight:700}}>+ Click to Add</div>}
                                </div>);
                            })}
                        </div>
                        </>
                    )}

                    {sidePanel === "packages" && ('''

if old_panels_start in content:
    content = content.replace(old_panels_start, new_panels, 1)
    print("Patch C applied")
else:
    print("Patch C NOT FOUND")
    idx = content.find('packages')
    print(repr(content[idx-20:idx+40]))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("All sidebar UI patches DONE")
