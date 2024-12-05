import { exec } from 'node:child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function runCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      return `STDOUT: ${stdout}`;
    }
    if (stderr) {
      return `STDERR: ${stderr}`;
    }
  } catch (error: any) {
    return `Error running command "${command}": ${error.message}`;
  }
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response | null> {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return resp;
  } catch (e) {
    return null;
  }
}

export async function waitUntilTestContainerIsRunning() {
  let authEndpointActive = false;
  let retries = 0;
  while (!authEndpointActive && retries < 20) {
    try {
      const res = await fetchWithTimeout('http://127.0.0.1:6001/v1/auth', 2000);
      if (res !== null && res.status === 401) {
        authEndpointActive = true;
        break;
      }
    } catch (error) {
      /** noop */
    }
    await wait(2000);
    retries++;
  }
  if (retries >= 20) {
    console.log('Failed to ping swift auth endpoint.');
  }
}

export function getAssetsFolder() {
  return path.join(__dirname,  '../../assets');
}

export function getTestFile(fileName: string) {
  const assetFolder = getAssetsFolder();
  return {
    fileName,
    filePath: path.join(assetFolder, 'dummy.pdf')
  }
}

export function getTestFiles() {
 
  return {
    pdfFile: getTestFile('dummy.pdf'),
    txtFile: getTestFile('test.txt'),
    m3dFile: getTestFile('teapot.m3d'),
    jpgFile: getTestFile('test.jpg'),
    pngFile: getTestFile('test.png'),
  }
}