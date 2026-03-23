import React from 'react';

export default function PhoneCanvas({ appState }) {
  const { screens, activeScreen, selectedId, addComponent, setSelectedId } = appState;

  const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
  const components = currentScreen?.components || [];

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType');
    if (!type) return;
    addComponent(type, 0, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const renderComponentPreview = (comp) => {
    const isSelected = comp.id === selectedId;
    const baseClasses = `cursor-pointer transition-all ${isSelected ? 'ring-2 ring-dashed ring-[#6c63ff] z-10' : 'hover:ring-1 hover:ring-gray-300'} mb-2`;

    // Dynamic styles from props
    const style = {
      backgroundColor: comp.props.backgroundColor !== '#ffffff' ? comp.props.backgroundColor : undefined,
      color: comp.props.textColor,
      fontSize: comp.props.fontSize ? `${comp.props.fontSize}px` : undefined,
      fontWeight: comp.props.bold ? 'bold' : 'normal',
      width: comp.props.width === 'fill_parent' ? '100%' : (typeof comp.props.width === 'number' ? `${comp.props.width}px` : 'auto'),
      height: comp.props.height === 'automatic' ? 'auto' : (typeof comp.props.height === 'number' ? `${comp.props.height}px` : 'auto'),
    };

    const handleClick = (e) => {
      e.stopPropagation();
      setSelectedId(comp.id);
    };

    switch (comp.type) {
      case 'Button':
        return (
          <div key={comp.id} className={`${baseClasses} p-2 rounded`} style={{ ...style, backgroundColor: style.backgroundColor || '#6c63ff', color: style.color || '#fff', textAlign: 'center' }} onClick={handleClick}>
            {comp.props.text}
          </div>
        );
      case 'Label':
        return (
          <div key={comp.id} className={baseClasses} style={style} onClick={handleClick}>
            {comp.props.text}
          </div>
        );
      case 'TextBox':
        return (
          <div key={comp.id} className={`${baseClasses} p-2 border border-gray-300 rounded bg-white text-gray-400`} style={{ ...style, backgroundColor: '#fff', color: '#9ca3af' }} onClick={handleClick}>
            {comp.props.hint}
          </div>
        );
      case 'Image':
        return (
          <div key={comp.id} className={`${baseClasses} bg-gray-200 flex items-center justify-center`} style={{ ...style, width: comp.props.width || 100, height: comp.props.height || 100 }} onClick={handleClick}>
            <span className="text-3xl">📷</span>
          </div>
        );
      case 'CheckBox':
        return (
          <div key={comp.id} className={`${baseClasses} flex items-center space-x-2`} style={style} onClick={handleClick}>
            <input type="checkbox" checked={comp.props.checked} readOnly />
            <span>{comp.props.text}</span>
          </div>
        );
      case 'Slider':
        return (
          <div key={comp.id} className={`${baseClasses} w-full h-4 bg-gray-300 rounded-full relative`} style={style} onClick={handleClick}>
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#6c63ff] rounded-full shadow" style={{ left: '50%' }}></div>
          </div>
        );
      default:
        return (
          <div key={comp.id} className={`${baseClasses} p-2 bg-gray-100 border border-gray-300 rounded text-center text-sm text-gray-500`} style={style} onClick={handleClick}>
            {comp.type}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#f5f6fa] flex items-center justify-center overflow-auto p-8" onClick={() => setSelectedId(null)}>
      {/* Phone Frame */}
      <div
        className="w-[320px] h-[568px] bg-white rounded-[36px] overflow-hidden shadow-xl border-[8px] border-[#222] relative flex flex-col shrink-0"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Status bar */}
        <div className="h-8 bg-[#6c63ff] text-white text-xs flex items-center justify-center font-semibold z-20 shadow-sm shrink-0">
          {activeScreen}
        </div>

        {/* Drop Zone / Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 relative bg-white">
          {components.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 m-4 rounded-xl text-gray-400">
              Drag components from the palette
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-full">
              {components.map(comp => renderComponentPreview(comp))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
