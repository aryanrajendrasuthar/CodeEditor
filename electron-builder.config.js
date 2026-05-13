module.exports = {
  appId: 'com.aryansuthar.codeeditor',
  productName: 'Code Editor',
  directories: {
    buildResources: 'build',
    output: 'release'
  },
  files: [
    'out/**/*',
    '!out/renderer/assets/*.map'
  ],
  mac: {
    target: ['dmg', 'zip'],
    icon: 'build/icon.icns',
    category: 'public.app-category.developer-tools'
  },
  win: {
    target: ['nsis', 'zip'],
    icon: 'build/icon.ico'
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'build/icon.png',
    category: 'Development'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  electronRebuildConfig: {
    buildFromSource: true
  }
};
