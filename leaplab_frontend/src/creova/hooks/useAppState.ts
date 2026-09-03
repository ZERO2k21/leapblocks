/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useCallback, useMemo, useState } from 'react';
import { defaultPropsFor } from '../data/defaultProperties';
import { PALETTE_ENHANCED } from '../data/paletteComponents_Enhanced';

export interface DesignViewport {
  width: number;
  height: number;
  deviceType: string;
  orientation: string;
}

export interface ComponentNode {
  id: string;
  type: string;
  icon?: string;
  visible: boolean;
  children?: ComponentNode[];
  props: Record<string, any>;
}

export interface Screen {
  id: string;
  title: string;
  backgroundColor: string;
  backgroundImage: string;
  alignHorizontal: string;
  alignVertical: string;
  components: ComponentNode[];
  nonVisibleComponents: ComponentNode[];
  aboutScreen?: string;
  showStatusBar?: boolean;
  titleVisible?: boolean;
  screenOrientation?: string;
  theme?: string;
}

export interface MediaItem {
  filename: string;
  [key: string]: any;
}

export interface AddComponentOptions {
  visible?: boolean;
  parentId?: string | null;
}

export interface ProjectData {
  schemaVersion?: number;
  appName?: string;
  packageName?: string;
  versionCode?: number;
  versionName?: string;
  screens?: Screen[];
  activeScreen?: string;
  blockLogic?: string;
  media?: MediaItem[];
  designViewport?: DesignViewport;
}

export type MovePosition = 'inside' | 'before' | 'after';

export interface ComponentMeta {
  type: string;
  label?: string;
  icon?: string;
  category?: string;
  visible?: boolean;
  description?: string;
}

const COMPONENT_META = new Map<string, ComponentMeta>(PALETTE_ENHANCED.map(item => [item.type, item]));
const ARRANGEMENT_TYPES = new Set([
  'HorizontalArrangement',
  'HorizontalScrollArrangement',
  'VerticalArrangement',
  'VerticalScrollArrangement',
  'TableArrangement',
  'AbsoluteArrangement',
  'Map',
  'FeatureCollection'
]);
const CANVAS_CHILD_TYPES = new Set(['Ball', 'ImageSprite']);
const MAP_CHILD_TYPES = new Set(['Marker', 'LineString', 'Polygon', 'Rectangle', 'Circle', 'FeatureCollection']);
const DEFAULT_DESIGN_VIEWPORT: DesignViewport = { width: 412, height: 915, deviceType: 'phone', orientation: 'portrait' };

const makeScreen = (id: string): Screen => ({
  id,
  title: id,
  backgroundColor: '#ffffff',
  backgroundImage: '',
  alignHorizontal: 'Left',
  alignVertical: 'Top',
  components: [],
  nonVisibleComponents: []
});

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const getKeyVariants = (key: string): string[] => {
  const lower = key.toLowerCase();
  const cap = key.charAt(0).toUpperCase() + key.slice(1);
  return [key, lower, cap];
};

const setPropNormalized = (props: Record<string, any>, key: string, value: any): Record<string, any> => {
  const next = { ...props };
  const lower = key.toLowerCase();
  for (const existingKey of Object.keys(next)) {
    if (existingKey.toLowerCase() === lower && existingKey !== key) {
      delete next[existingKey];
    }
  }
  next[key] = value;
  return next;
};

const findNodeById = (list: ComponentNode[], id: string | null): ComponentNode | null => {
  if (!id) return null;
  for (const node of list) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

interface NodeAndParentResult {
  node: ComponentNode;
  parent: ComponentNode | null;
  list: ComponentNode[];
  index: number;
}

const findNodeAndParent = (list: ComponentNode[], id: string, parent: ComponentNode | null = null): NodeAndParentResult | null => {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.id === id) {
      return { node: item, parent, list, index: i };
    }
    if (item.children?.length) {
      const found = findNodeAndParent(item.children, id, item);
      if (found) return found;
    }
  }
  return null;
};

const walkTree = (list: ComponentNode[], visitor: (item: ComponentNode) => void): void => {
  for (const item of list) {
    visitor(item);
    if (item.children?.length) walkTree(item.children, visitor);
  }
};

const updateNodeById = (list: ComponentNode[], id: string, updater: (comp: ComponentNode) => ComponentNode): ComponentNode[] =>
  list.map(item => {
    if (item.id === id) return updater(item);
    if (item.children?.length) {
      return { ...item, children: updateNodeById(item.children, id, updater) };
    }
    return item;
  });

const removeNodeById = (list: ComponentNode[], id: string): ComponentNode[] =>
  list
    .filter(item => item.id !== id)
    .map(item => item.children?.length ? { ...item, children: removeNodeById(item.children, id) } : item);

const insertIntoContainer = (list: ComponentNode[], containerId: string, node: ComponentNode): ComponentNode[] =>
  list.map(item => {
    if (item.id === containerId) {
      return { ...item, children: [...(item.children || []), node] };
    }
    if (item.children?.length) {
      return { ...item, children: insertIntoContainer(item.children, containerId, node) };
    }
    return item;
  });

const isInTree = (list: ComponentNode[], id: string | null): boolean => !!findNodeById(list, id);

const replaceIdInBlockXml = (xml: string, oldId: string, newId: string): string => {
  if (!xml || !oldId || !newId || oldId === newId) return xml;
  const escapedOld = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return xml.replace(new RegExp(`\\b${escapedOld}\\b`, 'g'), newId);
};

export function useAppState() {
  const [screens, setScreens] = useState<Screen[]>([makeScreen('Screen1')]);
  const [activeScreen, setActiveScreen] = useState<string>('Screen1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('MyApp');
  const [packageName, setPackageName] = useState<string>('com.leapblocks.myapp');
  const [blockLogic, setBlockLogic] = useState<string>(''); // XML canonical source
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [designViewport, setDesignViewport] = useState<DesignViewport>(DEFAULT_DESIGN_VIEWPORT);

  const getCurrentScreen = (stateScreens: Screen[]): Screen =>
    stateScreens.find(s => s.id === activeScreen) || stateScreens[0] || makeScreen('Screen1');

  const getNextComponentName = useCallback((stateScreens: Screen[], type: string): string => {
    const screen = getCurrentScreen(stateScreens);
    const allIds: string[] = [];
    walkTree(screen.components, comp => allIds.push(comp.id));
    screen.nonVisibleComponents.forEach(comp => allIds.push(comp.id));

    let idx = 1;
    while (allIds.includes(`${type}${idx}`)) idx += 1;
    return `${type}${idx}`;
  }, [activeScreen]);

  const addComponent = useCallback((type: string, options: AddComponentOptions = {}): Promise<void> => new Promise((resolve) => {
    const meta: ComponentMeta = COMPONENT_META.get(type) || { type };
    const visible = options.visible ?? meta.visible ?? true;
    const parentIdOverride = options.parentId || null;
    let addedId: string | null = null;

    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;

      const newId = getNextComponentName(prevScreens, type);
      addedId = newId;
      const defaultProps = defaultPropsFor(type);
      const newComponent: ComponentNode = {
        id: newId,
        type,
        icon: meta.icon,
        visible,
        children: ARRANGEMENT_TYPES.has(type) ? [] : undefined,
        props: defaultProps
      };

      const targetParentId = parentIdOverride || selectedId;
      const selectedParent = screen.components && isInTree(screen.components, targetParentId)
        ? findNodeById(screen.components, targetParentId)
        : null;
      const canNestInArrangement = visible && selectedParent && ARRANGEMENT_TYPES.has(selectedParent.type) && selectedParent.type !== 'Map' && selectedParent.type !== 'FeatureCollection';
      const canNestInCanvas = selectedParent?.type === 'Canvas' && CANVAS_CHILD_TYPES.has(type);
      const canNestInMap = visible && selectedParent && (selectedParent.type === 'Map' || selectedParent.type === 'FeatureCollection') && MAP_CHILD_TYPES.has(type);

      const nextScreen = deepClone(screen);

      if (!visible) {
        nextScreen.nonVisibleComponents.push(newComponent);
      } else if (canNestInArrangement && selectedParent) {
        nextScreen.components = insertIntoContainer(nextScreen.components, selectedParent.id, newComponent);
      } else if (canNestInCanvas && selectedParent) {
        nextScreen.components = insertIntoContainer(nextScreen.components, selectedParent.id, newComponent);
      } else if (canNestInMap && selectedParent) {
        nextScreen.components = insertIntoContainer(nextScreen.components, selectedParent.id, newComponent);
      } else {
        nextScreen.components.push(newComponent);
      }

      return nextScreen;
    }));
    if (addedId) setSelectedId(addedId);
    resolve();
  }), [activeScreen, selectedId, getNextComponentName]);

  const updateProp = useCallback((id: string, key: string, value: any): Promise<void> => new Promise((resolve) => {
    let titleRename: { oldId: string; newId: string } | null = null;
    setScreens(prevScreens => prevScreens.map(screen => {
      // Screen-level prop: match any screen by id (not just active)
      if (id === screen.id) {
        const next = deepClone(screen);
        if (key === 'AboutScreen') next.aboutScreen = value;
        else if (key === 'BackgroundColor') next.backgroundColor = value;
        else if (key === 'BackgroundImage') next.backgroundImage = value;
        else if (key === 'AlignHorizontal') next.alignHorizontal = value;
        else if (key === 'AlignVertical') next.alignVertical = value;
        else if (key === 'ShowStatusBar') next.showStatusBar = value;
        else if (key === 'Title') {
          next.title = value;
          const trimmed = (value ?? '').toString().trim();
          if (trimmed && trimmed !== screen.id && /^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed) && !prevScreens.some(s => s.id === trimmed)) {
            titleRename = { oldId: screen.id, newId: trimmed };
            next.id = trimmed;
          }
        } else if (key === 'TitleVisible') next.titleVisible = value;
        else if (key === 'ScreenOrientation') next.screenOrientation = value;
        else if (key === 'Theme') next.theme = value;
        else if (key === 'AppName') {
          setAppName(value);
        }
        return next;
      }
      if (screen.id !== activeScreen) return screen;
      const next = deepClone(screen);

      if (isInTree(next.components, id)) {
        next.components = updateNodeById(next.components, id, comp => ({
          ...comp,
          props: setPropNormalized(comp.props || {}, key, value)
        }));
      } else {
        next.nonVisibleComponents = next.nonVisibleComponents.map(comp =>
          comp.id === id
            ? { ...comp, props: setPropNormalized(comp.props || {}, key, value) }
            : comp
        );
      }

      return next;
    }));
    if (titleRename) {
      const tr = titleRename;
      setActiveScreen(prev => prev === tr.oldId ? tr.newId : prev);
      setSelectedId(prev => prev === tr.oldId ? tr.newId : prev);
      setBlockLogic(prev => replaceIdInBlockXml(prev, tr.oldId, tr.newId));
    }
    resolve();
  }), [activeScreen]);

  const removeComponent = useCallback((id: string): Promise<void> => new Promise((resolve) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;
      const next = deepClone(screen);
      next.components = removeNodeById(next.components, id);
      next.nonVisibleComponents = next.nonVisibleComponents.filter(c => c.id !== id);
      return next;
    }));

    if (selectedId === id) setSelectedId(null);
    resolve();
  }), [activeScreen, selectedId]);

  const moveComponent = useCallback((draggedId: string, targetId: string, position: MovePosition = 'after'): Promise<void> => new Promise((resolve) => {
    if (draggedId === targetId) { resolve(); return; }

    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;
      const nextScreen = deepClone(screen);

      // 1. Find the dragged node and its parent list
      const draggedInfo = findNodeAndParent(nextScreen.components, draggedId);
      if (!draggedInfo) return screen; // Dragged node not found in visible components

      const draggedNode = draggedInfo.node;

      // Prevent dragging a component into its own children
      if (draggedNode.children && isInTree(draggedNode.children, targetId)) {
        return screen;
      }

      // 2. Remove dragged node from its current list
      draggedInfo.list.splice(draggedInfo.index, 1);

      // 3. If targetId is the Screen itself, drop it at the end of the Screen's root level
      if (targetId === screen.id) {
        nextScreen.components.push(draggedNode);
        return nextScreen;
      }

      // 4. Find the target node in the modified tree
      const targetInfo = findNodeAndParent(nextScreen.components, targetId);
      if (!targetInfo) {
        // Target not found (might have been deleted or invalid), put it back at root of screen
        nextScreen.components.push(draggedNode);
        return nextScreen;
      }

      const { list: targetList, index: targetIndex } = targetInfo;

      if (position === 'inside' && ARRANGEMENT_TYPES.has(targetInfo.node.type)) {
        if (!targetInfo.node.children) {
          targetInfo.node.children = [];
        }
        targetInfo.node.children.push(draggedNode);
      } else if (position === 'before') {
        targetList.splice(targetIndex, 0, draggedNode);
      } else {
        targetList.splice(targetIndex + 1, 0, draggedNode);
      }

      return nextScreen;
    }));
    resolve();
  }), [activeScreen]);

  const addScreen = useCallback((name: string): Promise<void> => new Promise((resolve) => {
    const trimmed = name?.trim();
    if (!trimmed) { resolve(); return; }
    setScreens(prev => {
      if (prev.find(s => s.id === trimmed)) return prev;
      return [...prev, makeScreen(trimmed)];
    });
    setActiveScreen(trimmed);
    setSelectedId(null);
    resolve();
  }), []);

  const deleteScreen = useCallback((name: string): Promise<void> => new Promise((resolve) => {
    const trimmed = name?.trim();
    if (!trimmed || trimmed === 'Screen1') { resolve(); return; }
    setScreens(prev => {
      const nextScreens = prev.filter(s => s.id !== trimmed);
      if (activeScreen === trimmed) {
        setActiveScreen(nextScreens[0]?.id || 'Screen1');
      }
      return nextScreens;
    });
    setSelectedId(null);
    resolve();
  }), [activeScreen]);

  const renameScreen = useCallback((oldId: string, newId: string): Promise<void> => new Promise((resolve) => {
    const trimmedOld = oldId?.trim();
    const trimmedNew = newId?.trim();
    if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) { resolve(); return; }
    let didRename = false;
    setScreens(prev => {
      if (prev.some(s => s.id === trimmedNew)) return prev;
      const exists = prev.find(s => s.id === trimmedOld);
      if (!exists) return prev;
      didRename = true;
      return prev.map(s => {
        if (s.id !== trimmedOld) return s;
        const next = deepClone(s);
        next.id = trimmedNew;
        if (next.title === trimmedOld || !next.title) next.title = trimmedNew;
        return next;
      });
    });
    // Defer check to next tick since didRename is set synchronously inside updater
    setTimeout(() => {
      if (didRename) {
        setActiveScreen(prev => prev === trimmedOld ? trimmedNew : prev);
        setSelectedId(prev => prev === trimmedOld ? trimmedNew : prev);
        setBlockLogic(prev => replaceIdInBlockXml(prev, trimmedOld, trimmedNew));
      }
      resolve();
    }, 0);
  }), []);

  const renameComponent = useCallback((oldId: string, newId: string): Promise<void> => new Promise((resolve) => {
    if (!oldId || !newId || oldId === newId) { resolve(); return; }

    // If oldId is a screen id, delegate to renameScreen
    // Use functional check via setScreens snapshot: we need to know if it's a screen
    // We check via current screens state captured in closure (add screens to deps for freshness)
    // To avoid stale, we handle both cases inside setScreens
    let isScreenRename = false;
    setScreens(prevScreens => {
      const isScreen = prevScreens.some(s => s.id === oldId);
      if (isScreen) {
        isScreenRename = true;
        if (prevScreens.some(s => s.id === newId)) return prevScreens;
        return prevScreens.map(s => {
          if (s.id !== oldId) return s;
          const next = deepClone(s);
          next.id = newId;
          if (next.title === oldId || !next.title) next.title = newId;
          return next;
        });
      }
      // Component rename: only active screen
      return prevScreens.map(screen => {
        if (screen.id !== activeScreen) return screen;
        const next = deepClone(screen);
        if (isInTree(next.components, oldId)) {
          next.components = updateNodeById(next.components, oldId, comp => ({ ...comp, id: newId }));
        } else {
          next.nonVisibleComponents = next.nonVisibleComponents.map(comp =>
            comp.id === oldId ? { ...comp, id: newId } : comp
          );
        }
        return next;
      });
    });

    // Defer active/selected/block updates to next tick to ensure isScreenRename is set
    // Use timeout 0 to run after setScreens callback
    setTimeout(() => {
      if (isScreenRename) {
        setActiveScreen(prev => prev === oldId ? newId : prev);
        setSelectedId(prev => prev === oldId ? newId : prev);
      } else {
        if (selectedId === oldId) setSelectedId(newId);
      }
      setBlockLogic(prev => replaceIdInBlockXml(prev, oldId, newId));
      resolve();
    }, 0);
  }), [activeScreen, selectedId, renameScreen]);

  const addMedia = useCallback((mediaItem: MediaItem): Promise<void> => new Promise((resolve) => {
    setMedia(prev => [...prev, mediaItem]);
    resolve();
  }), []);

  const deleteMedia = useCallback((filename: string): Promise<void> => new Promise((resolve) => {
    setMedia(prev => prev.filter(item => item.filename !== filename));
    resolve();
  }), []);

  const loadProject = useCallback((projectData: ProjectData): Promise<void> => new Promise((resolve) => {
    if (!projectData) { resolve(); return; }
    if (projectData.screens) setScreens(projectData.screens);
    if (projectData.screens?.[0]?.id) {
      setActiveScreen(projectData.screens.find(s => s.id === projectData.activeScreen)?.id || projectData.screens[0].id);
    } else {
      setActiveScreen('Screen1');
    }
    if (projectData.appName) setAppName(projectData.appName);
    if (projectData.packageName) setPackageName(projectData.packageName);
    if (projectData.blockLogic !== undefined) setBlockLogic(projectData.blockLogic);
    if (projectData.media) setMedia(projectData.media || []);
    setDesignViewport(projectData.designViewport || DEFAULT_DESIGN_VIEWPORT);
    setSelectedId(null);
    resolve();
  }), []);

  const newProject = useCallback((): Promise<void> => new Promise((resolve) => {
    setScreens([makeScreen('Screen1')]);
    setActiveScreen('Screen1');
    setSelectedId(null);
    setAppName('MyApp');
    setPackageName('com.leapblocks.myapp');
    setBlockLogic('');
    setMedia([]);
    setDesignViewport(DEFAULT_DESIGN_VIEWPORT);
    resolve();
  }), []);

  const currentScreen = useMemo(() => getCurrentScreen(screens), [screens, activeScreen]);

  const selectedComponent = useMemo(() => {
    if (!currentScreen || !selectedId) return null;
    if (selectedId === currentScreen.id) {
      return {
        id: currentScreen.id,
        type: 'Screen',
        props: {
          AboutScreen: currentScreen.aboutScreen || '',
          AlignHorizontal: currentScreen.alignHorizontal || 'Left',
          AlignVertical: currentScreen.alignVertical || 'Top',
          ScreenOrientation: currentScreen.screenOrientation || 'Unspecified',
          AppName: appName,
          BackgroundColor: currentScreen.backgroundColor || '#ffffff',
          BackgroundImage: currentScreen.backgroundImage || '',
          Title: currentScreen.title || currentScreen.id,
          ShowStatusBar: currentScreen.showStatusBar !== false,
          TitleVisible: currentScreen.titleVisible !== false
        }
      };
    }
    const visibleComp = findNodeById(currentScreen.components || [], selectedId);
    if (visibleComp) return visibleComp;
    return currentScreen.nonVisibleComponents?.find(c => c.id === selectedId) || null;
  }, [currentScreen, selectedId, appName]);

  const getSerializedState = useCallback((): ProjectData => ({
    schemaVersion: 2,
    appName,
    packageName,
    versionCode: 1,
    versionName: '1.0',
    screens,
    blockLogic,
    media,
    designViewport
  }), [appName, packageName, screens, blockLogic, media, designViewport]);

  const selectComponent = useCallback((id: string | null) => setSelectedId(id), []);
  const deleteComponent = useCallback((id: string) => removeComponent(id), [removeComponent]);

  return useMemo(() => ({
    screens,
    activeScreen,
    selectedId,
    appName,
    packageName,
    blockLogic,
    media,
    designViewport,
    currentScreen,
    selectedComponent,
    addComponent,
    updateProp,
    removeComponent,
    addScreen,
    deleteScreen,
    renameScreen,
    setActiveScreen,
    setSelectedId,
    setAppName,
    setPackageName,
    setBlockLogic,
    setDesignViewport,
    getSerializedState,
    selectComponent,
    deleteComponent,
    renameComponent,
    addMedia,
    deleteMedia,
    getNextComponentName,
    loadProject,
    newProject,
    moveComponent,
    isArrangementType: (type: string) => ARRANGEMENT_TYPES.has(type),
    getComponentVisibility: (type: string) => (COMPONENT_META.get(type)?.visible ?? true)
  }), [
    screens,
    activeScreen,
    selectedId,
    appName,
    packageName,
    blockLogic,
    media,
    designViewport,
    currentScreen,
    selectedComponent,
    addComponent,
    updateProp,
    removeComponent,
    addScreen,
    deleteScreen,
    renameScreen,
    renameComponent,
    addMedia,
    deleteMedia,
    getNextComponentName,
    loadProject,
    newProject,
    moveComponent,
    getSerializedState,
    selectComponent,
    deleteComponent
  ]);
}
