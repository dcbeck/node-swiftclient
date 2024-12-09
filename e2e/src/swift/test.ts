import { SwiftClient } from 'node-swiftclient';
import { Readable } from 'stream';

async function example() {
  // Initialize SwiftClient
  const client = new SwiftClient({
    authVersion: 2,
    authUrl: 'https://auth.example.com/v2.0',
    userName: 'user',
    password: 'pass',
    tenant: 'Default',
  });//#endregion

  const swift = new SwiftClient({
    authVersion: 1,
    authUrl: 'http://127.0.0.1:6001/auth/v1.0',
    userName: 'tester2',
    password: 'testing2',
    tenant: 'test2',
  });

  // Create a container
  await client.createContainer('my-container', true, {
    'X-Meta-Info': 'example',
  });

  // List containers
  const containers = await client.listAllContainers();
  console.log('Containers:', containers);

  // Upload an object as a stream
  const container = client.getContainer('my-container');
  const stream = Readable.from('Hello, Swift!');
  await container.putObject('docs/hello.txt', stream);

  //List all object in pseudo-folder 'img'
  const objects = container.listObjects({ prefix: 'docs/' });
  console.log(objects);

  // Download the object as a buffer
  const buffer = await container.getObjectAsBuffer('docs/hello.txt');
  console.log('Downloaded Content:', buffer.toString());

  // Clean up: Delete the object and container
  await container.deleteObject('docs/hello.txt');
  await client.deleteContainer('my-container');
}
