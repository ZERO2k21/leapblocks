/**
 * EmbedMonitors.tsx
 * On-stage monitor overlays: variables, lists, tables, sensing.
 * Rendered as absolute-positioned panels over the stage canvas.
 */
import React from 'react';
import VariableMonitor from './VariableMonitor';
import ListMonitor from './ListMonitor';
import TableMonitor from './TableMonitor';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from '../hooks/useMonitors';

interface EmbedMonitorsProps {
    variableMonitors: VariableMonitorState[];
    listMonitors: ListMonitorState[];
    tableMonitors: TableMonitorState[];
    sensingMonitors: VariableMonitorState[];
    stageWidth: number;
    stageHeight: number;
    onPositionChange: (type: 'variable' | 'list' | 'table' | 'sensing', id: string, x: number, y: number) => void;
    onResize: (type: 'list' | 'table', id: string, w: number, h: number) => void;
    onBringToFront: (type: 'variable' | 'list' | 'table' | 'sensing', id: string) => void;
    onVariableModeChange: (id: string, mode: 'normal' | 'large' | 'slider') => void;
    onVariableValueChange: (id: string, value: string | number) => void;
    onVariableSliderRangeChange: (id: string, min: number, max: number) => void;
    onShowVariable: (name: string) => void;
    onHideVariable: (name: string) => void;
    onShowList: (name: string) => void;
    onHideList: (name: string) => void;
    onShowTable: (name: string) => void;
    onHideTable: (name: string) => void;
}

export const EmbedMonitors: React.FC<EmbedMonitorsProps> = ({
    variableMonitors, listMonitors, tableMonitors, sensingMonitors,
    stageWidth, stageHeight,
    onPositionChange, onResize, onBringToFront,
    onVariableModeChange, onVariableValueChange, onVariableSliderRangeChange,
    onShowVariable, onHideVariable, onShowList, onHideList, onShowTable, onHideTable,
}) => (
    <>
        {variableMonitors.filter(m => m.visible).map(m => (
            <VariableMonitor key={m.id} name={m.name} value={m.value} visible={m.visible}
                x={m.x} y={m.y} zIndex={m.zIndex} mode={m.mode}
                sliderMin={m.sliderMin} sliderMax={m.sliderMax}
                stageWidth={stageWidth} stageHeight={stageHeight}
                onPositionChange={(x, y) => onPositionChange('variable', m.id, x, y)}
                onPointerDown={() => onBringToFront('variable', m.id)}
                onModeChange={(mode) => onVariableModeChange(m.id, mode)}
                onValueChange={(val) => onVariableValueChange(m.id, val)}
                onSliderRangeChange={(min, max) => onVariableSliderRangeChange(m.id, min, max)} />
        ))}

        {listMonitors.filter(m => m.visible).map(m => (
            <ListMonitor key={m.id} name={m.name} items={m.items} visible={m.visible}
                x={m.x} y={m.y} width={m.width} height={m.height} zIndex={m.zIndex}
                onPositionChange={(x, y) => onPositionChange('list', m.id, x, y)}
                onResize={(w, h) => onResize('list', m.id, w, h)}
                onPointerDown={() => onBringToFront('list', m.id)} />
        ))}

        {tableMonitors.filter(m => m.visible).map(m => (
            <TableMonitor key={m.id} name={m.name} data={m.data} visible={m.visible}
                x={m.x} y={m.y} width={m.width} height={m.height} zIndex={m.zIndex}
                onPositionChange={(x, y) => onPositionChange('table', m.id, x, y)}
                onResize={(w, h) => onResize('table', m.id, w, h)}
                onPointerDown={() => onBringToFront('table', m.id)} />
        ))}

        {sensingMonitors.filter(m => m.visible).map(m => (
            <VariableMonitor key={m.id} name={m.name} value={m.value} visible={m.visible}
                x={m.x} y={m.y} zIndex={m.zIndex} mode="normal"
                stageWidth={stageWidth} stageHeight={stageHeight}
                onPositionChange={(x, y) => onPositionChange('sensing', m.id, x, y)}
                onPointerDown={() => onBringToFront('sensing', m.id)} />
        ))}
    </>
);
