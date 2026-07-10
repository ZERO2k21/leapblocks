import React, { useState, useEffect } from 'react';

const CustomBlockModal = ({ onClose, onCreate }) => {
  const [blockName, setBlockName] = useState('my block');
  const [inputs, setInputs] = useState([]); // { type: 'number', name: 'arg' }
  const [noRefresh, setNoRefresh] = useState(false);

  const handleAddInput = (type) => {
    const name = type === 'label' ? 'text' : `arg${inputs.length + 1}`;
    setInputs([...inputs, { type, name }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!blockName.trim()) return;
    onCreate({
      name: blockName.trim(),
      inputs,
      noRefresh
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fade-in-legacy" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white/85 backdrop-blur-[20px] saturate-[180%] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/50 max-w-[90vw] animate-slide-up-legacy" style={{ width: '560px', borderRadius: '12px' }}>
        <div className="flex justify-between items-center" style={{ background: '#FF6680', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '12px 20px' }}>
          <h2 style={{ color: 'white', fontSize: '1.2rem' }}>Make a Block</h2>
          <button className="bg-none border-none cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-[200ms] hover:bg-black/10" onClick={onClose} style={{ color: 'white', fontSize: '28px' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            <div style={{ 
              background: '#f8f8f8', 
              padding: '24px', 
              borderRadius: '12px',
              border: '2px solid #eee',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
              minHeight: '80px',
              justifyContent: 'center'
            }}>
              <div style={{ 
                background: '#FF6680', 
                color: 'white', 
                padding: '12px 24px', 
                borderRadius: '8px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '1.1rem',
                boxShadow: '0 4px 0 #cc5166'
              }}>
                <span style={{ whiteSpace: 'nowrap' }}>{blockName || 'my block'}</span>
                {inputs.map((input, idx) => (
                  <span key={idx} style={{ 
                    background: input.type === 'boolean' ? '#4C97FF' : 'white',
                    color: input.type === 'boolean' ? 'white' : '#575E75',
                    padding: '4px 12px',
                    borderRadius: input.type === 'boolean' ? '20px' : '6px',
                    fontSize: '0.95em',
                    border: '1px solid rgba(0,0,0,0.1)',
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {input.type === 'label' ? input.name : input.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button type="button" onClick={() => handleAddInput('number')} style={btnStyle}>
                <div style={{...iconStyle, borderRadius: '4px'}}>123</div>
                <span style={labelStyle}>Add an input<br/>number or text</span>
              </button>
              <button type="button" onClick={() => handleAddInput('boolean')} style={btnStyle}>
                <div style={{...iconStyle, borderRadius: '20px'}}></div>
                <span style={labelStyle}>Add an input<br/>boolean</span>
              </button>
              <button type="button" onClick={() => handleAddInput('label')} style={btnStyle}>
                <div style={{...iconStyle, background: 'transparent', border: 'none', color: '#575E75', fontWeight: 'bold'}}>label</div>
                <span style={labelStyle}>Add a label</span>
              </button>
            </div>

            <div className="max-h-[180px] overflow-y-auto bg-white rounded-lg p-2.5">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.9rem', marginBottom: '6px', display: 'block' }}>Block name:</label>
                <input 
                  type="text" 
                  value={blockName} 
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-[#ddd] outline-none"
                  autoFocus
                />
              </div>

              {inputs.map((input, idx) => (
                <div key={idx} className="flex items-center gap-3 mb-3 p-2 bg-[#f9f9f9] rounded-lg">
                  <span style={{ fontSize: '0.85rem', color: '#666', minWidth: '70px' }}>{input.type === 'label' ? 'Label:' : 'Input:'}</span>
                  <input 
                    type="text" 
                    value={input.name} 
                    onChange={(e) => {
                      const newInputs = [...inputs];
                      newInputs[idx].name = e.target.value;
                      setInputs(newInputs);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded border border-[#ddd] outline-none"
                  />
                  <button type="button" onClick={() => setInputs(inputs.filter((_, i) => i !== idx))} className="border-none bg-none text-[#999] cursor-pointer text-[1.2rem]">×</button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <input 
                type="checkbox" 
                id="no-refresh"
                checked={noRefresh} 
                onChange={(e) => setNoRefresh(e.target.checked)} 
                className="w-5 h-5"
              />
              <label htmlFor="no-refresh" style={{ fontWeight: 'normal', color: '#575E75' }}>Run without screen refresh</label>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px', border: 'none', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="flex-1 px-6 py-2.5 rounded-lg text-[14px] font-semibold cursor-pointer border transition-all duration-[200ms] bg-black/5 text-[#666] border-black/10 hover:bg-black/10">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-2.5 rounded-lg text-[14px] font-semibold cursor-pointer border-none text-white" style={{ background: '#FF6680' }}>OK</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const btnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px',
  background: 'white',
  border: '1px solid #ddd',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  gap: '8px'
};

const iconStyle = {
  width: '40px',
  height: '24px',
  background: 'white',
  border: '1px solid #ccc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  color: '#575E75'
};

const labelStyle = {
  fontSize: '0.75rem',
  color: '#575E75',
  textAlign: 'center',
  lineHeight: '1.2'
};

export default CustomBlockModal;
