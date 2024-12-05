import { SwiftClient } from 'node-swiftclient';
import * as fs from 'fs';
import { getAssetsFolder, getTestFiles, waitUntilTestContainerIsRunning } from '../utils/utils';

describe('CLI tests', () => {
  beforeAll(async () => {
    await waitUntilTestContainerIsRunning();
    getAssetsFolder();
  });

  it('should print a message', async () => {
    const swift = new SwiftClient({
      authVersion: 3,
      authUrl: 'http://127.0.0.1:6023/v3',
      userName: 'demo',
      apiKey: 'demo',
      tenant: 'test',
      tenantDomain: 'Default',
      domain: 'Default',
    });

    await swift.createContainer(
      'testContainer',
      false,
      { color: 'blue' },
      null
    );

    const l = await swift.listAllContainers();
    console.log(l);

    const container = swift.getContainer('testContainer');

    const testFiles = getTestFiles();

    const readableStream = fs.createReadStream(testFiles.jpgFile.filePath);

    await container.putObject(
      testFiles.jpgFile.fileName,
      readableStream,
      { nice: 'meta' },
      null
    );

    const files = await container.listObjects();
    console.log(files);
 
  });
});
