/**
 * Normalize an asset path for saving.
 * Strips the current origin and converts legacy /scratch/ paths to /leap/.
 * Preserves data URLs (base64) for custom uploaded assets.
 */
export function normalizeAssetPath(src: string): string {
    if (!src) return src;
    if (src.startsWith('data:')) {
        return src;
    }
    let normalized = src;
    normalized = normalized.replace('assets/sprites/scratch/', 'assets/sprites/leap/');
    normalized = normalized.replace('/assets/sprites/scratch/', '/assets/sprites/leap/');
    return normalized;
}

/**
 * Resolve an asset path for loading.
 * Ensures legacy /scratch/ paths are rewritten to /leap/.
 * Preserves data URLs (base64) for custom uploaded assets.
 */
export function resolveAssetPath(src: string): string {
    if (!src) return src;
    if (src.startsWith('data:')) {
        return src;
    }
    let resolved = src;
    resolved = resolved.replace('assets/sprites/scratch/', 'assets/sprites/leap/');
    resolved = resolved.replace('/assets/sprites/scratch/', '/assets/sprites/leap/');

    const NAMING_FIXES: Record<string, string> = {
        'cat_cat-a.svg': 'cat_cat_a.svg',
        'cat_cat-b.svg': 'cat_cat_b.svg',
        'retro_robot_retro_robot-a.svg': 'retro_robot_retro_robot_a.svg',
        'retro_robot_retro_robot-b.svg': 'retro_robot_retro_robot_b.svg',
    };
    for (const [oldName, newName] of Object.entries(NAMING_FIXES)) {
        resolved = resolved.replace(oldName, newName);
    }
    return resolved;
}
