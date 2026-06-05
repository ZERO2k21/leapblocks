/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { createContext, useContext } from "react";

const LogixContext = createContext(null);

export function LogixProvider({ children, value }) {
    return (
        <LogixContext.Provider value={value}>
            {children}
        </LogixContext.Provider>
    );
}

export function useLogix() {
    return useContext(LogixContext);
}

export default LogixContext;
