export function countVisibleComponents(screens = []) {
  let count = 0;
  const walk = (components = []) => {
    components.forEach((component) => {
      count += 1;
      if (component.children?.length) walk(component.children);
    });
  };
  screens.forEach((screen) => walk(screen.components || []));
  return count;
}

function flattenVisible(list = []) {
  return list.flatMap((item) => [item, ...(item.children ? flattenVisible(item.children) : [])]);
}

export function buildBlocklyContextFromPayload(payload) {
  const screens = payload?.screens || [];
  const activeScreenId = payload?.activeScreen || screens[0]?.id;
  const currentScreen = screens.find((s) => s.id === activeScreenId) || screens[0];
  const components = [
    ...flattenVisible(currentScreen?.components || []),
    ...(currentScreen?.nonVisibleComponents || [])
  ];
  return { currentScreen, components };
}
