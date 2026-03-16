import React from "react";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

export default function ExtensionsPanel({ EXTENSIONS, installedExtensions, installExtension }) {
    return (
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
    );
}
