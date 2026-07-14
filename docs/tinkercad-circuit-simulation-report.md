# Tinkercad Circuit Simulation: Components & Wires — Behavior Report

> A learning report compiled from official Tinkercad documentation, tutorials, and educator resources, covering how individual components and the **wire** component behave inside the Tinkercad Circuits simulator.

---

## 1. What Tinkercad Circuits Is

Tinkercad Circuits is Autodesk's free, browser-based electronics workbench. It combines:

- A **drag-and-drop schematic/canvas editor** (no installation required).
- A **real-time SPICE-like simulator** that solves the circuit numerically when you press *Start Simulation*.
- An optional **code editor** (Blocks + C/C++) for Arduino UNO, Micro:bit, and ESP boards.
- A library of **virtual instruments** — multimeter, oscilloscope, function generator, power supply, serial monitor.

The simulator is "**doomed to succeed**" — it enforces ideal behavior (no parasitic resistance, no thermal noise, no broken wires that aren't visible), which is why students can focus on theory rather than hardware quirks.

---

## 2. The Two Kinds of "Things" on the Canvas

Everything on the canvas is one of two things:

| Category | Examples | Role |
|---|---|---|
| **Components** | Battery, Resistor, Capacitor, LED, Switch, Arduino, Multimeter, Breadboard, Transistor, IC | Each has a model (resistance, voltage drop, polarity, logic state, etc.) that the simulator solves. |
| **Wires** | A single conductor that joins component terminals | Pure connectivity — no resistance, no voltage drop, no logic. They only say "these two pins are the same node." |

Understanding that a wire has **no electrical behavior of its own** (other than being a perfect conductor) is the single most important mental model in Tinkercad.

---

## 3. How Components Behave in the Simulator

### 3.1 Generic component model

Every component, when placed on the canvas, exposes:

1. **Connection points** (small circles/dots) — these are the only valid places a wire can terminate.
2. **A symbol/footprint** — the picture you see on the canvas.
3. **A properties panel** — appears when you click the component. Lets you change values (resistance Ω, capacitance µF, color, count, mode, etc.).
4. **An internal model** — the equations the simulator uses when *Start Simulation* is pressed.

### 3.2 Behavior of common components

| Component | Behavior the simulator applies |
|---|---|
| **Battery (DC source)** | Holds its terminals at the configured voltage (e.g., 9 V). Reversing polarity by swapping wires is allowed. |
| **Resistor** | Enforces Ohm's law (V = IR) across its two terminals. Resistance is editable. |
| **LED** | A diode with a forward voltage drop (~2 V for red). Current flows **only** from anode → cathode. If you wire it backwards, it stays off. If you exceed its current rating, the simulator shows a **"shatter" icon** instead of silently failing. |
| **Switch (slide / push / SPDT)** | Either a short or an open circuit between its terminals. The push button must be *clicked* during simulation to close. |
| **Capacitor** | Stores charge, follows `I = C dV/dt`. In DC steady state, blocks current. |
| **Breadboard** | Not a component electrically — it is a **node-bus**. All holes in the same row/column are wired together internally. Hovering over a hole shows green circles that highlight which other holes are connected. |
| **Multimeter** | Three modes: **Voltmeter** (wired in parallel, infinite resistance), **Ammeter** (wired in series, ~0 resistance, otherwise would short the circuit), **Ohmmeter** (measures an isolated component, must power off the rest of the circuit). |
| **Arduino / Micro:bit** | Their pins act as voltage sources, grounds, or analog inputs according to your code. The simulator executes the code line-by-line in lockstep with the circuit solver. |

### 3.3 What happens when components misbehave

The simulator **never silently fails** in the way real hardware does. Instead it gives you visual cues:

- LED does not light → wrong polarity, broken loop, or insufficient current.
- LED shows a **red shatter icon** → exceeded max current (e.g., 9 V directly across an LED).
- A wire turns **red/orange** with a warning → short circuit, excessive current, or overload.
- Component outline pulses/highlights → a fault condition it cannot model properly.
- "Floating" pin warnings on Arduino → a logic input is not tied to HIGH or LOW.

---

## 4. How Wires Behave in the Simulator

### 4.1 What a wire *is*

A wire in Tinkercad is the **wire component** — a graphical object that:

- Has **zero resistance** (ideal conductor).
- Has **no voltage drop** across it (whatever node voltage exists at one end equals the node voltage at the other end).
- **Does not store energy**, no capacitance, no inductance.
- **Cannot cross itself** to form a T-junction (Tinkercad intentionally disallows free-floating junctions — see §4.5).
- Carries the simulator's notion of a **node**: every point connected by a continuous wire shares one electrical node.

### 4.2 How to create a wire

1. **Hover** over a component terminal — a red square appears when you are on a valid connection point.
2. **Click and drag** — a green "rubber band" wire follows your mouse.
3. **Click** on a destination terminal (red square again) to complete the wire.
4. **Click** on the wire *before* reaching the end to insert a **bend dot** that you can drag to shape a 90° corner.
5. The wire is finalized only when both ends land on valid connection points.

### 4.3 Editing a wire after creation

- **Click** the wire to select it; bend points appear as green dots.
- **Drag** the bend dots to reshape.
- **Drag** an endpoint (white dot) to a new terminal to re-route.
- **Press the Delete key** to remove it.
- **Press a number key 0–9** while the wire is selected to recolor it (handy convention: red = +, black = −, green/blue = signal).

### 4.4 Wire "types"

A relatively new addition is the **wire type selector** in the properties panel. Different visual types (jumper, hookup, alligator, etc.) are **functionally identical** — they exist only for documentation/realism. Electrically they are all the same ideal conductor.

### 4.5 The most important wire rule: no free junctions

Tinkercad **does not let you draw a T-junction** by overlapping two wires. The only ways to create a multi-point electrical node are:

1. Connect all wires to a **single component terminal** (e.g., three wires all ending on one Arduino GND pin).
2. Connect all wires to a **breadboard row or rail** (all holes in that row become one node).
3. Use a **component with multiple pins that are internally common** (e.g., Arduino's many GND pins).

If you try to drop one wire across the middle of another, Tinkercad will simply not snap — the wires are not electrically joined.

### 4.6 Wires and the breadboard

On a breadboard, the **wire component is mostly unnecessary** between two components that share a row. The internal metal strips under the holes do the connecting. This is why breadboards are recommended for anything beyond a 2–3 component circuit.

The breadboard's internal structure the simulator models:

- **Vertical power rails** (the + and − columns on the far edges), top half and bottom half separated by a red/blue line — each is one node.
- **Horizontal rows** of 5 holes (columns a–e on the left, f–j on the right) — the **"ravine"** in the middle separates the two halves, so a–e is **not** connected to f–j even in the same row number.

---

## 5. Component ↔ Wire Interaction Rules (Cheat Sheet)

| Rule | What the simulator enforces |
|---|---|
| Wires can only start/end on a component terminal or a breadboard hole. | Free-floating wire ends are invalid. |
| A terminal may have **multiple wires** attached. | All those wires become one node (this is how T-junctions are achieved). |
| A wire may be **bended** but cannot be **branched**. | To branch, attach both wires to the same terminal. |
| Wires have **no resistance and no voltage drop**. | Whatever voltage is at one end is the voltage at the other. |
| The simulator locks once *Start Simulation* is pressed. | You must stop the sim to edit the circuit. |
| A wire that is left disconnected lights up a warning. | The simulator flags open/floating nets. |
| Wire color is cosmetic only. | Red/black/green carries no electrical meaning. |
| Polarity-sensitive components (LED, electrolytic cap, diode) need correct orientation. | Wrong way round = no current flows, no warning, just silent failure (LED) or shatter (over-driven LED). |
| Voltmeters go in **parallel**; ammeters go in **series**. | Reverse either and the reading is negative, or the ammeter will short the rail. |

---

## 6. Walking Through a Simple Simulation

The canonical beginner circuit — a battery, a resistor, and an LED — illustrates how components and wires interact under the solver:

1. **Battery** is a 9 V source. Its `+` terminal is node A, its `−` terminal is node B (GND).
2. A **wire** from `+` to one end of the **resistor** puts that resistor end on node A (9 V).
3. The other end of the resistor is on a new node C.
4. A **wire** from the resistor's other end to the **LED anode** ties them together on node C.
5. A **wire** from the **LED cathode** back to the battery `−` ties it to node B (0 V).
6. The solver now sees a single loop: 9 V across (resistor + LED).
7. LED forward voltage ≈ 2 V → resistor sees 7 V.
8. Pick R = 330 Ω → I = 7/330 ≈ 21 mA → LED lights at safe brightness.

If you change the resistor to 0.4 kΩ (400 Ω) the current drops to ~17 mA. Drop it to 10 Ω and the LED "shatters" — a clear, visual signal of a real-world design error that real hardware would hide until the LED burned out.

---

## 7. Best-Practice Tips from Tinkercad's Own Guides

- **Color-code wires**: red for VCC, black for GND, other colors for signals. Use number keys 0–9 to recolor a selected wire.
- **Use the breadboard** once you have more than three components; it keeps wires short and readable.
- **Hover before you click**: a red square = valid terminal; green circles on a breadboard = connected holes.
- **Stop the simulation before editing** — Tinkercad locks the canvas while it is running.
- **Add a multimeter in voltage mode first** to probe each node, then switch to current mode to see the loop current.
- **For Arduino projects**, hover over variables during a breakpoint to see live values — Tinkercad's debugger is unusual among simulators.
- **Use the `Start Simulation` button often** to catch errors incrementally rather than building a 20-component circuit and then debugging it all at once.

---

## 8. Summary — The Two Mental Models

1. **Components** are the only things that *do* anything electrical. They have a model, a polarity (sometimes), editable properties, and a visual fault indicator.
2. **Wires** are the only things that *connect* components. They are ideal, colorless electrically, branchless, and may only end on a terminal or breadboard hole. A wire is, to the simulator, simply a label saying "these two points are the same node."

Master these two ideas and the rest of Tinkercad Circuits — multimeters, oscilloscopes, Arduino code, even 555-timer astables — falls into place as variations on the same theme: components on nodes, nodes joined by wires, the solver applying Kirchhoff's and Ohm's laws to the whole graph at every simulation step.

---

### Sources
- Tinkercad — *Official Guide to Tinkercad Circuits* (tinkercad.com/blog)
- Tinkercad — *Wiring Components* (tinkercad.com/learn)
- Tinkercad — *New Wire Options in Tinkercad Circuits* (tinkercad.com/blog)
- Aberystwyth University — *Introduction to Circuits* (outreach-hub.aber.ac.uk)
- MJ Voytko — *Tinkercad Circuits* tutorial (mjvo.github.io)
- TeachEngineering — *Tinkercad Circuits & EV Motor Workshop* (teachengineering.org)
- Brightonk12 — *Tutorial: Tinkercad Electrical Series Circuit* (PDF)
- Energiazero — *Electronic Circuit Basics with Tinkercad* (PDF)
- CMU 16-223 — *Exercise: Resistive Circuits in Tinkercad* (courses.ideate.cmu.edu)
