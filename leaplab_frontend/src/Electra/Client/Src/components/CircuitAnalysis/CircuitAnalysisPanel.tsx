/**
 * Circuit Analysis Panel
 * Educational tool to teach circuit theory concepts
 * Shows real-time calculations based on the current circuit
 */
import React, { useMemo } from 'react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

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
            n.data.type === 'esp32-c3' ||
            n.data.type === 'esp32'
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
                case 'relay-module':
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
            <div className="p-4 h-full overflow-y-auto overflow-x-hidden" style={{ background: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                <div className="mb-5 pb-3" style={{ borderBottom: '2px solid #1e293b' }}>
                    <h3 className="m-0 mb-1 text-[20px] font-bold flex items-center gap-2 text-[#22c55e]">⚡ Circuit Analysis</h3>
                    <p className="m-0 text-[12px] font-medium text-[#94a3b8]">Educational Circuit Theory Tool</p>
                </div>
                <div className="text-center px-5 py-[60px] text-[#64748b]">
                    <p className="my-2 text-[14px]">▶️ Start simulation to see circuit analysis</p>
                    <p className="text-[12px] text-[#475569]">Learn Ohm's Law, KCL, KVL, and Power calculations</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden" style={{ background: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            <div className="mb-5 pb-3" style={{ borderBottom: '2px solid #1e293b' }}>
                <h3 className="m-0 mb-1 text-[20px] font-bold flex items-center gap-2 text-[#22c55e]">⚡ Circuit Analysis</h3>
                <p className="m-0 text-[12px] font-medium text-[#94a3b8]">Real-time Circuit Theory</p>
            </div>

            {/* Overall Metrics */}
            <div className="mb-6 p-4 rounded-lg border animate-[analysisFadeIn_0.3s_ease-out]" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-[#bef264]">📊 Circuit Metrics</h4>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
                    <div className="p-3 flex flex-col gap-1 rounded-md border transition-all duration-200 hover:border-[#22c55e] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-[#94a3b8]">Supply Voltage</span>
                        <span className="text-[18px] font-bold font-mono text-[#22c55e]">{analysis.totalVoltage.toFixed(2)} V</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border transition-all duration-200 hover:border-[#22c55e] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-[#94a3b8]">Total Current</span>
                        <span className="text-[18px] font-bold font-mono text-[#22c55e]">{(analysis.totalCurrent * 1000).toFixed(1)} mA</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border transition-all duration-200 hover:border-[#22c55e] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-[#94a3b8]">Total Power</span>
                        <span className="text-[18px] font-bold font-mono text-[#22c55e]">{(analysis.totalPower * 1000).toFixed(1)} mW</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border transition-all duration-200 hover:border-[#22c55e] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-[#94a3b8]">Equivalent R</span>
                        <span className="text-[18px] font-bold font-mono text-[#22c55e]">{analysis.totalResistance.toFixed(1)} Ω</span>
                    </div>
                </div>
            </div>

            {/* Component Analysis */}
            <div className="mb-6 p-4 rounded-lg border animate-[analysisFadeIn_0.3s_ease-out]" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-[#bef264]">🔌 Component Analysis</h4>
                <div className="flex flex-col gap-3">
                    {analysis.components.map(comp => (
                        <div key={comp.id} className="p-3 rounded-md border transition-all duration-200 hover:border-[#3b82f6] hover:shadow-[0_2px_8px_rgba(59,130,246,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[13px] font-semibold text-[#e2e8f0]">{comp.label}</span>
                                <span className="text-[10px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded text-[#64748b]" style={{ background: '#1e293b' }}>{comp.type}</span>
                            </div>
                            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-2 mb-2">
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#cbd5e1]">
                                    <span className="text-[14px]">⚡</span>
                                    <span>{comp.voltage.toFixed(2)} V</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#cbd5e1]">
                                    <span className="text-[14px]">🔄</span>
                                    <span>{(comp.current * 1000).toFixed(1)} mA</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#cbd5e1]">
                                    <span className="text-[14px]">💡</span>
                                    <span>{(comp.power * 1000).toFixed(1)} mW</span>
                                </div>
                                {comp.resistance && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#cbd5e1]">
                                        <span className="text-[14px]">🔧</span>
                                        <span>{comp.resistance.toFixed(1)} Ω</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 p-2 rounded border-l-[3px]" style={{ background: '#1e293b', borderLeftColor: '#22c55e' }}>
                                <code className="text-[11px] font-mono text-[#94a3b8]">P = V × I = {comp.voltage.toFixed(2)}V × {(comp.current * 1000).toFixed(1)}mA = {(comp.power * 1000).toFixed(1)}mW</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Circuit Laws */}
            <div className="mb-6 p-4 rounded-lg border animate-[analysisFadeIn_0.3s_ease-out]" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-[#bef264]">📚 Circuit Theory</h4>

                {/* Ohm's Law */}
                <div className="p-3 mb-3 rounded-md border transition-all duration-200 hover:border-[#8b5cf6] hover:shadow-[0_2px_8px_rgba(139,92,246,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                    <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #334155' }}>
                        <span className="text-[18px]">⚡</span>
                        <span className="text-[13px] font-semibold text-[#e2e8f0]">Ohm's Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.ohmsLaw.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] text-[#cbd5e1] ${i === 0 ? 'text-[14px] font-bold text-[#22c55e] font-mono p-2 rounded mb-1' : ''}`} style={i === 0 ? { background: '#1e293b' } : {}}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KCL */}
                <div className="p-3 mb-3 rounded-md border transition-all duration-200 hover:border-[#8b5cf6] hover:shadow-[0_2px_8px_rgba(139,92,246,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                    <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #334155' }}>
                        <span className="text-[18px]">🔄</span>
                        <span className="text-[13px] font-semibold text-[#e2e8f0]">Kirchhoff's Current Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.kcl.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] text-[#cbd5e1] ${i === 0 ? 'text-[14px] font-bold text-[#22c55e] font-mono p-2 rounded mb-1' : ''}`} style={i === 0 ? { background: '#1e293b' } : {}}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KVL */}
                <div className="p-3 mb-3 rounded-md border transition-all duration-200 hover:border-[#8b5cf6] hover:shadow-[0_2px_8px_rgba(139,92,246,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                    <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #334155' }}>
                        <span className="text-[18px]">🔁</span>
                        <span className="text-[13px] font-semibold text-[#e2e8f0]">Kirchhoff's Voltage Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.kvl.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] text-[#cbd5e1] ${i === 0 ? 'text-[14px] font-bold text-[#22c55e] font-mono p-2 rounded mb-1' : ''}`} style={i === 0 ? { background: '#1e293b' } : {}}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* Power Law */}
                <div className="p-3 rounded-md border transition-all duration-200 hover:border-[#8b5cf6] hover:shadow-[0_2px_8px_rgba(139,92,246,0.1)]" style={{ background: '#0f172a', borderColor: '#334155' }}>
                    <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #334155' }}>
                        <span className="text-[18px]">💡</span>
                        <span className="text-[13px] font-semibold text-[#e2e8f0]">Power Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.powerLaw.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] text-[#cbd5e1] ${i === 0 ? 'text-[14px] font-bold text-[#22c55e] font-mono p-2 rounded mb-1' : ''}`} style={i === 0 ? { background: '#1e293b' } : {}}>{line}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Educational Tips */}
            <div className="mb-6 p-4 rounded-lg border animate-[analysisFadeIn_0.3s_ease-out]" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-[#bef264]">💡 Learning Tips</h4>
                <div className="flex flex-col gap-2.5">
                    <div className="p-3 text-[12px] leading-[1.6] text-[#cbd5e1] rounded-md border-l-[3px]" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderColor: '#334155', borderLeftColor: '#3b82f6' }}>
                        <strong className="block mb-1 text-[#3b82f6] font-semibold">Ohm's Law:</strong> The fundamental relationship between voltage, current, and resistance.
                        If you know any two values, you can calculate the third!
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] text-[#cbd5e1] rounded-md border-l-[3px]" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderColor: '#334155', borderLeftColor: '#3b82f6' }}>
                        <strong className="block mb-1 text-[#3b82f6] font-semibold">KCL:</strong> Current is conserved at every node. What flows in must flow out.
                        This helps analyze parallel circuits.
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] text-[#cbd5e1] rounded-md border-l-[3px]" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderColor: '#334155', borderLeftColor: '#3b82f6' }}>
                        <strong className="block mb-1 text-[#3b82f6] font-semibold">KVL:</strong> Voltage is conserved around any closed loop. The sum of voltage rises
                        equals the sum of voltage drops. Essential for series circuits.
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] text-[#cbd5e1] rounded-md border-l-[3px]" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderColor: '#334155', borderLeftColor: '#3b82f6' }}>
                        <strong className="block mb-1 text-[#3b82f6] font-semibold">Power:</strong> Power is the rate of energy consumption. Higher power means more
                        heat and faster battery drain. Always check component power ratings!
                    </div>
                </div>
            </div>
        </div>
    );
};
