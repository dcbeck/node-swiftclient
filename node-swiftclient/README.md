# Openstack Swift Client Library for Node.js

A Node.js client library for interacting with OpenStack Swift Object Storage. This library provides robust functionality for managing containers and objects, offering a clean and straightforward API for common Swift operations.
It supports all Swift authentication versions (v1.0, v2.0, and v3).

## **Installation**

Install the library using npm/pnpm:

```bash
npm install node-swiftclient
```

or

```bash
yarn install node-swiftclient
```

## Quick Example

How to create a container, upload a file, and list objects:

```typescript
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
```

---

## Key Features

- **Container Management**: Create, delete, and list containers.
- **Object Management**: Upload, download, delete, and list objects in containers.
- **Metadata**: Set and retrieve metadata for containers and objects.
- **Authentication**: Supports Swift authentication versions 1.0, 2.0, and 3.

---

## API Documentation

### **SwiftClient**

| Method                                                           | Description                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `createContainer(containerName, publicRead, meta, extraHeaders)` | Creates a new container with optional metadata and headers.              |
| `getContainer(containerName)`                                    | Retrieves a `SwiftContainer` object for managing objects in a container. |
| `listAllContainers(query?, extraHeaders?)`                       | Lists all containers with optional filters and headers.                  |
| `deleteContainer(containerName)`                                 | Deletes a container.                                                     |
| `getClientInfo()`                                                | Retrieves information about the authenticated Swift client.              |
| `getContainerMeta(containerName)`                                | Retrieves metadata for the specified container.                          |

---

### **SwiftContainer**

| Method                                             | Description                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `listObjects(options?)`                            | Lists objects in the container with optional filters (e.g., `prefix`, `limit`).                       |
| `iterateObjects(options)`                          | Iterate asynchronously over objects in the container with optional filters (e.g., `prefix`, `limit`). |
| `getObjectMeta(objectName)`                        | Retrieves metadata for a specific object.                                                             |
| `patchObjectMeta(objectName, meta, extraHeaders?)` | Updates metadata for an object.                                                                       |
| `putObject(objectName, data, meta, extraHeaders)`  | Uploads an object using a buffer or stream with optional metadata and headers.                        |
| `deleteObject(objectName, when?)`                  | Deletes an object, optionally scheduling its deletion for a future time.                              |
| `getObject(objectName)`                            | Retrieves an object as a readable stream.                                                             |
| `getObjectAsBuffer(objectName)`                    | Retrieves an object as a buffer.                                                                      |
| `getObjectInfo(objectName)`                        | Retrieves information about an object without downloading it's content                                |

---

## Configuration

`SwiftClient` supports multiple authentication methods. Examples:

### Auth Version 1

```typescript
swift = new SwiftClient({
  authVersion: 1,
  authUrl: 'http://example.com/auth/v1.0',
  userName: 'tester2',
  password: 'testing2',
  tenant: 'test2',
});
```

### Auth Version 2

Note: Version 2 is deprecated and you should upgrade your swift storage.

```typescript
swift = new SwiftClient({
  authVersion: 2,
  authUrl: 'http://auth.example.com/v2.0',
  userName: 'demo',
  apiKey: 'demo',
  tenant: 'test',
});
```

### Auth Version 3

```typescript
swift = new SwiftClient({
  authVersion: 3,
  authUrl: 'http://auth.example.com/v3',
  userName: 'demo',
  apiKey: 'demo',
  tenant: 'test',
  tenantDomain: 'Default',
  domain: 'Default',
});
```

## License

This library is licensed under the [MIT License](LICENSE).
