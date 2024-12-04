import { SwiftClient } from 'node-swiftclient';
import * as fs from 'fs';

describe('CLI tests', () => {
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

    await swift.create('testContainer', false, { color: 'blue' }, null);

    const l = await swift.list();
    console.log(l);

    const container = swift.container('testContainer');

    const readableStream = fs.createReadStream('e2e/readme.md');
    await container.create('testfile.md', readableStream, { nice: 'meta' }, null);

    const files = await container.list();
    console.log(files);
  });
});
