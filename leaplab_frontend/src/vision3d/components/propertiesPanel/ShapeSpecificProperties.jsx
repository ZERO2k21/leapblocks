import React from 'react';

export const ShapeSpecificProperties = ({ selectedShape, inputClass, labelClass, updateProp }) => {
  return (
    <>
      {selectedShape.type === 'box' && (
        <div>
          <label className={labelClass}>Dimensions</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">W</span>
              <input type="number" value={selectedShape.width ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('width', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.height ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('height', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">D</span>
              <input type="number" value={selectedShape.depth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('depth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap min-w-[90px]">Corner Radius</span>
              <input type="number" value={selectedShape.cornerRadius ?? 0} min={0} step={0.1}
                onChange={(e) => updateProp('cornerRadius', Math.max(0, parseFloat(e.target.value) || 0))}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {(selectedShape.type === 'cylinder' || selectedShape.type === 'cone') && (
        <div>
          <label className={labelClass}>{selectedShape.type === 'cylinder' ? 'Cylinder' : 'Cone'}</label>
          <div className="flex gap-2">
            {selectedShape.type === 'cylinder' && (
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">R Top</span>
                <input type="number" value={selectedShape.radiusTop ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('radiusTop', parseFloat(e.target.value) || 0.1)}
                  className={inputClass} />
              </div>
            )}
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">{selectedShape.type === 'cylinder' ? 'R Bot' : 'Radius'}</span>
              <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.radiusBottom ?? 1) : (selectedShape.coneRadius ?? 1)} min={0.1} step={0.1}
                onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'radiusBottom' : 'coneRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.cylinderHeight ?? 2) : (selectedShape.coneHeight ?? 2)} min={0.1} step={0.1}
                onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'cylinderHeight' : 'coneHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Segments</span>
              <input type="number" value={selectedShape.radialSegments ?? 32} min={3} max={128} step={1}
                onChange={(e) => updateProp('radialSegments', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
            {selectedShape.type === 'cylinder' && (
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Taper %</span>
                <input type="number" value={selectedShape.taper ?? 0} min={-90} max={90} step={1}
                  onChange={(e) => updateProp('taper', parseFloat(e.target.value) || 0)}
                  className={inputClass} />
              </div>
            )}
          </div>
        </div>
      )}

      {(selectedShape.type === 'sphere' || selectedShape.type === 'dodecahedron' || selectedShape.type === 'icosahedron' || selectedShape.type === 'octahedron' || selectedShape.type === 'tetrahedron') && (
        <div>
          <label className={labelClass}>{selectedShape.type.charAt(0).toUpperCase() + selectedShape.type.slice(1)}</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radius</span>
              <input type="number" value={selectedShape.radius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('radius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            {selectedShape.type === 'sphere' && (
              <>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">W Segs</span>
                  <input type="number" value={selectedShape.widthSegments ?? 32} min={3} max={128} step={1}
                    onChange={(e) => updateProp('widthSegments', parseInt(e.target.value) || 3)}
                    className={inputClass} />
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">H Segs</span>
                  <input type="number" value={selectedShape.heightSegments ?? 16} min={2} max={128} step={1}
                    onChange={(e) => updateProp('heightSegments', parseInt(e.target.value) || 2)}
                    className={inputClass} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedShape.type === 'torus' && (
        <div>
          <label className={labelClass}>Torus</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Major R</span>
              <input type="number" value={selectedShape.torusRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('torusRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Tube R</span>
              <input type="number" value={selectedShape.tubeRadius ?? 0.4} min={0.05} step={0.05}
                onChange={(e) => updateProp('tubeRadius', parseFloat(e.target.value) || 0.05)}
                className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radial Segs</span>
              <input type="number" value={selectedShape.torusRadialSegments ?? 16} min={3} max={64} step={1}
                onChange={(e) => updateProp('torusRadialSegments', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Tube Segs</span>
              <input type="number" value={selectedShape.torusTubularSegments ?? 32} min={3} max={128} step={1}
                onChange={(e) => updateProp('torusTubularSegments', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'roof' && (
        <div>
          <label className={labelClass}>Roof</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">W</span>
              <input type="number" value={selectedShape.roofWidth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('roofWidth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">D</span>
              <input type="number" value={selectedShape.roofDepth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('roofDepth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.roofHeight ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('roofHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'roundRoof' && (
        <div>
          <label className={labelClass}>Round Roof</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">W</span>
              <input type="number" value={selectedShape.roundRoofWidth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('roundRoofWidth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">D</span>
              <input type="number" value={selectedShape.roundRoofDepth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('roundRoofDepth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.roundRoofHeight ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('roundRoofHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'wedge' && (
        <div>
          <label className={labelClass}>Wedge</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">W</span>
              <input type="number" value={selectedShape.wedgeWidth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('wedgeWidth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">D</span>
              <input type="number" value={selectedShape.wedgeDepth ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('wedgeDepth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.wedgeHeight ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('wedgeHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'pyramid' && (
        <div>
          <label className={labelClass}>Pyramid</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radius</span>
              <input type="number" value={selectedShape.pyramidRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('pyramidRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.pyramidHeight ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('pyramidHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Sides</span>
              <input type="number" value={selectedShape.pyramidSides ?? 4} min={3} max={32} step={1}
                onChange={(e) => updateProp('pyramidSides', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'halfSphere' && (
        <div>
          <label className={labelClass}>Half Sphere</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radius</span>
              <input type="number" value={selectedShape.halfSphereRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('halfSphereRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Segs</span>
              <input type="number" value={selectedShape.halfSphereSegments ?? 32} min={4} max={64} step={1}
                onChange={(e) => updateProp('halfSphereSegments', parseInt(e.target.value) || 4)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'paraboloid' && (
        <div>
          <label className={labelClass}>Paraboloid</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radius</span>
              <input type="number" value={selectedShape.paraboloidRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('paraboloidRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.paraboloidHeight ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('paraboloidHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'tube' && (
        <div>
          <label className={labelClass}>Tube</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Outer R</span>
              <input type="number" value={selectedShape.tubeOuterRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('tubeOuterRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Inner R</span>
              <input type="number" value={selectedShape.tubeInnerRadius ?? 0.7} min={0.05} step={0.1}
                onChange={(e) => updateProp('tubeInnerRadius', parseFloat(e.target.value) || 0.05)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.tubeHeight ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('tubeHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'star' && (
        <div>
          <label className={labelClass}>Star</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Outer R</span>
              <input type="number" value={selectedShape.starOuterRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('starOuterRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Inner R</span>
              <input type="number" value={selectedShape.starInnerRadius ?? 0.5} min={0.05} step={0.1}
                onChange={(e) => updateProp('starInnerRadius', parseFloat(e.target.value) || 0.05)}
                className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Points</span>
              <input type="number" value={selectedShape.starPoints ?? 5} min={3} max={32} step={1}
                onChange={(e) => updateProp('starPoints', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Depth</span>
              <input type="number" value={selectedShape.starHeight ?? 0.5} min={0.1} step={0.1}
                onChange={(e) => updateProp('starHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'heart' && (
        <div>
          <label className={labelClass}>Heart</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Size</span>
              <input type="number" value={selectedShape.heartSize ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('heartSize', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Depth</span>
              <input type="number" value={selectedShape.heartDepth ?? 0.5} min={0.1} step={0.1}
                onChange={(e) => updateProp('heartDepth', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'polygon' && (
        <div>
          <label className={labelClass}>Polygon</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Radius</span>
              <input type="number" value={selectedShape.polygonRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('polygonRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Sides</span>
              <input type="number" value={selectedShape.polygonSides ?? 6} min={3} max={32} step={1}
                onChange={(e) => updateProp('polygonSides', parseInt(e.target.value) || 3)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">H</span>
              <input type="number" value={selectedShape.polygonHeight ?? 2} min={0.1} step={0.1}
                onChange={(e) => updateProp('polygonHeight', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'ring' && (
        <div>
          <label className={labelClass}>Ring</label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Inner R</span>
              <input type="number" value={selectedShape.innerRadius ?? 0.5} min={0.05} step={0.1}
                onChange={(e) => updateProp('innerRadius', parseFloat(e.target.value) || 0.05)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Outer R</span>
              <input type="number" value={selectedShape.outerRadius ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('outerRadius', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'text3d' && (
        <div>
          <label className={labelClass}>Text</label>
          <input type="text" value={selectedShape.text ?? 'Hello'}
            onChange={(e) => updateProp('text', e.target.value)}
            className={inputClass} />
          <div className="flex gap-2 mt-3">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Font Size</span>
              <input type="number" value={selectedShape.fontSize ?? 1} min={0.1} step={0.1}
                onChange={(e) => updateProp('fontSize', parseFloat(e.target.value) || 0.1)}
                className={inputClass} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider truncate">Depth</span>
              <input type="number" value={selectedShape.textDepth ?? 0.5} min={0.05} step={0.1}
                onChange={(e) => updateProp('textDepth', parseFloat(e.target.value) || 0.05)}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
