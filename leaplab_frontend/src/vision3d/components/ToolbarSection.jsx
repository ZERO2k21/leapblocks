import { use3DStore } from '../store/use3DStore';

export function ToolbarSection({ fileInputRef, openProjectInputRef, handleImport, handleOpenProjectFile, setNetOpen, setPreviewOpen }) {
  const activeTool = use3DStore((s) => s.activeTool);
  const setTool = use3DStore((s) => s.setTool);
  const editMode = use3DStore((s) => s.editMode);
  const setEditMode = use3DStore((s) => s.setEditMode);
  const editTool = use3DStore((s) => s.editTool);
  const setEditTool = use3DStore((s) => s.setEditTool);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const shapes = use3DStore((s) => s.shapes);
  const selectedVertices = use3DStore((s) => s.selectedVertices);
  const selectedEdges = use3DStore((s) => s.selectedEdges);
  const selectedFaces = use3DStore((s) => s.selectedFaces);
  const clearComponentSelection = use3DStore((s) => s.clearComponentSelection);
  const rulerActive = use3DStore((s) => s.rulerActive);
  const toggleRuler = use3DStore((s) => s.toggleRuler);
  const showGrid = use3DStore((s) => s.showGrid);
  const setShowGrid = use3DStore((s) => s.setShowGrid);
  const showAxes = use3DStore((s) => s.showAxes);
  const setShowAxes = use3DStore((s) => s.setShowAxes);
  const cameraMode = use3DStore((s) => s.cameraMode);
  const toggleCameraMode = use3DStore((s) => s.toggleCameraMode);
  const csgOperation = use3DStore((s) => s.csgOperation);
  const updateShapes = use3DStore((s) => s.updateShapes);
  const addShape = use3DStore((s) => s.addShape);
  const removeShapes = use3DStore((s) => s.removeShapes);
  const tempWorkplane = use3DStore((s) => s.tempWorkplane);

  return (
    <div className="flex items-center justify-between h-[72px] bg-white border-b border-slate-200 shadow-sm text-slate-600 shrink-0 gap-3 overflow-x-auto relative z-[100] w-full box-border vision3d-toolbar">
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0 px-4">
        <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px] bg-blue-500/[0.06] border border-blue-500/[0.15]">
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${activeTool === 'select' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
            onClick={() => setTool('select')}
            title="Select (V)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
            Select
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${activeTool === 'move' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
            onClick={() => setTool('move')}
            title="Move (G)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
            Move
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${activeTool === 'rotate' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
            onClick={() => setTool('rotate')}
            title="Rotate (R)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            Rotate
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${activeTool === 'scale' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
            onClick={() => setTool('scale')}
            title="Scale (S)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 3l-7 7M21 3v5M21 3h-5M3 21l7-7M3 21v-5M3 21h5"/></svg>
            Resize
          </button>
        </div>
        <span className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
        {/* Edit Mode Group (Blender-like) */}
        <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px] bg-teal-500/[0.06] border border-teal-500/[0.15]">
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'vertex' ? 'bg-teal-600 text-white shadow-[0_4px_12px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
            onClick={() => setEditMode(editMode === 'vertex' ? 'object' : 'vertex')}
            disabled={selectedIds.length !== 1}
            title="Vertex Edit (1)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
            Points
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'edge' ? 'bg-teal-600 text-white shadow-[0_4px_12px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
            onClick={() => setEditMode(editMode === 'edge' ? 'object' : 'edge')}
            disabled={selectedIds.length !== 1}
            title="Edge Edit (2)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5" strokeWidth="2.5"/></svg>
            Lines
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'face' ? 'bg-teal-600 text-white shadow-[0_4px_12px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
            onClick={() => setEditMode(editMode === 'face' ? 'object' : 'face')}
            disabled={selectedIds.length !== 1}
            title="Face Edit (3)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,3 3,21 21,21"/></svg>
            Sides
          </button>
        </div>
        {/* Edit Tools (shown when in edit mode) */}
        {editMode !== 'object' && (
          <>
            <span className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
            <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px] bg-amber-500/[0.06] border border-amber-500/[0.15]">
              <button
                className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${editTool === 'exclude' ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)]' : 'bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700'}`}
                onClick={() => setEditTool('exclude')}
                title="Move only selected (E)"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M5 12l7 7 7-7"/></svg>
                Move Selected
              </button>
              <button
                className={`flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${editTool === 'include' ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)]' : 'bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700'}`}
                onClick={() => setEditTool('include')}
                title="Move selected + connected (I)"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                Stretch Shape
              </button>
              {editMode === 'vertex' && (
                <button
                  className="flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                  onClick={() => setEditTool('merge')}
                  disabled={selectedVertices.length < 2}
                  title="Merge Vertices (M)"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="16" r="2"/><path d="M10 10l4 4"/></svg>
                  Join
                </button>
              )}
              <button
                className="flex items-center justify-center gap-2 !px-8 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700"
                onClick={() => clearComponentSelection()}
                title="Deselect Components (Escape)"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                Clear
              </button>
            </div>
          </>
        )}
        <span className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
        <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px]">
          <button
            className={`flex items-center justify-center gap-2 !px-8 shrink-0 rounded-lg border text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${rulerActive ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-slate-100/80 border-slate-200/80 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]'}`}
            onClick={toggleRuler}
            title="Ruler / Measurement Tool (X)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
            Ruler
          </button>
          <button
            className="flex flex-col items-center justify-center !px-6 shrink-0 border border-slate-200/80 rounded-lg bg-slate-50 cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] shadow-sm hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none leading-none py-1"
            onClick={() => fileInputRef.current?.click()}
            title="Import 3D model file (.STL, .OBJ, .GLTF, .GLB)"
          >
            <span className="text-[13px] font-semibold text-slate-600 leading-none">Import</span>
            <span className="text-[8px] font-medium tracking-wide text-slate-400 leading-none mt-[2px]">.STL / .OBJ / .GLTF / .GLB</span>
          </button>
          {(() => {
            const NET_SUPPORTED = ['cube','box','cylinder','cone','tetrahedron','pyramid','sphere','halfSphere'];
            const selShape = selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) : null;
            const hasNet = selShape && NET_SUPPORTED.includes(selShape.type);
            return (
              <button
                className="flex items-center justify-center gap-2 !px-8 shrink-0 border border-slate-200/80 rounded-lg bg-slate-50 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] shadow-sm hover:bg-slate-100 hover:text-slate-800 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                onClick={() => {
                  if (hasNet) setNetOpen(true);
                }}
                disabled={!hasNet}
                title={hasNet ? "Show how this shape is constructed from its net" : "Net animation not available for this shape"}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                Animate
              </button>
            );
          })()}

        </div>
        <span className="w-px h-6 bg-slate-200 mx-2 shrink-0" />
        <div className="text-[12px] font-extrabold uppercase tracking-[1.2px] text-slate-400 mx-2.5 select-none">Combine</div>
        <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px] bg-purple-500/[0.06] border border-purple-500/[0.15]">
          <button
            className="flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={() => csgOperation('union')}
            disabled={selectedIds.length < 2}
            title="Glue shapes together (Ctrl+1)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6"/><circle cx="14" cy="14" r="6"/></svg>
            Glue
          </button>
          <button
            className="flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={() => csgOperation('subtract')}
            disabled={selectedIds.length < 2}
            title="Cut one shape from another (Ctrl+2)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7"/><rect x="8" y="8" width="8" height="8"/></svg>
            Cut
          </button>
          <button
            className="flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={() => csgOperation('intersect')}
            disabled={selectedIds.length < 2}
            title="Keep only the overlapping part (Ctrl+3)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="7"/><circle cx="14" cy="14" r="7"/><path d="M6 12a6 6 0 0 1 6-6"/></svg>
            Overlap
          </button>
        </div>
        <span className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
        <button
          className={`flex items-center justify-center gap-2 !px-7 shrink-0 rounded-lg border text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${(() => {
            if (selectedIds.length === 0) return '';
            const sel = shapes.filter((s) => selectedIds.includes(s.id));
            const anyHole = sel.some((s) => s.isHole);
            return anyHole ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : '';
          })() || 'bg-slate-100/80 border-slate-200/80 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]'}`}
          onClick={() => {
            if (selectedIds.length === 0) return;
            const sel = shapes.filter((s) => selectedIds.includes(s.id));
            const anyHole = sel.some((s) => s.isHole);
            updateShapes(selectedIds, { isHole: !anyHole });
          }}
          disabled={selectedIds.length === 0}
          title="Toggle Solid/Hollow (H)"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="5" fill="currentColor" opacity={selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 0 : 0.3}/>
          </svg>
          {selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 'Make Solid' : 'Make Hole'}
        </button>
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <div 
          className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 select-none transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 cursor-default px-3 h-9 inline-flex items-center gap-2 rounded-lg box-border" 
          title="Objects in scene"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>{shapes.length}</span>
        </div>
        <div 
          className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 select-none transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 cursor-default px-3 h-9 inline-flex items-center gap-2 rounded-lg box-border" 
          title="Selected shapes"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          <span>{selectedIds.length}</span>
        </div>
        {tempWorkplane && (
          <div 
            className="text-xs font-semibold bg-slate-50 border border-slate-200/80 select-none transition-all duration-150 hover:bg-slate-100 cursor-default px-3 h-9 inline-flex items-center gap-2 rounded-lg box-border text-orange-500" 
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
            <span>Workplane</span>
          </div>
        )}
        {rulerActive && (
          <div 
            className="text-xs font-semibold bg-slate-50 border border-slate-200/80 select-none transition-all duration-150 hover:bg-slate-100 cursor-default px-3 h-9 inline-flex items-center gap-2 rounded-lg box-border text-red-500" 
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
            <span>Ruler</span>
          </div>
        )}
        {editMode !== 'object' && (
          <div 
            className="text-xs font-semibold bg-slate-50 border border-slate-200/80 select-none transition-all duration-150 hover:bg-slate-100 cursor-default px-3 h-9 inline-flex items-center gap-2 rounded-lg box-border text-purple-500" 
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
            <span>{editMode === 'vertex' ? `Vertex (${selectedVertices.length})` : editMode === 'edge' ? `Edge (${selectedEdges.length})` : `Face (${selectedFaces.length})`}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <div className="flex items-center gap-1 rounded-xl p-[3px] shadow-sm transition-all duration-200 box-border h-[48px] bg-slate-500/[0.06] border border-slate-500/[0.15]">
          <button
            className={`flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${showGrid ? 'bg-slate-600 text-white shadow-[0_4px_12px_rgba(71,85,105,0.25)]' : 'bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700'}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg>
            Grid
          </button>
          <button
            className={`flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] ${showAxes ? 'bg-slate-600 text-white shadow-[0_4px_12px_rgba(71,85,105,0.25)]' : 'bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700'}`}
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle Axes"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
            Axes
          </button>
          <button
            className="flex items-center justify-center gap-2 !px-7 shrink-0 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700"
            onClick={toggleCameraMode}
            title="Toggle Perspective/Orthographic (P)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v16h22V4z"/><circle cx="12" cy="12" r="3"/></svg>
            {cameraMode === 'perspective' ? 'Persp' : 'Ortho'}
          </button>
          <span className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
          <button
            className="flex items-center justify-center gap-2 !px-7 shrink-0 border border-slate-200/80 rounded-lg bg-slate-50 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-150 whitespace-nowrap select-none h-[40px] shadow-sm hover:bg-slate-100 hover:text-slate-800"
            onClick={() => setPreviewOpen(true)}
            title="Preview (fullscreen auto-rotate)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.obj,.gltf,.glb"
          onChange={handleImport}
          className="hidden"
        />
        <input
          ref={openProjectInputRef}
          type="file"
          accept=".json,.leap"
          onChange={handleOpenProjectFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
