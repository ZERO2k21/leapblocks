import { spriteManager } from './SpriteManager';
import { stageManager } from './StageManager';

class ProjectManager {
    saveProject(): string {
        const project = {
            stage: {
                currentBackdropIndex: (stageManager as any).currentBackdropIndex, // Accessing private for serialization
                backdrops: stageManager.getAllBackdrops().map(b => ({
                    name: b.name,
                    src: b.src
                }))
            },
            sprites: spriteManager.getAllSprites().map(sprite => {
                const state = sprite.getState();
                return {
                    id: state.id,
                    name: state.name,
                    spriteType: state.spriteType,
                    x: state.x,
                    y: state.y,
                    direction: state.direction,
                    size: state.size,
                    visible: state.visible,
                    currentCostumeIndex: state.currentCostumeIndex,
                    costumes: state.costumes.map(c => ({
                        name: c.name,
                        src: c.image.src // Costume image source (base64 or URL)
                    })),
                    scripts: state.scripts
                };
            })
        };

        const json = JSON.stringify(project, null, 2);
        console.log('[ProjectManager] Project serialized');
        return json;
    }

    async loadProject(json: string): Promise<void> {
        try {
            const project = JSON.parse(json);
            console.log('[ProjectManager] Loading project...', project);

            // 1. Clear current state
            spriteManager.clear();

            // 2. Load Stage
            if (project.stage) {
                // Clear existing backdrops if needed, or just add new ones
                // For simplicity, we'll assume the manager is fresh or we reset it
                for (const b of project.stage.backdrops) {
                    await stageManager.addBackdrop(b.name, b.src);
                }
                stageManager.setBackdrop(project.stage.currentBackdropIndex || 0);
            }

            // 3. Load Sprites
            if (project.sprites) {
                for (const s of project.sprites) {
                    const sprite = (spriteManager as any).createSprite(s.id, s.name, s.spriteType);
                    // Note: We might need a factory method in SpriteManager
                    sprite.setX(s.x);
                    sprite.setY(s.y);
                    sprite.pointInDirection(s.direction);
                    sprite.setSize(s.size);
                    if (!s.visible) sprite.hide();

                    for (const c of s.costumes) {
                        await sprite.addCostume(c.name, c.src);
                    }
                    sprite.switchCostume(s.currentCostumeIndex || 0);
                    sprite.setScripts(s.scripts || []);

                    spriteManager.addSprite(sprite);
                }
            }

            console.log('[ProjectManager] Project loaded successfully');
        } catch (error) {
            console.error('[ProjectManager] Failed to load project:', error);
            throw error;
        }
    }

    downloadProject(filename: string = 'project.lbproject') {
        const data = this.saveProject();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

let _projectManager: ProjectManager | null = null;
export function getProjectManager(): ProjectManager {
    if (!_projectManager) _projectManager = new ProjectManager();
    return _projectManager;
}
export const projectManager: ProjectManager = new Proxy({} as ProjectManager, {
    get(_target, prop) {
        const instance = getProjectManager();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getProjectManager() as any)[prop] = value; return true; }
});
export default projectManager;
