/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Library search against the public PlatformIO Registry API.
 * Replaces `arduino-cli lib search --format json`.
 * Endpoint: GET https://api.registry.platformio.org/v3/search?query=...
 */

export interface RegistryLibrary {
    name: string;
    author: string;
    version: string;
    sentence: string;
    website?: string;
}

const REGISTRY_SEARCH_URL = 'https://api.registry.platformio.org/v3/search';

export async function searchRegistry(query: string, limit = 20): Promise<RegistryLibrary[]> {
    const url = `${REGISTRY_SEARCH_URL}?query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'leapblocks-forge' },
            signal: controller.signal,
        });
        if (!res.ok) return [];
        const data = await res.json() as { items?: any[] };
        return (data.items || [])
            .filter((item) => item?.type === 'library' && item?.name)
            .slice(0, limit)
            .map((item) => ({
                name: item.name,
                author: item.owner?.username || 'Unknown Author',
                version: item.version?.name || 'Unknown',
                sentence: item.description || 'No description available.',
                website: item.homepage || '',
            }));
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
}