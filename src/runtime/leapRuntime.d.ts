export interface LeapRuntime {
    isRunning: boolean;
    onShowVariable: ((name: string) => void) | null;
    onHideVariable: ((name: string) => void) | null;
    onShowList: ((name: string) => void) | null;
    onHideList: ((name: string) => void) | null;
    onShowTable: ((name: string) => void) | null;
    onHideTable: ((name: string) => void) | null;
    
    triggerFlag(): void;
    triggerClick(spriteId: string): void;
    executeBlock(block: any, spriteId: string): Promise<void>;
    syncSprite(spriteId: string, json: any): Promise<void>;
    loadProject(workspaces: Map<string, any>): void;
    stopAll(): void;
    flattenBlock(block: any): any;
}

export const leapRuntime: LeapRuntime;
export default leapRuntime;
