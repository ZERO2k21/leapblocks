export const moveRoboTutorial = {
    id: 'move_robo',
    title: 'Move the Robo',
    steps: [
        {
            title: "Let's Move!",
            content: "Let's make our Robot move forward. First, go to the yellow 'Events' category and drag a 'when green flag clicked' block.",
            targetId: "category-events",
            highlight: true
        },
        {
            title: "Motion Blocks",
            content: "Now, click on the blue 'Motion' category.",
            targetId: "category-motion",
            highlight: true
        },
        {
            title: "Move Block",
            content: "Drag the 'move right' or 'move forward' block and attach it under the yellow block.",
            targetId: "blocklyDiv",
            highlight: true
        },
        {
            title: "Test it out!",
            content: "Click the Green Flag above the stage to see your Robot move!",
            targetId: "green-flag-btn",
            highlight: true
        }
    ]
};
