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
      <div className="modal-content custom-block-modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Make a Block</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="block-preview-area" style={{ 
              background: '#f0f0f0', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minHeight: '60px'
            }}>
              <div style={{ 
                background: '#FF6680', 
                color: 'white', 
                padding: '8px 15px', 
                borderRadius: '4px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {blockName || 'my block'}
                {inputs.map((input, idx) => (
                  <span key={idx} style={{ 
                    background: input.type === 'boolean' ? '#4C97FF' : 'white',
                    color: input.type === 'boolean' ? 'white' : 'black',
                    padding: '2px 8px',
                    borderRadius: input.type === 'boolean' ? '12px' : '4px',
                    fontSize: '0.9em'
                  }}>
                    {input.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Block name:</label>
              <input 
                type="text" 
                value={blockName} 
                onChange={(e) => setBlockName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="add-inputs-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => handleAddInput('number')}>
                + Add an input (number or text)
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleAddInput('boolean')}>
                + Add an input (boolean)
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleAddInput('label')}>
                + Add a label
              </button>
            </div>

            <div className="inputs-list" style={{ marginTop: '15px' }}>
              {inputs.map((input, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span>{input.type === 'label' ? 'Label:' : 'Arg name:'}</span>
                  <input 
                    type="text" 
                    value={input.name} 
                    onChange={(e) => {
                      const newInputs = [...inputs];
                      newInputs[idx].name = e.target.value;
                      setInputs(newInputs);
                    }}
                  />
                  <button type="button" onClick={() => setInputs(inputs.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              ))}
            </div>

            <div className="form-group checkbox-group" style={{ marginTop: '20px' }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={noRefresh} 
                  onChange={(e) => setNoRefresh(e.target.checked)} 
                />
                Run without screen refresh
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">OK</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomBlockModal;
