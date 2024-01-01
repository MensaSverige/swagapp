import {exec} from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';

const getWifiIPAddress = (): Promise<string | null> => {
  return new Promise((resolve, _) => {
    exec('netsh interface ip show address "Wi-Fi"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return resolve(null);
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return resolve(null);
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
        resolve(null);
      }
    });
  });
};

const setEnvironmentVariables = async (): Promise<void> => {
  try {
    const isProd = process.argv.includes('--prod-server');
    const testMode = process.argv.includes('--test-mode');

    // Get current API_URL from .env file
    const currentEnv = dotenv.config().parsed;

    let backendURL = currentEnv?.API_URL ?? 'http://localhost:5000';
    if (isProd) {
      backendURL = 'https://swag.mikael.green/api';
    } else {
      const ipAddress = await getWifiIPAddress();
      if (ipAddress) {
        backendURL = `http://${ipAddress}:5000`;
      }
    }

    fs.writeFileSync('.env', `API_URL=${backendURL}\nTEST_MODE=${testMode}\n`);

    console.log(`Using Backend URL: ${backendURL}`);
    console.log(`Test mode is set to: ${testMode}`);
  } catch (error: any) {
    console.error(`Failed to set backend URL: ${error.message}`);
  }
};

setEnvironmentVariables();
