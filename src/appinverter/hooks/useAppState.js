/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState } from 'react';
import { defaultPropsFor } from '../data/defaultProperties';

export function useAppState() {
  const [screens, setScreens] = useState([{ id: 'Screen1', components: [] }]);
  const [activeScreen, setActiveScreen] = useState('Screen1');
  const [selectedId, setSelectedId] = useState(null);
  const [appName, setAppName] = useState('MyApp');
  const [packageName, setPackageName] = useState('com.leapblocks.myapp');

  const addComponent = (type, x = 0, y = 0) => {
    const newId = `${type}${Date.now()}`;
    const defaultProps = defaultPropsFor(type);
    
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id === activeScreen) {
        return {
          ...screen,
          components: [...screen.components, { id: newId, type, props: defaultProps, x, y }]
        };
      }
      return screen;
    }));
    setSelectedId(newId);
  };

  const updateProp = (id, key, value) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id === activeScreen) {
        return {
          ...screen,
          components: screen.components.map(comp => 
            comp.id === id ? { ...comp, props: { ...comp.props, [key]: value } } : comp
          )
        };
      }
      return screen;
    }));
  };

  const removeComponent = (id) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id === activeScreen) {
        return {
          ...screen,
          components: screen.components.filter(c => c.id !== id)
        };
      }
      return screen;
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const addScreen = (name) => {
    if (!screens.find(s => s.id === name)) {
      setScreens(prev => [...prev, { id: name, components: [] }]);
      setActiveScreen(name);
      setSelectedId(null);
    }
  };

  const getSerializedState = () => {
    return {
      appName,
      packageName,
      versionCode: 1,
      versionName: "1.0",
      screens
    };
  };

  return {
    screens,
    activeScreen,
    selectedId,
    appName,
    packageName,
    addComponent,
    updateProp,
    removeComponent,
    addScreen,
    setActiveScreen,
    setSelectedId,
    setAppName,
    setPackageName,
    getSerializedState
  };
}
