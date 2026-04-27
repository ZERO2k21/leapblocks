/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from './runtime';

let _registered = false;

export function registerPictoBloxCategory(): void {
    if (_registered) return;
    _registered = true;

    /**
style Category with circular icons and vertical layout
     */
    class PictoBloxCategory extends Blockly.ToolboxCategory {
        private customIconDom_: HTMLElement | null = null;

        /**
         * Override init to ensure icon is appended after DOM is ready
         */
        override init(): void {
            super.init();

            // After base init, manually add our custom icon
            if (this.rowContents_) {
                // Create and insert the icon at the BEGINNING of rowContents
                this.customIconDom_ = this.createCustomIcon();
                this.rowContents_.insertBefore(this.customIconDom_, this.rowContents_.firstChild);
                console.log('[PictoBloxCategory] Custom icon inserted for:', this.getName());
            }
        }

        /**
         * Create a custom circular icon with emoji
         */
        private createCustomIcon(): HTMLElement {
            const iconDiv = document.createElement('div');
            iconDiv.classList.add('pictoblox-icon');

            const name = this.getName().toLowerCase();
            const emoji = this.getEmojiForCategory(name);
            iconDiv.textContent = emoji;

            // Apply all styles inline - compact size for narrow toolbox
            iconDiv.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: ${this.colour_ || '#ccc'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                flex-shrink: 0;
            `;

            return iconDiv;
        }

        /**
         * Get emoji for category name
         */
        private getEmojiForCategory(name: string): string {
            const emojiMap: { [key: string]: string } = {
                'events': '⚡',
                'control': '🔁',
                'operators': '➕',
                'variables': '📊',
                'arduino': '🔌',
                'serial': '📡',
                'actuators': '⚙️',
                'sensors': '🌡️',
                // Animation categories
                'motion': '➡️',
                'looks': '👁️',
                'sound': '🔊',
                'sensing': '🔍',
                'my blocks': '🧩',
                'more blocks': '➕',
                // Hardware category (Upload mode)
                'hardware': '🔧',
            };
            return emojiMap[name] || '📦';
        }

        /**
         * Override addColourBorder_ to remove default border
         */
        protected override addColourBorder_(colour: string): void {
            // Remove default left border
            if (this.rowDiv_) {
                this.rowDiv_.style.borderLeft = 'none';
                this.rowDiv_.style.paddingLeft = '0';
            }
            // Update custom icon color if it exists
            if (this.customIconDom_) {
                this.customIconDom_.style.backgroundColor = colour;
            }
        }

        /**
         * Override setSelected
         */
        override setSelected(isSelected: boolean): void {
            if (this.rowDiv_) {
                this.rowDiv_.style.backgroundColor = isSelected ? 'rgba(0,0,0,0.06)' : 'transparent';
            }
            Blockly.utils.aria.setState(
                this.htmlDiv_ as Element,
                Blockly.utils.aria.State.SELECTED,
                isSelected
            );
        }
    }

    // Register as 'pictobloxCategory'
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        'pictobloxCategory',
        PictoBloxCategory,
        true
    );

    console.log('[CUSTOM-TOOLBOX] PictoBloxCategory registered');
}
