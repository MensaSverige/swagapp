const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withGradlePropertiesModification(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;

    // Function to set or update a property
    const setProperty = (key, value) => {
      const existingProperty = properties.find((p) => p.key === key);
      if (existingProperty) {
        existingProperty.value = value;
      } else {
        properties.push({ type: "property", key, value });
      }
    };

    // Set JVM arguments
    setProperty("org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=1024m");

    // Set AndroidX
    setProperty("android.useAndroidX", "true");

    // Set Jetifier
    setProperty("android.enableJetifier", "true");

    return config;
  });
};