import { SwiftClient, SwiftContainer } from 'node-swiftclient';
import * as fs from 'fs';
import { getTestFiles, sortJson, waitUntilTestContainerIsRunning } from '../utils/utils';
import { expectedUploadedFiles } from './expected-results';

describe('Swift version 3 tests', () => {
  let swift: SwiftClient;
  let container: SwiftContainer;
  const containerMeta = { color: 'purple' };
  const containerName = 'version3Container';

  beforeAll(async () => {
    await waitUntilTestContainerIsRunning();

    swift = new SwiftClient({
      authVersion: 3,
      authUrl: 'http://127.0.0.1:6023/v3',
      userName: 'demo',
      apiKey: 'demo',
      tenant: 'test',
      tenantDomain: 'Default',
      domain: 'Default',
    });
  });

  it('should create a container', async () => {
    await swift.createContainer(containerName, false, containerMeta, null);

    const containers = await swift.listAllContainers();
    expect(
      containers
        .map((l) => l.name)
        .join(',')
        .includes(containerName)
    ).toBe(true);
    container = await swift.getContainer(containerName);
  });

  it('should fail when container does not exits', async () => {
    const listFilesInNonExistentFolder = async () =>
      await swift.getContainer('unknownContainer').listObjects();
    expect(listFilesInNonExistentFolder).rejects.toThrow(
      'Error fetching list: Not Found'
    );
  });

  it('should get client info', async () => {
    const info = await swift.getClientInfo();
    expect(info.swift.policies).toBeDefined();
    expect(info.tempurl).toBeDefined();
    expect(info.ratelimit).toBeDefined();
  });

  it('should get container meta', async () => {
    const meta = await swift.getContainerMeta(containerName);
    expect(meta).toStrictEqual(containerMeta);
  });

  it('should have no objects inside container at first', async () => {
    const objects = await container.listObjects();
    expect(objects.length).toBe(0);
  });

  it('should upload test files', async () => {
    const testFiles = getTestFiles();

    for (const testFile of testFiles) {
      const readableStream = fs.createReadStream(testFile.filePath);

      await container.putObject(
        testFile.fileName,
        readableStream,
        testFile.meta,
        testFile.extra
      );
    }

    const files = await container.listObjects();
    expect(files.length).toBe(5);
    for (const file of files) {
      expect(new Date(file.last_modified)).toBeBefore(new Date());
    }
    expect(files).toMatchObject(expectedUploadedFiles);
  });

  it('should list objects in pseudo-hierarchical folders', async () => {
    const imgObjects = await container.listObjects({
      prefix: 'img',
    });
    expect(imgObjects.length).toBe(2);
    expect(
      imgObjects
        .map((i) => i.name)
        .sort()
        .join(',')
    ).toBe('img/test.jpg,img/test.png');

    const docObjects = await container.listObjects({
      prefix: 'docs/',
    });
    expect(docObjects.length).toBe(2);
    expect(
      docObjects
        .map((i) => i.name)
        .sort()
        .join(',')
    ).toBe('docs/dummy.pdf,docs/test.txt');
  });

  it('should get meta info for a test files', async () => {
    const testFiles = getTestFiles();
    for (const testFile of testFiles) {
      const metaData = await container.getObjectMeta(testFile.fileName);
      expect(sortJson(metaData)).toStrictEqual(sortJson(testFile.meta));
    }
  });

  it('should update data of file', async () => {
    const testFiles = getTestFiles();
    await container.patchObjectMeta(testFiles[0].fileName, {
      updated: 'new data',
    });
    const metaData = await container.getObjectMeta(testFiles[0].fileName);
    expect(metaData).toStrictEqual({ updated: 'new data' });
  });

  it('should delete objects', async () => {
    const testFiles = getTestFiles();
    const lengthBeforeDelete = (await container.listObjects()).length;
    await container.deleteObject(testFiles[0].fileName);
    await container.deleteObject(testFiles[2].fileName);
    const lengthAfterDelete = (await container.listObjects()).length;
    expect(lengthAfterDelete).toBe(lengthBeforeDelete - 2);
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
