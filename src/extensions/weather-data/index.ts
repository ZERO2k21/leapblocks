import { Extension, ExtensionInfo } from '../core/Extension';
import { WeatherRuntime } from './runtime';

export class WeatherDataExtension extends Extension {
    private runtime: WeatherRuntime;

    constructor(runtime?: WeatherRuntime) {
        super(runtime);
        this.runtime = runtime || new WeatherRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'weather_data',
            name: 'Weather Data',
            color1: '#0288D1',
            blocks: [
                { opcode: 'weather_get_for_city', blockType: 'command', text: 'fetch weather for [CITY]', arguments: { CITY: { type: 'string', defaultValue: 'London' } } },
                { opcode: 'weather_get_for_location', blockType: 'command', text: 'fetch weather for lat [LAT] lon [LON]', arguments: { LAT: { type: 'number', defaultValue: 51.5 }, LON: { type: 'number', defaultValue: -0.1 } } },
                { opcode: 'weather_temperature', blockType: 'reporter', text: 'temperature' },
                { opcode: 'weather_condition', blockType: 'reporter', text: 'weather condition' },
                { opcode: 'weather_humidity', blockType: 'reporter', text: 'humidity' },
                { opcode: 'weather_wind_speed', blockType: 'reporter', text: 'wind speed' },
                { opcode: 'weather_is_raining', blockType: 'Boolean', text: 'is raining' },
            ]
        };
    }

    weather_get_for_city(city: string) { return this.runtime.fetchWeather(city); }
    weather_get_for_location(lat: number, lon: number) { return this.runtime.fetchWeatherByLocation(lat, lon); }
    weather_temperature() { return this.runtime.getTemperature(); }
    weather_condition() { return this.runtime.getCondition(); }
    weather_humidity() { return this.runtime.getHumidity(); }
    weather_wind_speed() { return this.runtime.getWindSpeed(); }
    weather_is_raining() { return this.runtime.isRaining(); }
}

export const weatherDataExtension = new WeatherDataExtension();
export { WeatherRuntime } from './runtime';
