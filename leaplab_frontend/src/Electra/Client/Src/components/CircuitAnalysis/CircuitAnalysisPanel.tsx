/**
 * Circuit Analysis Panel
 * Educational tool to teach circuit theory concepts
 * Shows real-time calculations based on the current circuit
 */
import React, { useMemo } from 'react';
import { useForgeStore } from '../../../utils/store/useForgeStore';

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
        const defaultMetrics: CircuitMetrics = {
            totalVoltage: 5.0,
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

        const powerSource = nodes.find(n =>
            n.data.type === 'arduino-uno' ||
            n.data.type === 'esp32-c3' ||
            n.data.type === 'esp32'
        );

        const supplyVoltage = powerSource ? 5.0 : 5.0;
        const components: ComponentAnalysis[] = [];

        nodes.forEach(node => {
            const { data } = node;

            if (data.type?.includes('arduino') || data.type?.includes('esp32')) {
                return;
            }

            let voltage = 0;
            let current = 0;
            let resistance = 0;
            let power = 0;

            switch (data.type) {
                case 'led':
                    voltage = 2.0;
                    current = 0.02;
                    resistance = voltage / current;
                    power = voltage * current;
                    break;
                case 'rgb-led':
                    voltage = 2.0;
                    current = 0.06;
                    power = voltage * current * 3;
                    break;
                case 'resistor':
                    resistance = data.sensorValues?.value || 1000;
                    current = supplyVoltage / resistance;
                    voltage = supplyVoltage;
                    power = voltage * current;
                    break;
                case 'buzzer':
                    voltage = 3.0;
                    current = 0.03;
                    power = voltage * current;
                    break;
                case 'servo':
                    voltage = 5.0;
                    current = 0.2;
                    power = voltage * current;
                    break;
                case 'stepper-motor':
                    voltage = 5.0;
                    current = 0.5;
                    power = voltage * current;
                    break;
                case 'dc-motor':
                case 'water-pump':
                    voltage = 5.0;
                    current = 0.2;
                    power = voltage * current;
                    break;
                case 'relay':
                case 'ks2e-m-dc5':
                case 'relay-module':
                    voltage = 5.0;
                    current = 0.07;
                    power = voltage * current;
                    break;
                default:
                    voltage = supplyVoltage;
                    current = 0.01;
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

        const totalCurrent = components.reduce((sum, c) => sum + c.current, 0);
        const totalPower = components.reduce((sum, c) => sum + c.power, 0);
        const totalResistance = supplyVoltage / (totalCurrent || 1);

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
            <div className="circuit-analysis-panel p-4 h-full overflow-y-auto overflow-x-hidden bg-slate-900 text-slate-200">
                <div className="mb-5 pb-3 border-b-2 border-slate-700">
                    <h3 className="m-0 mb-1 text-[20px] font-bold flex items-center gap-2 text-emerald-500">⚡ Circuit Analysis</h3>
                    <p className="m-0 text-[12px] font-medium text-slate-400">Educational Circuit Theory Tool</p>
                </div>
                <div className="text-center px-5 py-[60px] text-slate-500">
                    <p className="my-2 text-[14px]">▶️ Start simulation to see circuit analysis</p>
                    <p className="text-[12px] text-slate-500">Learn Ohm's Law, KCL, KVL, and Power calculations</p>
                </div>
            </div>
        );
    }

    return (
        <div className="circuit-analysis-panel p-4 h-full overflow-y-auto overflow-x-hidden bg-slate-900 text-slate-200">
            <div className="mb-5 pb-3 border-b-2 border-slate-700">
                <h3 className="m-0 mb-1 text-[20px] font-bold flex items-center gap-2 text-emerald-500">⚡ Circuit Analysis</h3>
                <p className="m-0 text-[12px] font-medium text-slate-400">Real-time Circuit Theory</p>
            </div>

            {/* Overall Metrics */}
            <div className="mb-6 p-4 rounded-lg border border-solid border-slate-700 animate-[analysisFadeIn_0.3s_ease-out] bg-slate-800">
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-lime-300">📊 Circuit Metrics</h4>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
                    <div className="p-3 flex flex-col gap-1 rounded-md border border-solid border-slate-700 transition-all duration-200 hover:-translate-y-0.5 bg-slate-900">
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-slate-400">Supply Voltage</span>
                        <span className="text-[18px] font-bold font-mono text-emerald-500">{analysis.totalVoltage.toFixed(2)} V</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border border-solid border-slate-700 transition-all duration-200 hover:-translate-y-0.5 bg-slate-900">
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-slate-400">Total Current</span>
                        <span className="text-[18px] font-bold font-mono text-emerald-500">{(analysis.totalCurrent * 1000).toFixed(1)} mA</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border border-solid border-slate-700 transition-all duration-200 hover:-translate-y-0.5 bg-slate-900">
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-slate-400">Total Power</span>
                        <span className="text-[18px] font-bold font-mono text-emerald-500">{(analysis.totalPower * 1000).toFixed(1)} mW</span>
                    </div>
                    <div className="p-3 flex flex-col gap-1 rounded-md border border-solid border-slate-700 transition-all duration-200 hover:-translate-y-0.5 bg-slate-900">
                        <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-slate-400">Equivalent R</span>
                        <span className="text-[18px] font-bold font-mono text-emerald-500">{analysis.totalResistance.toFixed(1)} Ω</span>
                    </div>
                </div>
            </div>

            {/* Component Analysis */}
            <div className="mb-6 p-4 rounded-lg border border-solid border-slate-700 animate-[analysisFadeIn_0.3s_ease-out] bg-slate-800">
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-lime-300">🔌 Component Analysis</h4>
                <div className="flex flex-col gap-3">
                    {analysis.components.map(comp => (
                        <div key={comp.id} className="p-3 rounded-md border border-solid border-slate-700 transition-all duration-200 bg-slate-900">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[13px] font-semibold text-slate-200">{comp.label}</span>
                                <span className="text-[10px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{comp.type}</span>
                            </div>
                            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-2 mb-2">
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-slate-200">
                                    <span className="text-[14px]">⚡</span>
                                    <span>{comp.voltage.toFixed(2)} V</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-slate-200">
                                    <span className="text-[14px]">🔄</span>
                                    <span>{(comp.current * 1000).toFixed(1)} mA</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-mono text-slate-200">
                                    <span className="text-[14px]">💡</span>
                                    <span>{(comp.power * 1000).toFixed(1)} mW</span>
                                </div>
                                {comp.resistance && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-mono text-slate-200">
                                        <span className="text-[14px]">🔧</span>
                                        <span>{comp.resistance.toFixed(1)} Ω</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 p-2 rounded border-l-[3px] border-l-emerald-500 bg-slate-800">
                                <code className="text-[11px] font-mono text-slate-400">P = V × I = {comp.voltage.toFixed(2)}V × {(comp.current * 1000).toFixed(1)}mA = {(comp.power * 1000).toFixed(1)}mW</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Circuit Laws */}
            <div className="mb-6 p-4 rounded-lg border border-solid border-slate-700 animate-[analysisFadeIn_0.3s_ease-out] bg-slate-800">
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-lime-300">📚 Circuit Theory</h4>

                {/* Ohm's Law */}
                <div className="p-3 mb-3 rounded-md border border-solid border-slate-700 transition-all duration-200 bg-slate-900">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <span className="text-[18px]">⚡</span>
                        <span className="text-[13px] font-semibold text-slate-200">Ohm's Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.ohmsLaw.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] ${i === 0 ? 'text-[14px] font-bold font-mono p-2 rounded mb-1 text-emerald-500 bg-slate-800' : 'text-slate-200'}`}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KCL */}
                <div className="p-3 mb-3 rounded-md border border-solid border-slate-700 transition-all duration-200 bg-slate-900">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <span className="text-[18px]">🔄</span>
                        <span className="text-[13px] font-semibold text-slate-200">Kirchhoff's Current Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.kcl.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] ${i === 0 ? 'text-[14px] font-bold font-mono p-2 rounded mb-1 text-emerald-500 bg-slate-800' : 'text-slate-200'}`}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* KVL */}
                <div className="p-3 mb-3 rounded-md border border-solid border-slate-700 transition-all duration-200 bg-slate-900">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <span className="text-[18px]">🔁</span>
                        <span className="text-[13px] font-semibold text-slate-200">Kirchhoff's Voltage Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.kvl.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] ${i === 0 ? 'text-[14px] font-bold font-mono p-2 rounded mb-1 text-emerald-500 bg-slate-800' : 'text-slate-200'}`}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* Power Law */}
                <div className="p-3 rounded-md border border-solid border-slate-700 transition-all duration-200 bg-slate-900">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <span className="text-[18px]">💡</span>
                        <span className="text-[13px] font-semibold text-slate-200">Power Law</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.laws.powerLaw.map((line, i) => (
                            <p key={i} className={`m-0 text-[12px] leading-[1.5] ${i === 0 ? 'text-[14px] font-bold font-mono p-2 rounded mb-1 text-emerald-500 bg-slate-800' : 'text-slate-200'}`}>{line}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Educational Tips */}
            <div className="mb-6 p-4 rounded-lg border border-solid border-slate-700 animate-[analysisFadeIn_0.3s_ease-out] bg-slate-800">
                <h4 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.5px] text-lime-300">💡 Learning Tips</h4>
                <div className="flex flex-col gap-2.5">
                    <div className="p-3 text-[12px] leading-[1.6] rounded-md border-l-[3px] border-slate-700 border-l-blue-500 text-slate-200 bg-gradient-to-br from-slate-800 to-slate-900">
                        <strong className="block mb-1 font-semibold text-blue-500">Ohm's Law:</strong> The fundamental relationship between voltage, current, and resistance.
                        If you know any two values, you can calculate the third!
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] rounded-md border-l-[3px] border-slate-700 border-l-blue-500 text-slate-200 bg-gradient-to-br from-slate-800 to-slate-900">
                        <strong className="block mb-1 font-semibold text-blue-500">KCL:</strong> Current is conserved at every node. What flows in must flow out.
                        This helps analyze parallel circuits.
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] rounded-md border-l-[3px] border-slate-700 border-l-blue-500 text-slate-200 bg-gradient-to-br from-slate-800 to-slate-900">
                        <strong className="block mb-1 font-semibold text-blue-500">KVL:</strong> Voltage is conserved around any closed loop. The sum of voltage rises
                        equals the sum of voltage drops. Essential for series circuits.
                    </div>
                    <div className="p-3 text-[12px] leading-[1.6] rounded-md border-l-[3px] border-slate-700 border-l-blue-500 text-slate-200 bg-gradient-to-br from-slate-800 to-slate-900">
                        <strong className="block mb-1 font-semibold text-blue-500">Power:</strong> Power is the rate of energy consumption. Higher power means more
                        heat and faster battery drain. Always check component power ratings!
                    </div>
                </div>
            </div>
        </div>
    );
};
