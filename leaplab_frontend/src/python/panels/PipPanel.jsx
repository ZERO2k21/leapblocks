/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { Download } from "lucide-react";

export default function PipPanel({ packages, pipFilter, setPipFilter, handleInstall }) {
    return (
        <>
            <div className="p-[10px_12px_8px]">
                <span className="text-[11px] font-bold text-gray-500 tracking-wider">PIP PACKAGES</span>
                <input
                    value={pipFilter} onChange={e => setPipFilter(e.target.value)}
                    placeholder="Search packages..."
                    className="mt-2 w-full p-[5px_8px] border border-gray-200 rounded-md text-xs outline-none box-border focus:border-[#8B5CF6]"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {packages.filter(p => p.name.toLowerCase().includes(pipFilter.toLowerCase())).map(pkg => (
                    <div key={pkg.name} className="p-[8px_12px] border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-800">{pkg.name}</span>
                            {pkg.installed ? (
                                <span className="text-[10px] text-emerald-500 font-bold">● READY</span>
                            ) : (
                                <button onClick={() => handleInstall(pkg.name)}
                                    className="text-[10px] p-[2px_8px] bg-[#8B5CF6] text-white border-none rounded cursor-pointer font-bold flex items-center gap-1 hover:bg-purple-700">
                                    <Download size={10} />INSTALL
                                </button>
                            )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{pkg.desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
}
