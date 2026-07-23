/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { FileText } from "lucide-react";

export default function FileTabs({ projectFiles, activeFile, setActiveFile }) {
    return (
        <div className="flex bg-[#EFEFEF] border-b border-gray-200 overflow-x-auto shrink-0 h-9">
            {Object.keys(projectFiles).map(file => (
                <div key={file}
                    onClick={() => setActiveFile(file)}
                    className={`px-4 h-full flex items-center gap-2 cursor-pointer text-xs whitespace-nowrap border-r border-gray-200 border-b-2 transition-colors ${
                        activeFile === file
                            ? "bg-white text-[#8B5CF6] border-b-[#8B5CF6] font-semibold"
                            : "bg-transparent text-gray-500 border-b-transparent font-normal hover:text-gray-700"
                    }`}
                >
                    <FileText size={12} />
                    {file}
                </div>
            ))}
        </div>
    );
}
