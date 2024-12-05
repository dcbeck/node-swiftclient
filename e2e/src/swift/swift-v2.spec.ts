import { SwiftClient, SwiftContainer } from 'node-swiftclient';
import * as fs from 'fs';
import { getTestFiles } from '../utils/utils';

describe('Swift version 2 tests', () => {
  let swift: SwiftClient;
  let container: SwiftContainer;
  const containerName = 'version2Container';

  beforeAll(async () => {
    swift = new SwiftClient({
      authVersion: 2,
      authUrl: 'http://127.0.0.1:6023/v2.0',
      userName: 'demo',
      apiKey: 'demo',
      tenant: 'test',
    });

    await swift.createContainer(containerName, false, { color: 'blue' }, null);

    const l = await swift.listAllContainers();
    expect(
      l
        .map((l) => l.name)
        .join(',')
        .includes(containerName)
    ).toBe(true);
    container = await swift.getContainer(containerName);
  });

  it('should have no objects inside container at first', async () => {
    const objects = await container.listObjects();
    expect(objects.length).toBe(0);
  });

  it('should upload test files', async () => {
    const testFiles = getTestFiles();

    const readableStream = fs.createReadStream(testFiles.jpgFile.filePath);

    await container.putObject(
      testFiles.jpgFile.fileName,
      readableStream,
      { nice: 'meta' },
      null
    );

    const files = await container.listObjects();
    expect(files.length).toBe(1);
  });

  afterAll(async () => {
    //clear everything
    const files = await container.listObjects();
    for (const file of files) {
      await container.deleteObject(file.name);
    }
    await swift.deleteContainer(containerName);
  });
});
