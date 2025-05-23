//import {exec} from 'child_process';
const exec = require('child_process').exec;
//import dotenv from 'dotenv';
const dotenv = require('dotenv');
//import fs from 'fs';
const fs = require('fs');

const getWifiIPAddress = (): Promise<string | null> => {
  return new Promise((resolve, _) => {
    exec('netsh interface ip show address "Wi-Fi"', (error: Error | null, stdout: string, stderr: string) => {
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
        .find((line: string) => line.trim().startsWith('IP Address'));
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

const setEnvironmentVariablesAndTypes = async (): Promise<void> => {
  try {
    const isProd = process.argv.includes('--prod-server');
    const testMode = process.argv.includes('--test-mode');

    // Get current API_URL from .env file
    const currentEnv = dotenv.config().parsed;

    let backendURL = currentEnv?.API_URL ?? 'http://localhost:5000';
    if (isProd) {
      backendURL = 'https://app.events.mensa.se/api';
    } else {
      const ipAddress = await getWifiIPAddress();
      if (ipAddress) {
        backendURL = `http://${ipAddress}:5000`;
      }
    }
    let API_VERSION = 'v1';

    process.argv.forEach((val, index) => {
      if (val === '--apiversion' && process.argv[index + 1]) {
        API_VERSION = process.argv[index + 1];
      }
    });

    console.log(`API_VERSION is ${API_VERSION}`);

    fs.writeFileSync('.env', `API_URL=${backendURL}\nAPI_VERSION=${API_VERSION}\nTEST_MODE=${testMode}\n`);

    console.log(`Using Backend URL: ${backendURL}`);
    console.log(`Test mode is set to: ${testMode}`);

    // Run npx openapi-typescript command
    exec(`npx openapi-typescript ${backendURL}/openapi.json -o ./api_schema/schema.d.ts`, (error: { message: any; }, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Error running npx openapi-typescript: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error running npx openapi-typescript: ${stderr}`);
        return;
      }
      console.log(`npx openapi-typescript output: ${stdout}`);
    });
  } catch (error: any) {
    console.error(`Failed to set backend URL: ${error.message}`);
  }
};

setEnvironmentVariablesAndTypes();
