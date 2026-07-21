interface GoalTarget {
    x: number;
    y: number;
    tolerance: number;
}

interface LessonGoal {
    type: string;
    target: GoalTarget;
    description: string;
}

interface LessonPanels {
    palette: boolean;
    workspace: boolean;
    stage: boolean;
    controls: boolean;
}

interface LessonConstraints {
    allowSpriteAdd?: boolean;
    allowSceneChange?: boolean;
    allowResize?: boolean;
    maxSprites?: number;
}

interface LessonHardware {
    allowed: boolean;
}

interface LessonConfigData {
    maxBlocks: number;
    allowedShapes: string[];
    panels: LessonPanels;
    constraints: LessonConstraints;
    goal: LessonGoal | null;
    juniorMode?: boolean;
    hardware?: LessonHardware;
}

interface Lesson {
    id: string;
    name: string;
    config: LessonConfigData;
}

export const DefaultLesson: Lesson = {
    id: "free_play",
    name: "Free Play",
    config: {
        maxBlocks: 100,
        allowedShapes: ["stack", "hat", "c-block", "cap"],
        panels: {
            palette: true,
            workspace: true,
            stage: true,
            controls: true
        },
        constraints: {
            allowSpriteAdd: true,
            allowSceneChange: true
        },
        goal: null
    }
};

export const JuniorBeginnerLesson: Lesson = {
    id: "level_1",
    name: "Reach the Star",
    config: {
        maxBlocks: 6,
        allowedShapes: ["stack", "hat"],
        panels: {
            palette: true,
            workspace: true,
            stage: true,
            controls: true
        },
        constraints: {
            allowSpriteAdd: false,
            allowSceneChange: false,
            allowResize: false,
            maxSprites: 1
        },
        goal: {
            type: "reach_target",
            target: { x: 400, y: 150, tolerance: 50 },
            description: "Make the bear reach the right side!"
        },
        juniorMode: true,
        hardware: {
            allowed: false
        }
    }
};

let currentConfig: LessonConfigData = DefaultLesson.config;

export const getLessonConfig = (): LessonConfigData => currentConfig;

export const setLessonMode = (mode: string): LessonConfigData => {
    if (mode === "beginner") currentConfig = JuniorBeginnerLesson.config;
    else currentConfig = DefaultLesson.config;
    return currentConfig;
};
