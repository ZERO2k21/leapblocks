/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { createContext, useContext } from "react";

const CodexContext = createContext(null);

export function CodexProvider({ children, value }) {
    return (
        <CodexContext.Provider value={value}>
            {children}
        </CodexContext.Provider>
    );
}

export function useCodex() {
    return useContext(CodexContext);
}

export default CodexContext;
