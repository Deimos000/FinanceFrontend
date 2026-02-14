const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to force the use of CommonJS (main) entry points
config.resolver.unstable_enablePackageExports = false;

// Add wasm support for expo-sqlite on web
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

module.exports = config;
