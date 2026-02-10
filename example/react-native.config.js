const path = require('path');

const sdkRoot = path.resolve(__dirname, '..');

module.exports = {
  dependencies: {
    '@marfeel/react-native-sdk': {
      root: sdkRoot,
    },
  },
};
