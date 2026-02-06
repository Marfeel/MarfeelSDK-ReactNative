const pak = require('./package.json');

module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
      },
      ios: {
        podspecPath: './marfeel-react-native-sdk.podspec',
      },
    },
  },
  project: {
    android: {
      sourceDir: './example/android',
    },
    ios: {
      sourceDir: './example/ios',
    },
  },
};
