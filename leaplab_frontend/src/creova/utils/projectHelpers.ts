export interface ComponentNode {
  id: string;
  type?: string;
  children?: ComponentNode[];
  [key: string]: any;
}

export interface ScreenNode {
  id: string;
  components?: ComponentNode[];
  nonVisibleComponents?: ComponentNode[];
  [key: string]: any;
}

export interface ProjectPayload {
  screens?: ScreenNode[];
  activeScreen?: string;
  [key: string]: any;
}

export function countVisibleComponents(screens: ScreenNode[] = []): number {
  let count = 0;
  const walk = (components: ComponentNode[] = []) => {
    components.forEach((component) => {
      count += 1;
      if (component.children?.length) walk(component.children);
    });
  };
  screens.forEach((screen) => walk(screen.components || []));
  return count;
}

function flattenVisible(list: ComponentNode[] = []): ComponentNode[] {
  return list.flatMap((item) => [item, ...(item.children ? flattenVisible(item.children) : [])]);
}

export interface BlocklyContext {
  currentScreen?: ScreenNode;
  components: ComponentNode[];
}

export function buildBlocklyContextFromPayload(payload?: ProjectPayload): BlocklyContext {
  const screens = payload?.screens || [];
  const activeScreenId = payload?.activeScreen || screens[0]?.id;
  const currentScreen = screens.find((s) => s.id === activeScreenId) || screens[0];
  const components: ComponentNode[] = [
    ...flattenVisible(currentScreen?.components || []),
    ...(currentScreen?.nonVisibleComponents || [])
  ];
  return { currentScreen, components };
}
