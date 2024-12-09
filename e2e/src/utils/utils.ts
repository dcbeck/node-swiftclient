import { exec } from 'node:child_process';
import { promisify } from 'util';
import * as path from 'path';
import sharp from 'sharp';
import { Readable } from 'node:stream';

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
  return path.join(__dirname, '../../assets');
}

export function getTestFile(
  fileName: string,
  meta: Record<string, string>,
  extra: Record<string, string>
) {
  const assetFolder = getAssetsFolder();
  return {
    fileName,
    filePath: path.join(assetFolder, fileName),
    meta,
    extra,
  };
}

export function getTestFiles() {
  return [
    getTestFile(
      'docs/dummy.pdf',
      { 'meta-data-1': 'this is a pdf file', filetype: '3dModel' },
      { 'x-test-header': 'document' }
    ),
    getTestFile(
      'img/test.jpg',
      {
        'meta-data-2': 'this is a jpg file',
        createdby: 'testUser',
        filetype: '3dModel',
      },
      { 'x-test-header': 'image' }
    ),
    getTestFile(
      'docs/test.txt',
      { 'meta-data-3': 'this is a txt file', filetype: '3dModel' },
      { 'x-test-header': 'document' }
    ),
    getTestFile(
      'models/teapot.m3d',
      {
        'meta-data-4': 'this is a m3d file',
        createdby: 'swiftClient1',
        filetype: '3dModel',
      },
      { 'x-test-header': '3dModel' }
    ),
    getTestFile(
      'img/test.png',
      { 'meta-data-5': 'this is a png file', filetype: 'image' },
      { 'x-test-header': 'image' }
    ),
  ];
}

export function sortJson(jsonObj) {
  const sortedKeys = Object.keys(jsonObj).sort(); // Sort the keys alphabetically
  const sortedJson = {};

  sortedKeys.forEach((key) => {
    // If the value is an object, sort it recursively
    sortedJson[key] =
      typeof jsonObj[key] === 'object' && !Array.isArray(jsonObj[key])
        ? sortJson(jsonObj[key])
        : jsonObj[key];
  });

  return sortedJson;
}

export async function readImageMetaFromBuffer(buffer: Buffer) {
  const data = await sharp(buffer).metadata();
  return data;
}

export async function readImageMetaFromStreamReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const buffer = await streamToBuffer(reader);
  return readImageMetaFromBuffer(buffer);
}

async function streamToBuffer(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<Buffer> {
  const chunks = [];
  let totalLength = 0;

  while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      totalLength += value.byteLength;
  }

  // Concatenate all chunks into a single Buffer
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), totalLength);
}
