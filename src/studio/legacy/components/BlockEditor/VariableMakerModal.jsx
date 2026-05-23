// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VariableMakerModal - Modal for creating variables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useEffect } from 'react';
import './VariableMakerModal.css';

const VariableMakerModal = ({ type = 'variable', onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('global');
  const [columns, setColumns] = useState(['Column 1']);
  const [error, setError] = useState('');

  // Validation
  const isValidName = (name) => {
    // No empty, no duplicates (checked at submit), valid identifier
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Trim whitespace
    const trimmedName = name.trim();

    // Validate
    if (!trimmedName) {
      setError(`Please enter a ${type} name.`);
      return;
    }

    if (!isValidName(trimmedName)) {
      setError('Name must start with a letter and contain only letters, numbers, and underscores.');
      return;
    }

    // Call create
    if (type === 'table') {
      onCreate(trimmedName, columns, scope);
    } else {
      onCreate(trimmedName, scope);
    }
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key
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
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content variable-modal">
        <div className="modal-header">
          <h2>Make a {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="dataName">{type.charAt(0).toUpperCase() + type.slice(1)} name:</label>
              <input
                id="dataName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${type} name...`}
                autoFocus
                maxLength={50}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            {type === 'table' && (
              <div className="form-group">
                <label>Columns:</label>
                <div className="columns-list">
                  {columns.map((col, idx) => (
                    <div key={idx} className="column-item">
                      <input 
                        type="text" 
                        value={col} 
                        onChange={(e) => {
                          const newCols = [...columns];
                          newCols[idx] = e.target.value;
                          setColumns(newCols);
                        }}
                      />
                    </div>
                  ))}
                  <button type="button" className="add-col-btn" onClick={addColumn}>
                    + Add Column
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>For:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="scope"
                    value="global"
                    checked={scope === 'global'}
                    onChange={(e) => setScope(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-text">
                    <strong>All sprites</strong>
                    <small>This variable can be used by any sprite</small>
                  </span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="scope"
                    value="local"
                    checked={scope === 'local'}
                    onChange={(e) => setScope(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-text">
                    <strong>This sprite only</strong>
                    <small>Only this sprite can access this variable</small>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariableMakerModal;
