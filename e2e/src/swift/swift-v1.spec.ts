import { SwiftClient, SwiftContainer } from 'node-swiftclient';
import * as fs from 'fs';
import { getTestFiles } from '../utils/utils';

describe('Swift version 1 tests', () => {
  let swift: SwiftClient;
  let container: SwiftContainer;
  const containerName = 'version1Container';

  beforeAll(async () => {
    swift = new SwiftClient({
      authVersion: 1,
      authUrl: 'http://127.0.0.1:6001/auth/v1.0',
      username: 'tester2',
      password: 'testing2',
      tenant: 'test2',
    });

    await swift.createContainer(containerName, false, { color: 'blue' }, null);

    const containers = await swift.listAllContainers();
    expect(
      containers
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
