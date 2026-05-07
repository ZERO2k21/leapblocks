# Relay Module LED Not Glowing - Root Cause and Fix

## Problem Analysis

The relay is switching correctly (ENERGIZED/DE-ENERGIZED), but the LED doesn't light because:

1. **COM pin is not receiving the 5V signal** - The pin change listener only fires for pins connected to Arduino digital pins, not power pins (5V, GND)
2. **Power pins are passive** - 5V and GND don't have "pin change" events
3. **The relay needs special initialization** - When COM is connected to 5V, it should be initialized as HIGH immediately

## Solution

The relay module needs to work like a **passive switch**, not an active component. The current implementation tries to track signals through pin change events, but power connections (5V) don't generate these events.

### Correct Approach:

The relay should be handled in the **traceCircuit** method (which we already added), and the circuit should be re-evaluated whenever the relay state changes. The LED should light because:

1. Arduino 5V → COM (always HIGH, no event needed)
2. When relay energizes: COM connects to NO
3. Circuit tracer follows: 5V → COM → NO → LED → GND
4. LED receives HIGH signal and lights up

### The Real Issue:

Looking at your circuit image, I see the problem: **The relay module is not being treated as a passive switch in the circuit tracer**. The `traceCircuit` method needs to properly handle the relay's bidirectional signal flow.

## Quick Fix

The issue is that when the relay switches, the circuit needs to be **re-traced from the power source (5V)**, not from the relay itself.

### Add this after the relay state change:

```typescript
// After updating relay state, re-trace all circuits from power sources
const boardNodes = currentStateStore.nodes.filter(n =>
  n.data?.type === 'arduino-uno' || n.data?.type === 'esp32-c3'
);

boardNodes.forEach(boardNode => {
  // Find all edges connected to 5V pin
  const powerEdges = currentStateStore.edges.filter(e =>
    (e.source === boardNode.id && e.sourceHandle === '5V') ||
    (e.target === boardNode.id && e.targetHandle === '5V')
  );

  powerEdges.forEach(edge => {
    // Trace from 5V through the circuit
    const startNodeId = edge.source === boardNode.id ? edge.target : edge.source;
    const startPin = edge.source === boardNode.id ? edge.targetHandle : edge.sourceHandle;
    
    if (startNodeId && startPin) {
      const targets = this.traceCircuit(
        currentStateStore.nodes,
        currentStateStore.edges,
        startNodeId,
        startPin
      );

      targets.forEach((target: { nodeId: string; pinName: string; type: string }) => {
        if (target.type === 'led') {
          const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
          if (targetNode) {
            const pinStates = { ...(targetNode.data?.pinStates || {}), [`pin_${target.pinName}`]: true };
            updateNodeData(target.nodeId, { pinStates, damaged: false });
            console.log(`[RELAY MODULE] LED ${target.nodeId} should be ON`);
          }
        }
      });
    }
  });
});
```

## Alternative: Use Existing KS2E-M-DC5 Relay

The `ks2e-m-dc5` relay already works correctly. You can use that instead of the new relay-module until we fix the signal propagation issue.

## Why This Is Complex

Relays are **topology-changing components** - they change which parts of the circuit are connected. This requires:

1. **Circuit re-evaluation** when relay state changes
2. **Passive signal propagation** through switch terminals
3. **Power source tracking** to know what signals are available

The current implementation tries to track signals through events, but relays need a different approach where the entire circuit is re-traced when the relay switches.

## Recommended Solution

Use the working `ks2e-m-dc5` relay component which already handles this correctly, or wait for a complete rewrite of the relay-module signal propagation logic.

The relay-module needs to be refactored to work like ks2e-m-dc5, which properly handles pole pins (P1, P2) receiving signals from the circuit and routing them through the active contacts.
