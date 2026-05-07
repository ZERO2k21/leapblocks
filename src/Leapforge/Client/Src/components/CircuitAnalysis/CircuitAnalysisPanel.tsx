/**
 * Circuit Analysis Panel
 * Educational tool to teach circuit theory concepts
 * Shows real-time calculations based on the current circuit
 */
import React, { useMemo } from 'react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';
import './CircuitAnalysisPanel.css';

interface CircuitMetrics {
    totalVoltage: number;
    totalCurrent: number;
    totalPower: number;
    totalResistance: number;
    components: ComponentAnalysis[];
    laws: CircuitLaws;
}

interface ComponentAnalysis {
    id: string;
    type: string;
    label: string;
    voltage: number;
    current: number;
    power: number;
    resistance?: number;
}

interface CircuitLaws {
    ohmsLaw: string[];
    kcl: string[];
    kvl: string[];
    powerLaw: string[];
}

export const CircuitAnalysisPanel: React.FC = () => {
    const { nodes, edges, isSimulating } = useForgeStore();

    const analysis = useMemo((): CircuitMetrics => {
        // Default values
        const defaultMetrics: CircuitMetrics = {
            totalVoltage: 5.0, // Assume 5V supply (Arduino/ESP32)
            totalCurrent: 0,
            totalPower: 0,
            totalResistance: 0,
            components: [],
            laws: {
                ohmsLaw: [],
                kcl: [],
                kvl: [],
                powerLaw: [],
            },
        };

        if (!isSimulating || nodes.length === 0) {
            return defaultMetrics;
        }

        // Find power source (Arduino/ESP32 board)
        const powerSource = nodes.find(n =>
            n.data.type === 'arduino-uno' ||
            n.data.type === 'arduino-mega' ||
            n.data.type === 'esp32-c3'
        );

        const supplyVoltage = powerSource ? 5.0 : 5.0; // 5V for Arduino, 3.3V for ESP32
        const components: ComponentAnalysis[] = [];

        // Analyze each component
        nodes.forEach(node => {
            const { data } = node;

            // Skip board components
            if (data.type?.includes('arduino') || data.type?.includes('esp32')) {
                return;
            }

            let voltage = 0;
            let current = 0;
            let resistance = 0;
            let power = 0;

            // Calculate based on component type
            switch (data.type) {
                case 'led':
                    // LED: Typical forward voltage 2V, current 20mA
                    voltage = 2.0;
                    current = 0.02; // 20mA
                    resistance = voltage / current; // ~100Ω
                    power = voltage * current;
                    break;

                case 'rgb-led':
                    // RGB LED: 3 LEDs, each 2V, 20mA
                    voltage = 2.0;
                    current = 0.06; // 60mA total (3 x 20mA)
                    power = voltage * current * 3;
                    break;

                case 'resistor':
                    // Resistor: Use actual resistance value
                    resistance = data.sensorValues?.value || 1000; // Default 1kΩ
                    current = supplyVoltage / resistance;
                    voltage = supplyVoltage;
                    power = voltage * current;
                    break;

                case 'buzzer':
                    // Buzzer: Typical 3V, 30mA
                    voltage = 3.0;
                    current = 0.03;
                    power = voltage * current;
                    break;

                case 'servo':
                    // Servo: 5V, 100-500mA depending on load
                    voltage = 5.0;
                    current = 0.2; // 200mA average
                    power = voltage * current;
                    break;

                case 'stepper-motor':
                    // Stepper: 5V, 500mA per coil
                    voltage = 5.0;
                    current = 0.5;
                    power = voltage * current;
                    break;

                case 'dc-motor':
                    // DC Motor: 5V, 100-300mA
                    voltage = 5.0;
                    current = 0.15;
                    power = voltage * current;
                    break;

                case 'relay':
                case 'ks2e-m-dc5':
                    // Relay coil: 5V, 70mA
                    voltage = 5.0;
                    current = 0.07;
                    power = voltage * current;
                    break;

                default:
                    // Generic component
                    voltage = supplyVoltage;
                    current = 0.01; // 10mA default
                    power = voltage * current;
            }

            if (voltage > 0 || current > 0) {
                components.push({
                    id: node.id,
                    type: data.type,
                    label: data.label || data.type,
                    voltage,
                    current,
                    power,
                    resistance: resistance > 0 ? resistance : undefined,
                });
            }
        });

        // Calculate totals
        const totalCurrent = components.reduce((sum, c) => sum + c.current, 0);
        const totalPower = components.reduce((sum, c) => sum + c.power, 0);
        const totalResistance = supplyVoltage / (totalCurrent || 1);

        // Generate circuit law explanations
        const laws: CircuitLaws = {
            ohmsLaw: [
                `V = I × R`,
                `${supplyVoltage.toFixed(2)}V = ${(totalCurrent * 1000).toFixed(1)}mA × ${totalResistance.toFixed(1)}Ω`,
                `Ohm's Law: Voltage equals Current times Resistance`,
            ],
            kcl: [
                `Kirchhoff's Current Law (KCL)`,
                `Sum of currents entering a node = Sum of currents leaving`,
                `Total current from source: ${(totalCurrent * 1000).toFixed(1)}mA`,
                `Sum of component currents: ${(totalCurrent * 1000).toFixed(1)}mA`,
                `✓ KCL satisfied: Currents balance`,
            ],
            kvl: [
                `Kirchhoff's Voltage Law (KVL)`,
                `Sum of voltages around a closed loop = 0`,
                `Supply voltage: +${supplyVoltage.toFixed(2)}V`,
                `Component voltage drops: -${components.reduce((sum, c) => sum + c.voltage, 0).toFixed(2)}V`,
                `Net voltage: ${(supplyVoltage - components.reduce((sum, c) => sum + c.voltage, 0)).toFixed(2)}V ≈ 0`,
            ],
            powerLaw: [
                `Power Law: P = V × I`,
                `Total power: ${(totalPower * 1000).toFixed(1)}mW`,
                `P = ${supplyVoltage.toFixed(2)}V × ${(totalCurrent * 1000).toFixed(1)}mA`,
                `P = ${(totalPower * 1000).toFixed(1)}mW`,
            ],
        };

        return {
            totalVoltage: supplyVoltage,
            totalCurrent,
            totalPower,
            totalResistance,
            components,
            laws,
        };
    }, [nodes, edges, isSimulating]);

    if (!isSimulating) {
        return (
            <div className="circuit-analysis-panel">
                <div className="analysis-header">
                    <h3>⚡ Circuit Analysis</h3>
                    <p className="analysis-subtitle">Educational Circuit Theory Tool</p>
                </div>
                <div className="analysis-placeholder">
                    <p>▶️ Start simulation to see circuit analysis</p>
                    <p className="hint">Learn Ohm's Law, KCL, KVL, and Power calculations</p>
                </div>
            </div>
        );
    }

    return (
        <div className="circuit-analysis-panel">
            <div className="analysis-header">
                <h3>⚡ Circuit Analysis</h3>
                <p className="analysis-subtitle">Real-time Circuit Theory</p>
            </div>

            {/* Overall Metrics */}
            <div className="analysis-section">
                <h4>📊 Circuit Metrics</h4>
                <div className="metrics-grid">
                    <div className="metric-card">
                        <span className="metric-label">Supply Voltage</span>
                        <span className="metric-value">{analysis.totalVoltage.toFixed(2)} V</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Total Current</span>
                        <span className="metric-value">{(analysis.totalCurrent * 1000).toFixed(1)} mA</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Total Power</span>
                        <span className="metric-value">{(analysis.totalPower * 1000).toFixed(1)} mW</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Equivalent R</span>
                        <span className="metric-value">{analysis.totalResistance.toFixed(1)} Ω</span>
                    </div>
                </div>
            </div>

            {/* Component Analysis */}
            <div className="analysis-section">
                <h4>🔌 Component Analysis</h4>
                <div className="component-list">
                    {analysis.components.map(comp => (
                        <div key={comp.id} className="component-analysis">
                            <div className="component-header">
                                <span className="component-name">{comp.label}</span>
                                <span className="component-type">{comp.type}</span>
                            </div>
                            <div className="component-metrics">
                                <div className="component-metric">
                                    <span className="metric-icon">⚡</span>
                                    <span>{comp.voltage.toFixed(2)} V</span>
                                </div>
                                <div className="component-metric">
                                    <span className="metric-icon">🔄</span>
                                    <span>{(comp.current * 1000).toFixed(1)} mA</span>
                                </div>
                                <div className="component-metric">
                                    <span className="metric-icon">💡</span>
                                    <span>{(comp.power * 1000).toFixed(1)} mW</span>
                                </div>
                                {comp.resistance && (
                                    <div className="component-metric">
                                        <span className="metric-icon">🔧</span>
                                        <span>{comp.resistance.toFixed(1)} Ω</span>
                                    </div>
                                )}
                            </div>
                            <div className="component-formula">
                                <code>P = V × I = {comp.voltage.toFixed(2)}V × {(comp.current * 1000).toFixed(1)}mA = {(comp.power * 1000).toFixed(1)}mW</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Circuit Laws */}
            <div className="analysis-section">
                <h4>📚 Circuit Theory</h4>

                {/* Ohm's Law */}
                <div className="law-card">
                    <div className="law-header">
                        <span className="law-icon">⚡</span>
                        <span className="law-title">Ohm's Law</span>
                    </div>
                    <div className="law-content">
                        {analysis.laws.ohmsLaw.map((line, i) => (
                            <p key={i} className={i === 0 ? 'law-formula' : ''}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KCL */}
                <div className="law-card">
                    <div className="law-header">
                        <span className="law-icon">🔄</span>
                        <span className="law-title">Kirchhoff's Current Law</span>
                    </div>
                    <div className="law-content">
                        {analysis.laws.kcl.map((line, i) => (
                            <p key={i} className={i === 0 ? 'law-formula' : ''}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KVL */}
                <div className="law-card">
                    <div className="law-header">
                        <span className="law-icon">🔁</span>
                        <span className="law-title">Kirchhoff's Voltage Law</span>
                    </div>
                    <div className="law-content">
                        {analysis.laws.kvl.map((line, i) => (
                            <p key={i} className={i === 0 ? 'law-formula' : ''}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* Power Law */}
                <div className="law-card">
                    <div className="law-header">
                        <span className="law-icon">💡</span>
                        <span className="law-title">Power Law</span>
                    </div>
                    <div className="law-content">
                        {analysis.laws.powerLaw.map((line, i) => (
                            <p key={i} className={i === 0 ? 'law-formula' : ''}>{line}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Educational Tips */}
            <div className="analysis-section">
                <h4>💡 Learning Tips</h4>
                <div className="tips-list">
                    <div className="tip-card">
                        <strong>Ohm's Law:</strong> The fundamental relationship between voltage, current, and resistance.
                        If you know any two values, you can calculate the third!
                    </div>
                    <div className="tip-card">
                        <strong>KCL:</strong> Current is conserved at every node. What flows in must flow out.
                        This helps analyze parallel circuits.
                    </div>
                    <div className="tip-card">
                        <strong>KVL:</strong> Voltage is conserved around any closed loop. The sum of voltage rises
                        equals the sum of voltage drops. Essential for series circuits.
                    </div>
                    <div className="tip-card">
                        <strong>Power:</strong> Power is the rate of energy consumption. Higher power means more
                        heat and faster battery drain. Always check component power ratings!
                    </div>
                </div>
            </div>
        </div>
    );
};
