const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const sdkRoot = path.resolve(__dirname, '..');

const config = {
  watchFolders: [sdkRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(sdkRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@marfeel/react-native-sdk': sdkRoot,
    },
    blockList: [
      new RegExp(path.resolve(sdkRoot, 'node_modules', 'react-native').replace(/[/\\]/g, '[/\\\\]') + '/.*'),
      new RegExp(path.resolve(sdkRoot, 'node_modules', 'react').replace(/[/\\]/g, '[/\\\\]') + '/.*'),
      new RegExp(path.resolve(sdkRoot, '.worktrees').replace(/[/\\]/g, '[/\\\\]') + '/.*'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
