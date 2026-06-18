/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

export const LMS_API_BASE =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) ||
    'https://lms-api.creoleap.workers.dev';

export const LMS_VERIFY_URL = `${LMS_API_BASE}/api/leaplab/auth/verify`;
