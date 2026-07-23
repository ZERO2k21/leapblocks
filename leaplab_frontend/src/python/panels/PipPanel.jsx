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
            <div className="py-2.5 px-3 pb-2">
                <span className="text-xs font-bold text-slate-500 tracking-wider">PIP PACKAGES</span>
                <input
                    value={pipFilter}
                    onChange={e => setPipFilter(e.target.value)}
                    placeholder="Search packages..."
                    className="mt-2 w-full py-1.5 px-2 border border-slate-200 rounded-md text-xs outline-none box-border focus:border-purple-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {packages.filter(p => p.name.toLowerCase().includes(pipFilter.toLowerCase())).map(pkg => (
                    <div key={pkg.name} className="py-2 px-3 border-b border-slate-200">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-800">{pkg.name}</span>
                            {pkg.installed ? (
                                <span className="text-xs text-emerald-500 font-bold">● READY</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleInstall(pkg.name)}
                                    className="text-xs py-0.5 px-2 bg-purple-600 text-white border-0 rounded cursor-pointer font-bold flex items-center gap-1 hover:bg-purple-700 transition-colors"
                                >
                                    <Download size={10} />INSTALL
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{pkg.desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
}
