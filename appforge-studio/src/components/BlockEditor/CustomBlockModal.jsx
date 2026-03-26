import React, { useState, useEffect } from 'react';
import './VariableMakerModal.css'; // Reuse styles or add new ones

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
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content custom-block-modal" style={{ width: '560px', borderRadius: '12px' }}>
        <div className="modal-header" style={{ background: '#FF6680', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '12px 20px' }}>
          <h2 style={{ color: 'white', fontSize: '1.2rem' }}>Make a Block</h2>
          <button className="modal-close" onClick={onClose} style={{ color: 'white' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px' }}>
            {/* Block Preview */}
            <div className="block-preview-area" style={{ 
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

            {/* Input Generators */}
            <div className="add-inputs-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <button type="button" className="input-type-btn" onClick={() => handleAddInput('number')} style={btnStyle}>
                <div style={{...iconStyle, borderRadius: '4px'}}>123</div>
                <span style={labelStyle}>Add an input<br/>number or text</span>
              </button>
              <button type="button" className="input-type-btn" onClick={() => handleAddInput('boolean')} style={btnStyle}>
                <div style={{...iconStyle, borderRadius: '20px'}}></div>
                <span style={labelStyle}>Add an input<br/>boolean</span>
              </button>
              <button type="button" className="input-type-btn" onClick={() => handleAddInput('label')} style={btnStyle}>
                <div style={{...iconStyle, background: 'transparent', border: 'none', color: '#575E75', fontWeight: 'bold'}}>label</div>
                <span style={labelStyle}>Add a label</span>
              </button>
            </div>

            {/* Input List / Name Editor */}
            <div className="inputs-list" style={{ maxHeight: '180px', overflowY: 'auto', background: '#fff', borderRadius: '8px', padding: '10px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Block name:</label>
                <input 
                  type="text" 
                  value={blockName} 
                  onChange={(e) => setBlockName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  autoFocus
                />
              </div>

              {inputs.map((input, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px', background: '#f9f9f9', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666', minWidth: '70px' }}>{input.type === 'label' ? 'Label:' : 'Input:'}</span>
                  <input 
                    type="text" 
                    value={input.name} 
                    onChange={(e) => {
                      const newInputs = [...inputs];
                      newInputs[idx].name = e.target.value;
                      setInputs(newInputs);
                    }}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <button type="button" onClick={() => setInputs(inputs.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                </div>
              ))}
            </div>

            <div className="form-group checkbox-group" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="no-refresh"
                checked={noRefresh} 
                onChange={(e) => setNoRefresh(e.target.checked)} 
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="no-refresh" style={{ fontWeight: 'normal', color: '#575E75' }}>Run without screen refresh</label>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0 24px 24px', border: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#FF6680', border: 'none' }}>OK</button>
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
