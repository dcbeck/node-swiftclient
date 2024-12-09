import { SwiftClient } from 'node-swiftclient';
import { Readable } from 'stream';

async function example() {
  // Initialize SwiftClient
  const client = new SwiftClient({
    authVersion: 3,
    authUrl: 'https://auth.example.com/v3',
    userName: 'demo',
    apiKey: 'demo',
    tenant: 'test',
    tenantDomain: 'Default',
    domain: 'Default',
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
