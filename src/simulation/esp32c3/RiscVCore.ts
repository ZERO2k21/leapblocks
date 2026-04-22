/**
 * ESP32-C3 RISC-V Core Emulator
 * 
 * IMPLEMENTATION STATUS:
 * =====================
 * This is a MOCK implementation for development and testing purposes.
 * The actual RISC-V emulator needs to be integrated using a WASM-based
 * RV32IMC emulator such as:
 * - d0iasm/rvemu (supports RV64GC, needs RV32IMC variant)
 * - @aloeminium108/risc-v-emulator (supports RV32I only, needs M+C extensions)
 * - Custom RISC-V emulator compiled to WASM
 * 
 * TODO: Replace mock CPU with actual RISC-V WASM emulator
 * TODO: Implement proper memory-mapped I/O hooks
 * TODO: Add interrupt handling
 * TODO: Add proper timing simulation
 * 
 * ESP32-C3 Peripheral Register Map Reference:
 * ==========================================
 * 
 * Memory Layout:
 * - Flash:  0x4200_0000 - 0x4240_0000 (4MB) - Application code
 * - SRAM:   0x3FC8_0000 - 0x3FCA_8000 (400KB) - Data/stack
 * 
 * Peripheral Base Addresses:
 * - UART0:  0x6000_0000
 *   - TX FIFO:   +0x000 (write byte → Serial output)
 *   - STATUS:    +0x01C (FIFO status)
 * 
 * - GPIO:   0x6000_4000
 *   - OUT:       +0x004 (bit N = GPIO N output value)
 *   - OUT_W1TS:  +0x008 (write 1 to set bit)
 *   - OUT_W1TC:  +0x00C (write 1 to clear bit)
 *   - ENABLE:    +0x020 (output enable mask)
 *   - IN:        +0x03C (input values for digitalRead)
 * 
 * - I2C0:   0x6001_3000
 *   - DATA:      +0x01C (I2C TX/RX data register)
 *   - CMD:       +0x058 (command register)
 *   - SR:        +0x00C (status register)
 * 
 * - ADC:    0x6004_0000
 *   - RESULT:    +0x000 (12-bit ADC result per channel)
 *   - Channels: GPIO0=CH0, GPIO1=CH1, GPIO2=CH2, GPIO3=CH3, GPIO4=CH4
 */

export interface RiscVCoreCallbacks {
    onGPIOOutput: (pin: number, high: boolean) => void;
    onUARTByte: (byte: number) => void;
    onI2CWrite: (address: number, data: Uint8Array) => void;
}

// ESP32-C3 Memory Map Constants
const FLASH_BASE = 0x42000000;
const FLASH_SIZE = 4 * 1024 * 1024; // 4MB
const SRAM_BASE = 0x3FC80000;
const SRAM_SIZE = 400 * 1024; // 400KB

// Peripheral Base Addresses
const UART0_BASE = 0x60000000;
const UART0_TX_FIFO = UART0_BASE + 0x000;
const UART0_STATUS = UART0_BASE + 0x01C;

const GPIO_BASE = 0x60004000;
const GPIO_OUT = GPIO_BASE + 0x004;
const GPIO_OUT_W1TS = GPIO_BASE + 0x008;
const GPIO_OUT_W1TC = GPIO_BASE + 0x00C;
const GPIO_ENABLE = GPIO_BASE + 0x020;
const GPIO_IN = GPIO_BASE + 0x03C;

const I2C0_BASE = 0x60013000;
const I2C0_DATA = I2C0_BASE + 0x01C;
const I2C0_CMD = I2C0_BASE + 0x058;
const I2C0_SR = I2C0_BASE + 0x00C;

const ADC_BASE = 0x60040000;
const ADC_RESULT = ADC_BASE + 0x000;

export class RiscVCore {
    private cpu: any; // RISC-V WASM CPU instance
    private memory: Uint8Array;
    private callbacks: RiscVCoreCallbacks;

    // Peripheral state
    private gpioOutputs = 0; // 32-bit GPIO output register
    private gpioInputs = 0;  // 32-bit GPIO input register
    private gpioEnable = 0;  // 32-bit GPIO enable register
    private adcResults = new Uint32Array(8); // ADC result registers (12-bit each)

    // I2C state
    private i2cBuffer: number[] = [];
    private i2cAddress = 0;
    private i2cInTransaction = false;

    // Mock CPU state
    private mockCycles = 0;
    private mockPC = FLASH_BASE;

    constructor(callbacks: RiscVCoreCallbacks) {
        this.callbacks = callbacks;
        this.memory = new Uint8Array(FLASH_SIZE + SRAM_SIZE);
    }

    async init(firmwareBin: Uint8Array): Promise<void> {
        try {
            // TODO: Replace with actual RISC-V WASM emulator
            // For now, use a mock implementation for development
            console.warn('[ESP32-C3] Using mock RISC-V emulator - replace with actual implementation');

            // Mock CPU interface
            this.cpu = {
                step: (cycles: number) => {
                    // Mock execution - just increment a counter
                    this.mockCycles = (this.mockCycles || 0) + cycles;
                },
                reset: () => {
                    this.mockCycles = 0;
                },
                setProgramCounter: (pc: number) => {
                    this.mockPC = pc;
                }
            };

            // Load firmware into flash memory at 0x4200_0000
            if (firmwareBin.length > FLASH_SIZE) {
                throw new Error(`Firmware too large: ${firmwareBin.length} bytes > ${FLASH_SIZE} bytes`);
            }

            this.memory.set(firmwareBin, 0); // Flash starts at offset 0 in our memory array

            // Initialize CPU state
            this.cpu.reset();
            this.cpu.setProgramCounter(FLASH_BASE); // Reset vector points to flash start

            console.log(`[ESP32-C3] Loaded ${firmwareBin.length} bytes firmware, mock CPU initialized`);

        } catch (error) {
            console.error('[ESP32-C3] Failed to initialize RISC-V core:', error);
            throw error;
        }
    }

    step(cycles: number): void {
        if (!this.cpu) return;

        try {
            // Execute RISC-V instructions for the specified number of cycles
            this.cpu.step(cycles);
        } catch (error) {
            console.error('[ESP32-C3] CPU execution error:', error);
            // Don't throw - just log and continue to avoid breaking the RAF loop
        }
    }

    setADCValue(channel: number, raw12bit: number): void {
        if (channel >= 0 && channel < 8) {
            this.adcResults[channel] = raw12bit & 0xFFF; // Ensure 12-bit value
        }
    }

    setGPIOInput(gpioNum: number, high: boolean): void {
        if (gpioNum >= 0 && gpioNum < 32) {
            if (high) {
                this.gpioInputs |= (1 << gpioNum);
            } else {
                this.gpioInputs &= ~(1 << gpioNum);
            }
        }
    }

    private handleMemoryWrite(address: number, value: number, size: number): void {
        // Handle peripheral register writes
        switch (address) {
            case UART0_TX_FIFO:
                // UART TX - send byte to serial output
                this.callbacks.onUARTByte(value & 0xFF);
                break;

            case GPIO_OUT:
                // Direct GPIO output register write
                this.updateGPIOOutputs(value);
                break;

            case GPIO_OUT_W1TS:
                // Write-1-to-set: set bits where value has 1s
                this.updateGPIOOutputs(this.gpioOutputs | value);
                break;

            case GPIO_OUT_W1TC:
                // Write-1-to-clear: clear bits where value has 1s
                this.updateGPIOOutputs(this.gpioOutputs & ~value);
                break;

            case GPIO_ENABLE:
                // GPIO output enable register
                this.gpioEnable = value;
                break;

            case I2C0_DATA:
                // I2C data register - buffer the byte
                this.i2cBuffer.push(value & 0xFF);
                break;

            case I2C0_CMD:
                // I2C command register - handle I2C transaction
                this.handleI2CCommand(value);
                break;

            default:
                // Regular memory write - delegate to backing memory
                this.writeMemory(address, value, size);
                break;
        }
    }

    private handleMemoryRead(address: number, size: number): number {
        // Handle peripheral register reads
        switch (address) {
            case GPIO_IN:
                // GPIO input register - return current input states
                return this.gpioInputs;

            case ADC_RESULT:
            case ADC_RESULT + 4:
            case ADC_RESULT + 8:
            case ADC_RESULT + 12:
            case ADC_RESULT + 16:
            case ADC_RESULT + 20:
            case ADC_RESULT + 24:
            case ADC_RESULT + 28:
                // ADC result registers - return 12-bit values
                const channel = (address - ADC_RESULT) / 4;
                return this.adcResults[channel] || 0;

            case UART0_STATUS:
                // UART status - always ready for TX
                return 0x01; // TX FIFO not full

            case I2C0_SR:
                // I2C status - always ready
                return 0x01;

            default:
                // Regular memory read
                return this.readMemory(address, size);
        }
    }

    private updateGPIOOutputs(newValue: number): void {
        const changed = this.gpioOutputs ^ newValue;
        this.gpioOutputs = newValue;

        // Notify listeners of changed pins
        for (let pin = 0; pin < 32; pin++) {
            if (changed & (1 << pin)) {
                const isHigh = !!(newValue & (1 << pin));
                this.callbacks.onGPIOOutput(pin, isHigh);
            }
        }
    }

    private handleI2CCommand(command: number): void {
        // Simplified I2C command handling
        // In real ESP32-C3, this would be more complex with proper state machine

        if (command & 0x01) { // START condition
            this.i2cInTransaction = true;
            if (this.i2cBuffer.length > 0) {
                // First byte after START is the address
                this.i2cAddress = this.i2cBuffer[0] >> 1; // Remove R/W bit
            }
        }

        if (command & 0x02) { // STOP condition
            if (this.i2cInTransaction && this.i2cBuffer.length > 1) {
                // Send buffered data to I2C slave
                const data = new Uint8Array(this.i2cBuffer.slice(1)); // Skip address byte
                this.callbacks.onI2CWrite(this.i2cAddress, data);
            }

            this.i2cInTransaction = false;
            this.i2cBuffer = [];
            this.i2cAddress = 0;
        }
    }

    private writeMemory(address: number, value: number, size: number): void {
        // Convert absolute address to memory array offset
        let offset: number;

        if (address >= FLASH_BASE && address < FLASH_BASE + FLASH_SIZE) {
            offset = address - FLASH_BASE;
        } else if (address >= SRAM_BASE && address < SRAM_BASE + SRAM_SIZE) {
            offset = FLASH_SIZE + (address - SRAM_BASE);
        } else {
            // Invalid address - ignore
            return;
        }

        // Write based on size
        switch (size) {
            case 1:
                this.memory[offset] = value & 0xFF;
                break;
            case 2:
                this.memory[offset] = value & 0xFF;
                this.memory[offset + 1] = (value >> 8) & 0xFF;
                break;
            case 4:
                this.memory[offset] = value & 0xFF;
                this.memory[offset + 1] = (value >> 8) & 0xFF;
                this.memory[offset + 2] = (value >> 16) & 0xFF;
                this.memory[offset + 3] = (value >> 24) & 0xFF;
                break;
        }
    }

    private readMemory(address: number, size: number): number {
        // Convert absolute address to memory array offset
        let offset: number;

        if (address >= FLASH_BASE && address < FLASH_BASE + FLASH_SIZE) {
            offset = address - FLASH_BASE;
        } else if (address >= SRAM_BASE && address < SRAM_BASE + SRAM_SIZE) {
            offset = FLASH_SIZE + (address - SRAM_BASE);
        } else {
            // Invalid address
            return 0;
        }

        // Read based on size
        switch (size) {
            case 1:
                return this.memory[offset];
            case 2:
                return this.memory[offset] | (this.memory[offset + 1] << 8);
            case 4:
                return this.memory[offset] |
                    (this.memory[offset + 1] << 8) |
                    (this.memory[offset + 2] << 16) |
                    (this.memory[offset + 3] << 24);
            default:
                return 0;
        }
    }
}