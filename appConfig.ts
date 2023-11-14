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
