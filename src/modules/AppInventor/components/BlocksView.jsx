/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

export default function BlocksView({ appState }) {
  const { screens } = appState;

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center mb-8">
          <div className="text-4xl mb-4">🧩</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Blockly Logic Editor</h2>
          <p className="text-gray-600">
            Your existing Blockly editor connects here.<br/>
            Pass <code className="bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700 font-mono text-sm mx-1">blocklyXml</code> prop to link block logic to components.
          </p>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Component Event Reference</h3>
        <p className="text-sm text-gray-600 mb-6">
          Use the following IDs in your Blockly event handlers (e.g., when building custom blocks for clicks or value changes).
        </p>

        {screens.map(screen => (
          <div key={screen.id} className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mr-2">Screen</span>
              {screen.id}
            </h4>
            {screen.components.length === 0 ? (
              <p className="text-sm text-gray-500 italic pl-4">No components on this screen.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {screen.components.map(comp => {
                  let handlerExample = `${comp.id}_Click`;
                  if (comp.type === 'Slider' || comp.type === 'Switch' || comp.type === 'TextBox') {
                    handlerExample = `${comp.id}_Changed`;
                  }
                  
                  return (
                    <div key={comp.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#6c63ff] font-mono text-sm">{comp.id}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{comp.type}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 pt-1 border-t border-gray-200">
                        Use <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">{handlerExample}</code> in your blocks
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
