/**
 * Safely registers a custom element, guarding against double-registration
 * that occurs during Vite HMR (hot module replacement) in development.
 *
 * Usage:
 *   safeDefine('leap-my-element', MyElement);
 *
 * instead of:
 *   @customElement('leap-my-element')
 */
export function safeDefine(
    tagName: string,
    constructor: CustomElementConstructor,
): void {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, constructor);
    }
}
