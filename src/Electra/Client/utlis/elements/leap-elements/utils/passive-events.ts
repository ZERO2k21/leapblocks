/**
 * Utility to add passive touch event listeners.
 * Passive listeners improve scroll performance by telling the browser
 * the handler won't call preventDefault().
 *
 * NOTE: Only use for handlers that do NOT call event.preventDefault().
 */

/**
 * Adds passive touch event listeners to an element.
 * Call in firstUpdated() or connectedCallback().
 */
export function addPassiveTouchListeners(
  element: Element | null | undefined,
  handlers: {
    touchstart?: EventListenerOrEventListenerObject;
    touchmove?: EventListenerOrEventListenerObject;
    touchend?: EventListenerOrEventListenerObject;
  },
): () => void {
  if (!element) return () => {};

  const entries = Object.entries(handlers) as [string, EventListenerOrEventListenerObject][];
  for (const [event, handler] of entries) {
    element.addEventListener(event, handler, { passive: true });
  }

  return () => {
    for (const [event, handler] of entries) {
      element.removeEventListener(event, handler);
    }
  };
}
