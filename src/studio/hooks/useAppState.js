/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useMemo, useState } from 'react';
import { defaultPropsFor } from '../data/defaultProperties';
import { PALETTE_ENHANCED } from '../data/paletteComponents_Enhanced';

const COMPONENT_META = new Map(PALETTE_ENHANCED.map(item => [item.type, item]));
const ARRANGEMENT_TYPES = new Set([
  'HorizontalArrangement',
  'HorizontalScrollArrangement',
  'VerticalArrangement',
  'VerticalScrollArrangement',
  'TableArrangement'
]);
const CANVAS_CHILD_TYPES = new Set(['Ball', 'ImageSprite']);

const makeScreen = (id) => ({ id, title: id, components: [], nonVisibleComponents: [] });

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const getKeyVariants = (key) => {
  const lower = key.toLowerCase();
  const cap = key.charAt(0).toUpperCase() + key.slice(1);
  return [key, lower, cap];
};

const getProp = (props, key, fallback = undefined) => {
  for (const candidate of getKeyVariants(key)) {
    if (Object.prototype.hasOwnProperty.call(props, candidate)) {
      return props[candidate];
    }
  }
  return fallback;
};

const setPropNormalized = (props, key, value) => {
  const next = { ...props };
  let targetKey = key;
  for (const candidate of getKeyVariants(key)) {
    if (Object.prototype.hasOwnProperty.call(next, candidate)) {
      targetKey = candidate;
      break;
    }
  }
  next[targetKey] = value;
  return next;
};

const findNodeById = (list, id) => {
  for (const node of list) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const walkTree = (list, visitor) => {
  for (const item of list) {
    visitor(item);
    if (item.children?.length) walkTree(item.children, visitor);
  }
};

const updateNodeById = (list, id, updater) =>
  list.map(item => {
    if (item.id === id) return updater(item);
    if (item.children?.length) {
      return { ...item, children: updateNodeById(item.children, id, updater) };
    }
    return item;
  });

const removeNodeById = (list, id) =>
  list
    .filter(item => item.id !== id)
    .map(item => item.children?.length ? { ...item, children: removeNodeById(item.children, id) } : item);

const insertIntoContainer = (list, containerId, node) =>
  list.map(item => {
    if (item.id === containerId) {
      return { ...item, children: [...(item.children || []), node] };
    }
    if (item.children?.length) {
      return { ...item, children: insertIntoContainer(item.children, containerId, node) };
    }
    return item;
  });

const isInTree = (list, id) => !!findNodeById(list, id);

const replaceIdInBlockXml = (xml, oldId, newId) => {
  if (!xml || !oldId || !newId || oldId === newId) return xml;
  const escapedOld = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return xml.replace(new RegExp(`\\b${escapedOld}\\b`, 'g'), newId);
};

export function useAppState() {
  const [screens, setScreens] = useState([makeScreen('Screen1')]);
  const [activeScreen, setActiveScreen] = useState('Screen1');
  const [selectedId, setSelectedId] = useState(null);
  const [appName, setAppName] = useState('MyApp');
  const [packageName, setPackageName] = useState('com.leapblocks.myapp');
  const [blockLogic, setBlockLogic] = useState(''); // XML canonical source
  const [media, setMedia] = useState([]);

  const getCurrentScreen = (stateScreens) =>
    stateScreens.find(s => s.id === activeScreen) || stateScreens[0];

  const getNextComponentName = (stateScreens, type) => {
    const screen = getCurrentScreen(stateScreens);
    const allIds = [];
    walkTree(screen.components, comp => allIds.push(comp.id));
    screen.nonVisibleComponents.forEach(comp => allIds.push(comp.id));

    let idx = 1;
    while (allIds.includes(`${type}${idx}`)) idx += 1;
    return `${type}${idx}`;
  };

  const addComponent = (type, options = {}) => {
    const meta = COMPONENT_META.get(type) || {};
    const visible = options.visible ?? meta.visible ?? true;
    let addedId = null;

    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;

      const newId = getNextComponentName(prevScreens, type);
      addedId = newId;
      const defaultProps = defaultPropsFor(type);
      const newComponent = {
        id: newId,
        type,
        icon: meta.icon,
        visible,
        children: ARRANGEMENT_TYPES.has(type) ? [] : undefined,
        props: defaultProps
      };

      const selectedParent = screen.components && isInTree(screen.components, selectedId)
        ? findNodeById(screen.components, selectedId)
        : null;
      const canNestInArrangement = visible && selectedParent && ARRANGEMENT_TYPES.has(selectedParent.type);
      const canNestInCanvas = selectedParent?.type === 'Canvas' && CANVAS_CHILD_TYPES.has(type);

      const nextScreen = deepClone(screen);

      if (!visible) {
        nextScreen.nonVisibleComponents.push(newComponent);
      } else if (canNestInArrangement) {
        nextScreen.components = insertIntoContainer(nextScreen.components, selectedParent.id, newComponent);
      } else if (canNestInCanvas) {
        nextScreen.components = insertIntoContainer(nextScreen.components, selectedParent.id, newComponent);
      } else {
        nextScreen.components.push(newComponent);
      }

      return nextScreen;
    }));
    if (addedId) setSelectedId(addedId);
  };

  const updateProp = (id, key, value) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;
      const next = deepClone(screen);

      if (id === screen.id) {
        // Update Screen property directly
        if (key === 'AboutScreen') next.aboutScreen = value;
        else if (key === 'BackgroundColor') next.backgroundColor = value;
        else if (key === 'AlignHorizontal') next.alignHorizontal = value;
        else if (key === 'AlignVertical') next.alignVertical = value;
        else if (key === 'ShowStatusBar') next.showStatusBar = value;
        else if (key === 'Title') next.title = value;
        else if (key === 'TitleVisible') next.titleVisible = value;
        else if (key === 'ScreenOrientation') next.screenOrientation = value;
        else if (key === 'Theme') next.theme = value;
        else if (key === 'AppName') {
          setAppName(value);
        }
        return next;
      }

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
  };

  const removeComponent = (id) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== activeScreen) return screen;
      const next = deepClone(screen);
      next.components = removeNodeById(next.components, id);
      next.nonVisibleComponents = next.nonVisibleComponents.filter(c => c.id !== id);
      return next;
    }));

    setBlockLogic(prev => (prev || '').replace(new RegExp(id, 'g'), ''));
    if (selectedId === id) setSelectedId(null);
  };

  const addScreen = (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    setScreens(prev => {
      if (prev.find(s => s.id === trimmed)) return prev;
      return [...prev, makeScreen(trimmed)];
    });
    setActiveScreen(trimmed);
    setSelectedId(null);
  };

  const deleteScreen = (name) => {
    const trimmed = name?.trim();
    if (!trimmed || trimmed === 'Screen1') return;
    setScreens(prev => {
      const nextScreens = prev.filter(s => s.id !== trimmed);
      if (activeScreen === trimmed) {
        setActiveScreen(nextScreens[0]?.id || 'Screen1');
      }
      return nextScreens;
    });
    setSelectedId(null);
  };

  const renameComponent = (oldId, newId) => {
    if (!oldId || !newId || oldId === newId) return;

    setScreens(prevScreens => prevScreens.map(screen => {
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
    }));

    setBlockLogic(prev => replaceIdInBlockXml(prev, oldId, newId));
    if (selectedId === oldId) setSelectedId(newId);
  };

  const addMedia = (mediaItem) => {
    setMedia(prev => [...prev, mediaItem]);
  };

  const deleteMedia = (filename) => {
    setMedia(prev => prev.filter(item => item.filename !== filename));
  };

  const loadProject = (projectData) => {
    if (!projectData) return;
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
    setSelectedId(null);
  };

  const newProject = () => {
    setScreens([makeScreen('Screen1')]);
    setActiveScreen('Screen1');
    setSelectedId(null);
    setAppName('MyApp');
    setPackageName('com.leapblocks.myapp');
    setBlockLogic('');
    setMedia([]);
  };

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

  const getSerializedState = () => ({
    schemaVersion: 2,
    appName,
    packageName,
    versionCode: 1,
    versionName: '1.0',
    screens,
    blockLogic,
    media
  });

  const selectComponent = (id) => setSelectedId(id);
  const deleteComponent = (id) => removeComponent(id);

  return useMemo(() => ({
    screens,
    activeScreen,
    selectedId,
    appName,
    packageName,
    blockLogic,
    media,
    currentScreen,
    selectedComponent,
    addComponent,
    updateProp,
    removeComponent,
    addScreen,
    deleteScreen,
    setActiveScreen,
    setSelectedId,
    setAppName,
    setPackageName,
    setBlockLogic,
    getSerializedState,
    selectComponent,
    deleteComponent,
    renameComponent,
    addMedia,
    deleteMedia,
    getNextComponentName,
    loadProject,
    newProject,
    isArrangementType: (type) => ARRANGEMENT_TYPES.has(type),
    getComponentVisibility: (type) => (COMPONENT_META.get(type)?.visible ?? true)
  }), [
    screens,
    activeScreen,
    selectedId,
    appName,
    packageName,
    blockLogic,
    media,
    currentScreen,
    selectedComponent
  ]);
}
