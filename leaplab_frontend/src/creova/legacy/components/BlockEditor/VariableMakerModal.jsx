import React, { useState, useEffect } from 'react';

const SCOPE_OPTIONS = [
  { value: 'global', label: 'All sprites', desc: 'This variable can be used by any sprite' },
  { value: 'local', label: 'This sprite only', desc: 'Only this sprite can access this variable' },
];

const VariableMakerModal = ({ type = 'variable', onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('global');
  const [columns, setColumns] = useState(['Column 1']);
  const [error, setError] = useState('');

  const addColumn = () => setColumns([...columns, `Column ${columns.length + 1}`]);

  const isValidName = (name) => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(`Please enter a ${type} name.`);
      return;
    }

    if (!isValidName(trimmedName)) {
      setError('Name must start with a letter and contain only letters, numbers, and underscores.');
      return;
    }

    if (type === 'table') {
      onCreate(trimmedName, columns, scope);
    } else {
      onCreate(trimmedName, scope);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fade-in-legacy" onClick={handleBackdropClick}>
      <div className="bg-white/85 backdrop-blur-[20px] saturate-[180%] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/50 min-w-[400px] max-w-[90vw] animate-slide-up-legacy variable-modal">
        <div className="flex justify-between items-center px-6 py-5 border-b border-black/10">
          <h2 className="m-0 text-[18px] font-semibold text-[#333]">Make a {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          <button className="bg-none border-none text-[28px] text-[#666] cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-[200ms] hover:bg-black/10 hover:text-[#333]" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-5 last:mb-0">
              <label htmlFor="dataName" className="block mb-2 font-semibold text-[#444] text-[14px]">{type.charAt(0).toUpperCase() + type.slice(1)} name:</label>
              <input
                id="dataName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${type} name...`}
                autoFocus
                maxLength={50}
                className="w-full px-4 py-3 border-2 border-black/10 rounded-[10px] text-[16px] bg-white/70 backdrop-blur-[10px] transition-all duration-[200ms] box-border outline-none focus:border-[#FF9F43] focus:shadow-[0_0_0_3px_rgba(255,159,67,0.2)] placeholder:text-[#aaa]"
              />
              {error && <div className="mt-2 p-2.5 bg-[rgba(255,82,82,0.1)] border border-[rgba(255,82,82,0.3)] rounded-lg text-[#e74c3c] text-[13px]">{error}</div>}
            </div>

            {type === 'table' && (
              <div className="mb-5 last:mb-0">
                <label className="block mb-2 font-semibold text-[#444] text-[14px]">Columns:</label>
                <div className="flex flex-col gap-2 mt-2">
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => {
                          const newCols = [...columns];
                          newCols[idx] = e.target.value;
                          setColumns(newCols);
                        }}
                        className="flex-1 w-full px-4 py-3 border-2 border-black/10 rounded-[10px] text-[16px] bg-white/70 backdrop-blur-[10px] transition-all duration-[200ms] box-border outline-none focus:border-[#FF9F43]"
                      />
                    </div>
                  ))}
                  <button type="button" className="self-start px-3 py-1.5 bg-[rgba(0,166,147,0.1)] border border-dashed border-[#00A693] text-[#00A693] rounded-md cursor-pointer text-[13px] mt-1 hover:bg-[rgba(0,166,147,0.2)]" onClick={addColumn}>
                    + Add Column
                  </button>
                </div>
              </div>
            )}

            <div className="mb-5 last:mb-0">
              <label className="block mb-2 font-semibold text-[#444] text-[14px]">For:</label>
              <div className="flex flex-col gap-3">
                {SCOPE_OPTIONS.map((opt) => {
                  const selected = scope === opt.value;
                  return (
                    <label key={opt.value} className={`flex items-start px-4 py-4 bg-white/50 border-2 rounded-xl cursor-pointer transition-all duration-[200ms] hover:border-black/20 hover:bg-white/70 ${selected ? 'border-[#FF9F43]' : 'border-black/10'}`}>
                      <input
                        type="radio"
                        name="scope"
                        value={opt.value}
                        checked={selected}
                        onChange={(e) => setScope(e.target.value)}
                        className="hidden"
                      />
                      <span className={`w-5 h-5 border-2 rounded-full mr-3 mt-0.5 shrink-0 transition-all duration-[200ms] relative flex items-center justify-center ${selected ? 'bg-[#FF9F43] border-[#FF9F43] after:content-[""] after:w-2.5 after:h-2.5 after:bg-white after:rounded-full after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2' : 'border-[#ccc]'}`}></span>
                      <span className="flex flex-col gap-0.5">
                        <strong className="text-[#333] text-[14px]">{opt.label}</strong>
                        <small className="text-[#666] text-[12px]">{opt.desc}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-black/10">
            <button type="button" className="px-6 py-2.5 rounded-lg text-[14px] font-semibold cursor-pointer border-none transition-all duration-[200ms] bg-black/5 text-[#666] border border-black/10 hover:bg-black/10" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-lg text-[14px] font-semibold cursor-pointer border-none transition-all duration-[200ms] bg-gradient-to-r from-[#FF9F43] to-[#FF6B6B] text-white shadow-[0_4px_12px_rgba(255,159,67,0.3)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(255,159,67,0.4)] active:translate-y-0">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariableMakerModal;
