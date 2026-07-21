/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

export const LMS_API_BASE =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) ||
    'https://lms-api.creoleap.workers.dev';

export const LMS_API_URL = `${LMS_API_BASE}/api`;

export const LMS_VERIFY_URL = `${LMS_API_BASE}/api/leaplab/auth/verify`;

export const LMS_PROJECTS_URL = `${LMS_API_BASE}/api/leaplab/projects`;
