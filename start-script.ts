import {exec} from 'child_process';
import fs from 'fs';

const getWifiIPAddress = (): Promise<string> => {
  return new Promise((resolve, _) => {
    exec('netsh interface ip show address "Wi-Fi"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return resolve('localhost');
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return resolve('localhost');
      }
      const ipLine = stdout
        .split('\n')
        .find(line => line.trim().startsWith('IP Address'));
      if (ipLine) {
        const ipAddress = ipLine.split(':')[1].trim();
        console.log(`Wi-Fi IP Address: ${ipAddress}`);
        resolve(ipAddress);
      } else {
        console.log('Wi-Fi IP Address not found.');
        resolve('localhost');
      }
    });
  });
};

const setEnvironmentVariables = async (): Promise<void> => {
  try {
    const isProd = process.argv.includes('--prod');
    const backendURL = isProd
      ? 'https://swag.mikael.green/api'
      : `http://${await getWifiIPAddress()}:5000`;

    fs.writeFileSync('.env', `API_URL=${backendURL}\nTEST_MODE=${!isProd}\n`);

    console.log(`Using Backend URL: ${backendURL}`);
    console.log(`Test mode is set to: ${!isProd}`);
  } catch (error: any) {
    console.error(`Failed to set backend URL: ${error.message}`);
  }
};

setEnvironmentVariables();
