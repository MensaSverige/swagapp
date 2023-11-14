/**
 * Overriding the default config with local config if it exists.
 * This is useful for development and testing.
 *
 * To use this, create a file called local-config.ts in the root of the project.
 * Copy the contents of local-config.ts.sample into it.
 * Modify the values to match your local environment.
 *
 * Restart the app and it will use the values from local-config.ts.
 */

let appConfig: {
  baseURL: string;
} = {
  baseURL: 'https://swag.mikael.green/api',
};

try {
  console.log('Local config found');
  appConfig = require('./local-config').default;
} catch (error) {
  console.log('No local config found');
}

export default appConfig;
