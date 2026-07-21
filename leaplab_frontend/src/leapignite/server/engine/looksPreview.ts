declare global {
    interface Window {
        say?: (spriteId: string, text: string) => void;
        showSprite?: () => void;
        hideSprite?: () => void;
        setVisible?: (spriteId: string, visible: boolean) => void;
        resetSize?: (spriteId: string) => void;
        changeSize?: (spriteId: string, amount: number) => void;
        setSize?: (spriteId: string, size: number) => void;
        nextCostume?: () => void;
        selectSprite?: (name: string) => void;
        activeSpriteId?: string;
    }
}

export const looksPreview: Record<string, (block: any) => void> = {
    say_text: (block) => {
        const text = block.getFieldValue("TEXT") || block.getFieldValue("MESSAGE") || "";
        if (window.say) window.say(window.activeSpriteId || "robot_default", text);
    },

    looks_say: (block) => {
        const msg = block.getFieldValue("MSG") || block.getFieldValue("MESSAGE") || "";
        if (window.say) window.say(window.activeSpriteId || "robot_default", msg);
    },

    show_sprite: () => {
        if (window.showSprite) window.showSprite();
        else if (window.setVisible) window.setVisible(window.activeSpriteId || "robot_default", true);
    },

    hide_sprite: () => {
        if (window.hideSprite) window.hideSprite();
        else if (window.setVisible) window.setVisible(window.activeSpriteId || "robot_default", false);
    },

    change_size: (block) => {
        const rawAmount = block.getFieldValue("AMOUNT");
        if (rawAmount === "reset") {
            if (window.resetSize) window.resetSize(window.activeSpriteId || "robot_default");
            return;
        }

        const amt = Number(rawAmount);
        if (window.changeSize) window.changeSize(window.activeSpriteId || "robot_default", amt);
    },

    set_size: (block) => {
        const size = Number(block.getFieldValue("SIZE")) || 100;
        if (window.setSize) window.setSize(window.activeSpriteId || "robot_default", size);
    },

    junior_change_costume: () => {
        if (window.nextCostume) window.nextCostume();
    },

    looks_next_costume: () => {
        if (window.nextCostume) window.nextCostume();
    },

    select_sprite: (block) => {
        const spriteName = block.getFieldValue("SPRITE");
        if (window.selectSprite) window.selectSprite(spriteName);
    }
};
