/**
 * ESP32 Circuit Diagnostics Utility
 * 
 * Provides diagnostic tools to debug ESP32 circuit simulation issues.
 * Use this in the browser console to check circuit wiring status.
 */

import { circuitEngine } from '../Arduino/CircuitEngine';
import { simulationRunner } from '../Arduino/SimulationRunner';
import { useForgeStore } from '../../../utils/store/useForgeStore';

export class ESP32CircuitDiagnostics {
    /**
     * Run a comprehensive diagnostic check on the ESP32 circuit
     */
    static runDiagnostics(): void {
        console.group('🔍 ESP32 Circuit Diagnostics');

        // 1. Check board detection
        console.group('1️⃣ Board Detection');
        const status = circuitEngine.getESP32CircuitStatus();
        console.log('Board detected:', status.boardDetected);
        console.log('Board ID:', status.boardId);
        console.log('Board type:', status.boardType);
        console.log('Components wired:', status.componentsWired);
        console.log('Sensors wired:', status.sensorsWired);
        console.log('Wire count:', status.wireCount);
        if (status.issues.length > 0) {
            console.warn('⚠️ Issues found:', status.issues);
        } else {
            console.log('✅ No issues detected');
        }
        console.groupEnd();

        // 2. Check simulation runner
        console.group('2️⃣ Simulation Runner');
        console.log('Is ESP32-C3 board:', simulationRunner.isESP32C3Board);
        console.log('Selected board:', simulationRunner.selectedBoardId);
        console.log('Is running:', simulationRunner.isRunning);
        console.log('ESP32C3 runner exists:', !!simulationRunner.ESP32C3Runner);
        if (simulationRunner.ESP32C3Runner) {
            console.log('ESP32C3 runner is running:', simulationRunner.ESP32C3Runner.isRunning);
            console.log('ESP32C3 runtime exists:', !!simulationRunner.ESP32C3Runner.runtime);
        }
        console.groupEnd();

        // 3. Check circuit graph
        console.group('3️⃣ Circuit Graph');
        const { nodes, edges } = useForgeStore.getState();
        const esp32Board = nodes.find(n => n.data?.type === 'esp32-c3' || n.data?.type === 'esp32');

        if (esp32Board) {
            const connectedEdges = edges.filter(e => e.source === esp32Board.id || e.target === esp32Board.id);
            console.log('ESP32 board found:', esp32Board.id);
            console.log('Connected edges:', connectedEdges.length);

            // List all connections
            console.group('Connected Components:');
            connectedEdges.forEach(edge => {
                const isOutput = edge.source === esp32Board.id;
                const boardPin = (isOutput ? edge.sourceHandle : edge.targetHandle)?.replace(/__target$/, '');
                const componentId = isOutput ? edge.target : edge.source;
                const componentPin = (isOutput ? edge.targetHandle : edge.sourceHandle)?.replace(/__target$/, '');
                const component = nodes.find(n => n.id === componentId);

                console.log(`${isOutput ? '→' : '←'} ${boardPin} ↔ ${component?.data?.type || 'unknown'} (${componentPin})`);
            });
            console.groupEnd();
        } else {
            console.warn('⚠️ No ESP32 board found in circuit');
        }
        console.groupEnd();

        // 4. Test pin mapping
        console.group('4️⃣ Pin Mapping Test');
        const testPins = ['2', '4', '13', '21', 'D2', 'D4', 'A0', 'A1', 'VP', 'VN'];
        testPins.forEach(pin => {
            const mapping = simulationRunner.convertESP32Pin(pin);
            if (mapping) {
                console.log(`✅ "${pin}" → ${mapping.avrPin} (ADC: ${mapping.adcChannel ?? 'none'})`);
            } else {
                console.warn(`❌ "${pin}" → failed to map`);
            }
        });
        console.groupEnd();

        console.groupEnd();
    }

    /**
     * Test LED blink on a specific GPIO pin
     */
    static testLED(gpioNum: number, duration: number = 2000): void {
        console.log(`🔦 Testing LED on GPIO${gpioNum} for ${duration}ms`);

        if (!simulationRunner.ESP32C3Runner) {
            console.error('❌ ESP32C3 runner not initialized');
            return;
        }

        const pinName = `ESP${gpioNum}`;

        // Blink pattern: ON → OFF → ON → OFF
        const intervals = [0, 500, 1000, 1500];
        intervals.forEach((delay, index) => {
            setTimeout(() => {
                const state = index % 2 === 0;
                console.log(`${state ? '💡' : '⚫'} Setting ${pinName} to ${state ? 'HIGH' : 'LOW'}`);
                simulationRunner.ESP32C3Runner?.injectInput(pinName, state, false);
            }, delay);
        });
    }

    /**
     * Test analog input on a specific GPIO pin
     */
    static testAnalogInput(gpioNum: number, voltage: number): void {
        console.log(`📊 Testing analog input on GPIO${gpioNum} with ${voltage}V`);

        if (!simulationRunner.isESP32C3Board) {
            console.error('❌ Not an ESP32-C3 board');
            return;
        }

        simulationRunner.setESP32C3AnalogInput(gpioNum, voltage);
        console.log(`✅ Injected ${voltage}V into GPIO${gpioNum}`);
    }

    /**
     * Monitor pin state changes
     */
    static monitorPin(gpioNum: number, duration: number = 10000): void {
        console.log(`👁️ Monitoring GPIO${gpioNum} for ${duration}ms`);

        if (!simulationRunner.ESP32C3Runner) {
            console.error('❌ ESP32C3 runner not initialized');
            return;
        }

        const pinName = `ESP${gpioNum}`;
        let count = 0;

        const listener = (pin: string, state: any) => {
            count++;
            console.log(`[${count}] ${pin} changed to:`, state);
        };

        simulationRunner.ESP32C3Runner.addPinListener(pinName, listener);
        console.log(`✅ Listening to ${pinName}...`);

        setTimeout(() => {
            simulationRunner.ESP32C3Runner?.removePinListener(pinName, listener);
            console.log(`✅ Stopped monitoring ${pinName}. Total changes: ${count}`);
        }, duration);
    }

    /**
     * Print current pin states
     */
    static printPinStates(): void {
        console.group('📌 Current Pin States');

        if (!simulationRunner.ESP32C3Runner) {
            console.error('❌ ESP32C3 runner not initialized');
            console.groupEnd();
            return;
        }

        for (let gpio = 0; gpio <= 39; gpio++) {
            const pinName = `ESP${gpio}`;
            const state = simulationRunner.ESP32C3Runner.getPinState(pinName);
            console.log(`GPIO${gpio.toString().padStart(2, ' ')}: ${state}`);
        }

        console.groupEnd();
    }

    /**
     * Inject a button press simulation
     */
    static simulateButtonPress(gpioNum: number, duration: number = 100): void {
        console.log(`🔘 Simulating button press on GPIO${gpioNum} for ${duration}ms`);

        if (!simulationRunner.isESP32C3Board) {
            console.error('❌ Not an ESP32-C3 board');
            return;
        }

        // Button press (LOW with pull-up)
        simulationRunner.setESP32C3GPIOInput(gpioNum, false);
        console.log(`⬇️ Button pressed (GPIO${gpioNum} = LOW)`);

        setTimeout(() => {
            // Button release (HIGH with pull-up)
            simulationRunner.setESP32C3GPIOInput(gpioNum, true);
            console.log(`⬆️ Button released (GPIO${gpioNum} = HIGH)`);
        }, duration);
    }
}

// Export to window for console access
if (typeof window !== 'undefined') {
    (window as any).ESP32Diagnostics = ESP32CircuitDiagnostics;
    console.log('💡 ESP32 diagnostics loaded! Use ESP32Diagnostics.runDiagnostics() in console');
}

export default ESP32CircuitDiagnostics;
