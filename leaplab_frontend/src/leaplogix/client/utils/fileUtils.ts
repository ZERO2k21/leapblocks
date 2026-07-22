/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

export const getUniqueFileName = (desiredName: string, existingFiles: Record<string, unknown> | null | undefined): string => {
  const files = existingFiles || {}
  const hasExtension = /\.[^./\\]+$/.test(desiredName)
  const fallbackName = hasExtension ? desiredName : `${desiredName}.py`
  const dotIndex = fallbackName.lastIndexOf(".")
  const base = dotIndex > 0 ? fallbackName.slice(0, dotIndex) : fallbackName
  const extension = dotIndex > 0 ? fallbackName.slice(dotIndex) : ""

  let candidate = fallbackName
  let suffix = 2

  while (files[candidate]) {
    candidate = `${base}_${suffix}${extension}`
    suffix += 1
  }

  return candidate
}

export const buildAssetPlaceholder = (file: { name: string; type?: string; size: number }, kind: string): string => [
  `# Imported ${kind} asset`,
  `name = "${file.name}"`,
  `mime_type = "${file.type || "unknown"}"`,
  `size_bytes = ${file.size}`,
  "",
  "# Added from the Python file explorer.",
  "# Replace this placeholder with your own loading or processing code.",
].join("\n")

export const getFallbackActiveFile = (files: Record<string, unknown> | null | undefined, preferred: string | undefined, defaultFile: string = "main.py"): string => {
  const safeFiles = files || {}
  if (preferred && Object.prototype.hasOwnProperty.call(safeFiles, preferred)) return preferred
  return Object.keys(safeFiles)[0] || defaultFile
}

export default getUniqueFileName
