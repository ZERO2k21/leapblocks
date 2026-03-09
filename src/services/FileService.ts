export type SessionMode = 'junior' | 'intermediate' | 'python' | 'advanced_blocks' | 'creocad' | 'app_game_dev';

export interface ProjectData {
    version: string;
    projectName: string;
    mode: SessionMode;
    timestamp: number;
    [key: string]: any;
}

const MODE_NAMES: Record<SessionMode, string> = {
    junior: 'Junior Blocks',
    intermediate: 'Intermediate Blocks',
    python: 'Python IDE',
    advanced_blocks: 'Advanced Blocks',
    creocad: 'CreoCAD',
    app_game_dev: 'App & Game Development'
};

class FileService {
    saveProject(projectName: string, mode: SessionMode, payload: any): void {
        const projectData: ProjectData = {
            version: '1.0',
            projectName,
            mode,
            timestamp: Date.now(),
            ...payload
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/\s+/g, '_')}.leap`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async loadProject(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    resolve(data);
                } catch (err) {
                    reject(new Error('Invalid project file format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    validateProject(data: any, expectedMode: SessionMode): { isValid: boolean; error?: string } {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Invalid project data' };
        }

        const projectMode = data.mode as SessionMode;

        if (!projectMode) {
            // Fallback for legacy files without mode field
            if (data.scenes) return this.checkMode('junior', expectedMode);
            if (data.sprites && data.workspaces) return this.checkMode('intermediate', expectedMode);
            return { isValid: false, error: 'This file does not appear to be a valid LeapBlocks project.' };
        }

        return this.checkMode(projectMode, expectedMode);
    }

    private checkMode(actualMode: SessionMode, expectedMode: SessionMode): { isValid: boolean; error?: string } {
        if (actualMode === expectedMode) {
            return { isValid: true };
        }

        const actualName = MODE_NAMES[actualMode] || actualMode;
        const expectedName = MODE_NAMES[expectedMode] || expectedMode;

        return {
            isValid: false,
            error: `This looks like a ${actualName} project. Please open it in the ${actualName} session instead of ${expectedName}.`
        };
    }
}

export const fileService = new FileService();
