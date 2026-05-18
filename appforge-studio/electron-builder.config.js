// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Electron Builder Config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = {
  appId: 'com.appforge.studio',
  productName: 'AppForge Studio',
  copyright: 'Copyright © 2026 AppForge',

  directories: {
    buildResources: 'public',
    output: 'dist'
  },

  files: [
    'build/**/*',
    'main.js',
    'preload.js',
    'engine/**/*',
    'local-build-server/**/*',
    'smali/**/*',
    'template/**/*',
    '!**/node_modules/.cache/**/*'
  ],

  extraResources: [
    { from: 'tools/', to: 'tools/', filter: ['**/*'] },
    { from: 'keys/',  to: 'keys/',  filter: ['**/*'] }
  ],

  win: {
    target: [
      { target: 'nsis', arch: ['x64'] }
    ],
    icon: 'public/icon.ico',
    artifactName: '${productName}-Setup-${version}.${ext}'
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'AppForge Studio',
    installerSidebar: null,
    license: null
  },

  mac: {
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] }
    ],
    icon: 'public/icon.icns',
    category: 'public.app-category.developer-tools'
  },

  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] }
    ],
    icon: 'public/icon.png',
    category: 'Development'
  }
};
