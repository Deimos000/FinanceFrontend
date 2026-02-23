/**
 * Expo plugin to enable ABI splits in the Android `app/build.gradle`
 * This creates a smaller APK for local testing on a specific device architecture like arm64-v8a.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withSplitApks(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = config.modResults.contents.replace(
                /android\s*{/,
                `android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }`
            );
        }
        return config;
    });
};
