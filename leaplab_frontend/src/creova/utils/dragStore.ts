let store: { type: string; data: string } | null = null;

export function setDraggedComponent(type: string, data: string) {
  store = { type, data };
}

export function getDraggedComponent() {
  const s = store;
  store = null;
  return s;
}

export function clearDraggedComponent() {
  store = null;
}
