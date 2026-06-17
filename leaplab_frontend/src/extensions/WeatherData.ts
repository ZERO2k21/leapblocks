// WeatherData.ts - Weather data blocks using Open-Meteo API (free, no key required)

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const weatherDataBlocks = [
    {
        type: 'weather_get_for_city',
        message0: 'fetch weather for %1',
        args0: [{ type: 'field_input', name: 'CITY', text: 'London' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#0288D1',
        tooltip: 'Fetch weather data for the given city name',
        helpUrl: ''
    },
    {
        type: 'weather_get_for_location',
        message0: 'fetch weather for lat %1 lon %2',
        args0: [
            { type: 'field_number', name: 'LAT', value: 51.5, step: 0.1 },
            { type: 'field_number', name: 'LON', value: -0.1, step: 0.1 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#0288D1',
        tooltip: 'Fetch weather data for the given latitude and longitude',
        helpUrl: ''
    },
    {
        type: 'weather_temperature',
        message0: 'temperature',
        output: 'Number',
        colour: '#01579B',
        tooltip: 'Get the current temperature in Celsius',
        helpUrl: ''
    },
    {
        type: 'weather_condition',
        message0: 'weather condition',
        output: 'String',
        colour: '#01579B',
        tooltip: 'Get the current weather condition description',
        helpUrl: ''
    },
    {
        type: 'weather_humidity',
        message0: 'humidity',
        output: 'Number',
        colour: '#01579B',
        tooltip: 'Get the current humidity percentage',
        helpUrl: ''
    },
    {
        type: 'weather_wind_speed',
        message0: 'wind speed',
        output: 'Number',
        colour: '#01579B',
        tooltip: 'Get the current wind speed in km/h',
        helpUrl: ''
    },
    {
        type: 'weather_is_raining',
        message0: 'is raining',
        output: 'Boolean',
        colour: '#01579B',
        tooltip: 'Returns true if the current condition is rain, drizzle, or showers',
        helpUrl: ''
    }
];

// WMO Weather interpretation codes → human-readable descriptions
const WMO_CODES: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

// Codes that indicate rain/drizzle/showers
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

// Cache entry type
interface CacheEntry {
    data: any;
    timestamp: number;
}

// Runtime implementation
export class WeatherRuntime {
    private cache: Map<string, CacheEntry> = new Map();
    private lastCity = '';
    private lastTemperature = 0;
    private lastCondition = '';
    private lastHumidity = 0;
    private lastWindSpeed = 0;
    private lastWeatherCode = 0;
    private lastFetchedCity = '';
    private cacheTTL = 10 * 60 * 1000; // 10 minutes

    // Geocode a city name to lat/lon using Open-Meteo geocoding API
    private async geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
        const cacheKey = `geo:${city.toLowerCase()}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;
            const resp = await fetch(url);
            if (!resp.ok) return null;
            const json = await resp.json();

            if (json.results && json.results.length > 0) {
                const result = json.results[0];
                const geo = { lat: result.latitude, lon: result.longitude };
                this.cache.set(cacheKey, { data: geo, timestamp: Date.now() });
                return geo;
            }
            return null;
        } catch (err) {
            console.error('[Weather] Geocoding failed:', err);
            return null;
        }
    }

    // Fetch weather from Open-Meteo free API
    async fetchWeather(city: string): Promise<boolean> {
        try {
            const geo = await this.geocodeCity(city);
            if (!geo) {
                console.warn(`[Weather] City not found: ${city}`);
                return false;
            }

            const cacheKey = `weather:${geo.lat.toFixed(2)},${geo.lon.toFixed(2)}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                this._applyData(cached.data, city);
                return true;
            }

            const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
            const resp = await fetch(url);
            if (!resp.ok) {
                console.error('[Weather] API error:', resp.status);
                return false;
            }

            const json = await resp.json();
            this.cache.set(cacheKey, { data: json, timestamp: Date.now() });
            this._applyData(json, city);
            return true;
        } catch (err) {
            console.error('[Weather] Fetch failed:', err);
            return false;
        }
    }

    // Fetch weather by coordinates directly
    async fetchWeatherByLocation(lat: number, lon: number): Promise<boolean> {
        try {
            const cacheKey = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                this._applyData(cached.data, `${lat},${lon}`);
                return true;
            }

            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
            const resp = await fetch(url);
            if (!resp.ok) return false;

            const json = await resp.json();
            this.cache.set(cacheKey, { data: json, timestamp: Date.now() });
            this._applyData(json, `${lat},${lon}`);
            return true;
        } catch (err) {
            console.error('[Weather] Fetch by location failed:', err);
            return false;
        }
    }

    private _applyData(json: any, cityLabel: string) {
        const current = json.current;
        if (current) {
            this.lastTemperature = current.temperature_2m ?? 0;
            this.lastHumidity = current.relative_humidity_2m ?? 0;
            this.lastWeatherCode = current.weather_code ?? 0;
            this.lastWindSpeed = current.wind_speed_10m ?? 0;
            this.lastCondition = WMO_CODES[this.lastWeatherCode] || 'Unknown';
        }
        this.lastFetchedCity = cityLabel;
        this.lastCity = cityLabel;
        console.log(`[Weather] Fetched for ${cityLabel}: ${this.lastTemperature}°C, ${this.lastCondition}`);
    }

    // Reporters
    getTemperature(): number { return this.lastTemperature; }
    getCondition(): string { return this.lastCondition; }
    getHumidity(): number { return this.lastHumidity; }
    getWindSpeed(): number { return this.lastWindSpeed; }
    isRaining(): boolean { return RAIN_CODES.has(this.lastWeatherCode); }
    getCity(): string { return this.lastFetchedCity; }
    getWeatherCode(): number { return this.lastWeatherCode; }

    // Cache management
    clearCache() { this.cache.clear(); }
    setCacheTTL(ms: number) { this.cacheTTL = ms; }
}

// Register blocks
export function registerWeatherDataBlocks() {
    const newBlocks = weatherDataBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerWeatherDataGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['weather_get_for_city'] = (block: any) => {
        const city = block.getFieldValue('CITY') || 'London';
        return `if(window.runtime?.weather) await window.runtime.weather.fetchWeather('${city.replace(/'/g, "\\'")}');\n`;
    };
    jsGen['weather_get_for_location'] = (block: any) => {
        const lat = block.getFieldValue('LAT') || 0;
        const lon = block.getFieldValue('LON') || 0;
        return `if(window.runtime?.weather) await window.runtime.weather.fetchWeatherByLocation(${lat}, ${lon});\n`;
    };
    jsGen['weather_temperature'] = () =>
        ['window.runtime?.weather?.getTemperature()||0', 0];
    jsGen['weather_condition'] = () =>
        ['window.runtime?.weather?.getCondition()||""', 0];
    jsGen['weather_humidity'] = () =>
        ['window.runtime?.weather?.getHumidity()||0', 0];
    jsGen['weather_wind_speed'] = () =>
        ['window.runtime?.weather?.getWindSpeed()||0', 0];
    jsGen['weather_is_raining'] = () =>
        ['window.runtime?.weather?.isRaining()||false', 0];
}

// Extension configuration
export const weatherDataExtension: ExtensionCategory = {
    id: 'weather_data',
    name: 'Weather Data',
    colour: '#0288D1',
    icon: '🌤️',
    blocks: weatherDataBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
