export const looksPreview = {
    say_text: (block) => {
        const text = block.getFieldValue("TEXT");
        // Pass active ID to Teddy's global handler
        if (window.say) window.say(window.activeSpriteId || "teddy", text);
    },

    show_sprite: () => {
        if (window.showSprite) window.showSprite();
        else if (window.setVisible) window.setVisible(window.activeSpriteId || "teddy", true);
    },

    hide_sprite: () => {
        if (window.hideSprite) window.hideSprite();
        else if (window.setVisible) window.setVisible(window.activeSpriteId || "teddy", false);
    },

    change_size: (block) => {
        const amt = Number(block.getFieldValue("AMOUNT"));
        if (window.changeSize) window.changeSize(window.activeSpriteId || "teddy", amt);
    },

    select_sprite: (block) => {
        const spriteName = block.getFieldValue("SPRITE");
        if (window.selectSprite) window.selectSprite(spriteName);
    }
};
