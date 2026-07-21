/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState } from 'react';

export function isEmbedded(): boolean {
  return typeof window !== 'undefined' && window !== window.parent;
}

export function useIsEmbedded(): boolean {
  const [embedded] = useState(isEmbedded);
  return embedded;
}
