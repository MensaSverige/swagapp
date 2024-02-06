const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

const crypto = require('crypto');
const fs = require('fs');

let hash = crypto.createHash('sha256');
hash.update(fs.readFileSync('.env'));
const cacheVersion = hash.digest('hex');

// module.exports = {
//   transformer: {
//     getTransformOptions: async () => ({
//       transform: {
//         experimentalImportSupport: false,
//         inlineRequires: true,
//       },
//     }),
//   },
//   cacheVersion,
// };
module.exports = mergeConfig(getDefaultConfig(__dirname), config);