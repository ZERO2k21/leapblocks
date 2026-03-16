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

export default function SpritePanel({ spriteFilter, setSpriteFilter, addSpriteFromLibrary, SPRITE_LIBRARY }) {
    return (
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
    );
}
