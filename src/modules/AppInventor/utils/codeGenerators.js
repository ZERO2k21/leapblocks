const fs = require('fs-extra');
const path = require('path');

export function generateAppTsx(appState) {
  const { screens } = appState;

  const imports = `import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
// @ts-ignore
import Slider from '@react-native-community/slider';
import { styles } from './src/styles';
import { handlers } from './src/handlers';\n\n`;

  let componentString = '';

  screens.forEach(screen => {
    let elementsStr = screen.components.map(comp => {
      const { id, type, props } = comp;
      const styleMatch = `style={styles.${id}}`;

      switch (type) {
        case 'Button':
          return `        <TouchableOpacity ${styleMatch} onPress={handlers.${id}_Click}>
          <Text style={{ color: '${props.textColor || '#ffffff'}', fontWeight: ${props.bold ? "'bold'" : "'normal'"}, fontSize: ${props.fontSize || 14}, textAlign: 'center' }}>
            ${props.text || 'Button'}
          </Text>
        </TouchableOpacity>`;
        case 'Label':
          return `        <Text ${styleMatch}>${props.text || ''}</Text>`;
        case 'TextBox':
          return `        <TextInput ${styleMatch} placeholder="${props.hint || ''}" multiline={${!!props.multiLine}} />`;
        case 'Image':
          return `        <Image ${styleMatch} source={{ uri: '${props.picture || 'https://via.placeholder.com/100'}' }} resizeMode="${props.scalePicture ? 'contain' : 'cover'}" />`;
        case 'CheckBox':
          return `        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 4 }}>
          <Switch value={${Boolean(props.checked)}} onValueChange={handlers.${id}_Changed} />
          <Text style={{ marginLeft: 8 }}>${props.text || 'CheckBox'}</Text>
        </View>`;
        case 'Slider':
          return `        <Slider ${styleMatch} minimumValue={${props.minValue || 0}} maximumValue={${props.maxValue || 100}} value={${props.thumbPosition || 50}} onValueChange={handlers.${id}_Changed} />`;
        case 'Switch':
          return `        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 4 }}>
          <Switch value={${Boolean(props.on)}} trackColor={{ true: '${props.thumbColor || '#6c63ff'}' }} onValueChange={handlers.${id}_Changed} />
        </View>`;
        default:
          return `        <View ${styleMatch}><Text>${type} (${id})</Text></View>`;
      }
    }).join('\n');

    componentString += `function ${screen.id}() {
  return (
    <ScrollView style={styles.screen}>
${elementsStr}
    </ScrollView>
  );
}\n\n`;
  });

  const defaultExport = `export default function App() {
  // Render Screen1 by default. In a full implementation, you'd add React Navigation here.
  return <Screen1 />;
}\n`;

  return imports + componentString + defaultExport;
}

export function generateStyles(appState) {
  const { screens } = appState;

  let stylesStr = `import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff'
  },\n`;

  screens.forEach(screen => {
    screen.components.forEach(comp => {
      const { id, props, type } = comp;
      
      const width = props.width === 'fill_parent' ? "'100%'" : (typeof props.width === 'number' ? props.width : "'auto'");
      const height = props.height === 'automatic' ? "undefined" : (typeof props.height === 'number' ? props.height : "undefined");
      
      let cssProps = `    backgroundColor: '${props.backgroundColor || 'transparent'}',\n`;
      if (props.textColor && type !== 'Button') cssProps += `    color: '${props.textColor}',\n`;
      if (props.fontSize && type !== 'Button') cssProps += `    fontSize: ${props.fontSize},\n`;
      cssProps += `    width: ${width},\n`;
      if (height !== 'undefined') cssProps += `    height: ${height},\n`;
      cssProps += `    padding: 8,\n    margin: 4,\n    borderRadius: 6,\n`;

      stylesStr += `  ${id}: {\n${cssProps}  },\n`;
    });
  });

  stylesStr += `});\n`;
  return stylesStr;
}

export function generateHandlers(appState) {
  const { screens } = appState;
  
  let handlersStr = `// Auto-generated Event Handlers for UI Components
export const handlers = {\n`;

  screens.forEach(screen => {
    screen.components.forEach(comp => {
      const { id, type, blockLogic } = comp;
      
      let handlerName = '';
      if (type === 'Button') handlerName = `${id}_Click`;
      else if (type === 'Slider' || type === 'Switch' || type === 'TextBox' || type === 'CheckBox') handlerName = `${id}_Changed`;
      
      if (handlerName) {
        let logicBody = blockLogic ? blockLogic : `console.log('${id} interacted');`;
        handlersStr += `  ${handlerName}: (...args) => {\n    ${logicBody}\n  },\n`;
      }
    });
  });

  handlersStr += `};\n`;
  return handlersStr;
}

/**
 * generateAndInjectZip
 * 
 * Called from Electron's buildApk.js to inject generated React Native code
 * into the copied android template structure.
 * 
 * @param {Object} appState - The full state output from getSerializedState()
 * @param {string} templateDir - Source directory of the RN template
 * @param {string} destDir - Destination directory (temp build folder)
 */
export async function generateAndInjectZip(appState, templateDir, destDir) {
  // 1. Copy the template to the destination folder
  await fs.copy(templateDir, destDir);
  
  // 2. Generate RN application code
  const appTsx = generateAppTsx(appState);
  const stylesTs = generateStyles(appState);
  const handlersTs = generateHandlers(appState);
  
  // Ensure src directory exists
  await fs.ensureDir(path.join(destDir, 'src'));
  
  // 3. Write generated source files
  await fs.writeFile(path.join(destDir, 'App.tsx'), appTsx);
  await fs.writeFile(path.join(destDir, 'src', 'styles.ts'), stylesTs);
  await fs.writeFile(path.join(destDir, 'src', 'handlers.ts'), handlersTs);
  
  // 4. Update app.json
  const appJsonPath = path.join(destDir, 'app.json');
  if (await fs.pathExists(appJsonPath)) {
    const appJson = await fs.readJson(appJsonPath);
    appJson.name = appState.appName.replace(/[^a-zA-Z0-9]/g, '');
    appJson.displayName = appState.appName;
    await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
  }

  // 5. Patch android/app/build.gradle
  const buildGradlePath = path.join(destDir, 'android', 'app', 'build.gradle');
  if (await fs.pathExists(buildGradlePath)) {
    let gradleContent = await fs.readFile(buildGradlePath, 'utf8');
    
    // Replace applicationId
    gradleContent = gradleContent.replace(
      /applicationId\s+".*"/, 
      `applicationId "${appState.packageName}"`
    );
    
    // Replace versionCode
    gradleContent = gradleContent.replace(
       /versionCode\s+\d+/,
       `versionCode ${Math.max(1, appState.versionCode || 1)}`
    );

    // Replace versionName
    gradleContent = gradleContent.replace(
      /versionName\s+".*"/, 
      `versionName "${appState.versionName || "1.0"}"`
    );

    await fs.writeFile(buildGradlePath, gradleContent);
  }
}
