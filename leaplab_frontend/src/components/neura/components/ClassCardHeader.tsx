import React, { useState } from 'react'
import { Edit2, Trash2, Check, X } from 'lucide-react'

type ClassCardHeaderProps = {
    name: string
    color: { bg: string; light: string }
    onRename: (name: string) => void
    onDelete: () => void
}

export default function ClassCardHeader({ name, color, onRename, onDelete }: ClassCardHeaderProps) {
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState(name)

    const commitRename = () => {
        if (editName.trim()) {
            onRename(editName.trim())
        }
        setEditing(false)
    }

    const cancelEdit = () => {
        setEditName(name)
        setEditing(false)
    }

    return (
        <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${color.bg} 0%, ${color.light} 100%)` }}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {editing ? (
                    <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && commitRename()}
                        autoFocus
                        className="rounded-md font-sans text-sm font-semibold w-full outline-none"
                        style={{ background: 'rgba(0,0,0,0.25)', border: 'none', padding: '3px 8px', color: '#fff' }}
                    />
                ) : (
                    <span className="text-white font-sans font-bold text-sm truncate" style={{ letterSpacing: '-0.01em', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                        {name}
                    </span>
                )}
            </div>
            <div className="flex gap-1 ml-2">
                {editing ? (
                    <>
                        <button onClick={commitRename} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: 'rgba(255,255,255,0.25)', border: 'none', padding: '4px 6px', transition: 'background 0.15s' }}>
                            <Check size={13} />
                        </button>
                        <button onClick={cancelEdit} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 6px', transition: 'background 0.15s' }}>
                            <X size={14} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => { setEditName(name); setEditing(true) }} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '4px 6px', transition: 'background 0.15s' }}>
                            <Edit2 size={13} />
                        </button>
                        <button onClick={onDelete} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 6px', transition: 'background 0.15s' }}>
                            <Trash2 size={13} />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
