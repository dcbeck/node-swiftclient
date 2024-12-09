# Openstack Swift Client Library for Node.js

This Node.js `SwiftClient` library is a TypeScript-based client for OpenStack Swift object storage. It simplifies managing containers, objects, and metadata, supporting all Swift authentication versions (v1.0, v2.0, and v3).

---

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

Here’s how to create a container, upload a file, and list its objects:

```typescript
import { SwiftClient } from 'swift-client';

const client = new SwiftClient({
  authVersion: 3,
  authUrl: 'https://auth.example.com/v3',
  username: 'your-username',
  password: 'your-password',
  tenant: 'your-tenant-name',
});

async function example() {
  // Create a container
  await client.createContainer('my-container', true, null, null);

  // Upload an object
  const container = await client.getContainer('my-container');
  const buffer = Buffer.from('Hello, Swift!');
  await container.putObject('hello.txt', buffer, {
    'Content-Type': 'text/plain',
  });

  // List all objects in the pseudo-hierarchical folder "img/"
  const objects = await container.listObjects({ prefix: 'img/' });
  console.log(objects);
}

example();
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

| Method                                             | Description                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `listObjects(options?)`                            | Lists objects in the container with optional filters (e.g., `prefix`, `limit`). |
| `getObjectMeta(objectName)`                        | Retrieves metadata for a specific object.                                       |
| `patchObjectMeta(objectName, meta, extraHeaders?)` | Updates metadata for an object.                                                 |
| `putObject(objectName, data, meta, extraHeaders)`  | Uploads an object using a buffer or stream with optional metadata and headers.  |
| `deleteObject(objectName, when?)`                  | Deletes an object, optionally scheduling its deletion for a future time.        |
| `getObject(objectName)`                            | Retrieves an object as a readable stream.                                       |
| `getObjectAsBuffer(objectName)`                    | Retrieves an object as a buffer.                                                |

---

## Configuration

`SwiftClient` supports multiple authentication methods. Examples:

### Auth Version 1

```typescript
const client = new SwiftClient({
  authVersion: 1,
  authUrl: 'https://auth.example.com/v1.0',
  username: 'user',
  password: 'pass',
  tenant: 'tenant-name',
});
```

### Auth Version 2

Note: Version 2 is deprecated and you should upgrade your swift storage.

```typescript
const client = new SwiftClient({
  authVersion: 2,
  authUrl: 'https://auth.example.com/v2.0',
  username: 'user',
  password: 'pass',
  tenant: 'tenant-name',
  region: 'region-name',
});
```

### Auth Version 3

```typescript
const client = new SwiftClient({
  authVersion: 3,
  authUrl: 'https://auth.example.com/v3',
  username: 'user',
  password: 'pass',
  tenant: 'tenant-name',
  region: 'region-name',
});
```

---

## License

This library is licensed under the [MIT License](LICENSE).
