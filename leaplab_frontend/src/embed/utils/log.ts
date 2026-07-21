export const log = {
    app: (msg: string, data?: any) => console.log(`[APP] ${msg}`, data ?? ''),
    blockly: (msg: string, data?: any) => console.log(`[BLOCKLY] ${msg}`, data ?? ''),
    generator: (msg: string, data?: any) => console.log(`[GENERATOR] ${msg}`, data ?? ''),
};
