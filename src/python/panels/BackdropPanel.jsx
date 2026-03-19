import React from "react";
import { Plus } from "lucide-react";

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

export default function BackdropPanel({ BACKDROP_LIBRARY, backdrop, handleSetBackdrop, onBrowseBackdrops }) {
    return (
        <>
            <div style={{padding:"10px 12px 6px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>BACKDROPS</span>
                <button
                    onClick={onBrowseBackdrops}
                    title="Browse Backdrops"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.PURPLE,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 4px",
                    }}
                >
                    <Plus size={12} /> Add
                </button>
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
    );
}
