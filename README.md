# Openstack Swift Client Library for Node.js

This **Swift Client Library** provides a Node.js interface for interacting with OpenStack Swift, a highly available and distributed object storage system. This library simplifies authentication, container management, and object operations using a structured TypeScript API.

---

## **Installation**

Install the library using npm/pnpm:

```bash
npm install node-swiftclient
```

or

```bash
pnpm install node-swiftclient
```

---

## **Getting Started**

The main entry point for this library is the `SwiftClient` class, which provides methods to manage containers and objects in OpenStack Swift.

### **Basic Usage Example**

```typescript
import { SwiftClient, SwiftClientOptions, SwiftContainer } from 'swift-client';
import { Readable } from 'stream';

const config: SwiftClientOptions = {
  authVersion: 3,
  authUrl: 'https://example.com/auth/v3',
  username: 'your-username',
  password: 'your-password',
  tenant: 'your-tenant',
};

async function main(): Promise<void> {
  // Initialize SwiftClient with configuration
  const client = new SwiftClient(config);

  try {
    // List all containers
    const containers = await client.listAllContainers();
    console.log('Containers:', containers);

    // Create a new container
    const containerName = 'my-container';
    await client.createContainer(containerName, true, null, null);
    console.log(`Container "${containerName}" created successfully.`);

    // Get a reference to the container
    const container: SwiftContainer = client.getContainer(containerName);

    // List all objects in the pseudo-hierarchical folder "img/" inside the container
    const objects = await container.listObjects({ prefix: 'img/' });
    console.log(`Objects in "${containerName}":`, objects);

    // Upload an object to the container
    const objectName = 'my-object.txt';
    const stream: Readable = Readable.from('Hello, OpenStack Swift!'); // Example readable stream
    await container.putObject(
      objectName,
      stream,
      { 'Content-Type': 'text/plain' }, // Metadata
      null // Extra headers
    );
    console.log(`Object "${objectName}" uploaded successfully.`);

    // Download the object
    const objectStream = await container.getObject(objectName);
    const reader = objectStream.getReader();

    let chunk: ReadableStreamReadResult<Uint8Array>;
    while (!(chunk = await reader.read()).done) {
      const data = new TextDecoder().decode(chunk.value);
      console.log(`Downloaded object data: ${data}`);
    }

    // Delete the object
    await container.deleteObject(objectName);
    console.log(`Object "${objectName}" deleted successfully.`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main().catch((err) => console.error('Unhandled error:', err));
```

---

## **API Reference**

### **SwiftClient**

The `SwiftClient` class is the entry point to the library. It is used to authenticate and manage containers.

#### **Constructor**

```typescript
constructor(config: SwiftClientOptions)
```

- **config**: Configuration for authentication, including version, URL, and credentials.

#### **Methods**

| Method                                                           | Description                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `createContainer(containerName, publicRead, meta, extraHeaders)` | Creates a new container with optional metadata.                                   |
| `getClientInfo()`                                                | Retrieves information about the current client.                                   |
| `getContainerMeta(containerName)`                                | Retrieves metadata of a specified container.                                      |
| `deleteContainer(containerName)`                                 | Deletes the specified container.                                                  |
| `listAllContainers(query, extraHeaders)`                         | Lists all containers with optional query parameters.                              |
| `getContainer(containerName)`                                    | Returns a `SwiftContainer` instance for interacting with the specified container. |

---

### **SwiftContainer**

The `SwiftContainer` class provides methods to manage objects within a container.

#### **Constructor**

```typescript
constructor(containerName: string, authenticator: Authenticator)
```

#### **Methods**

| Method                                                      | Description                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `listObjects(options, additionalQueryParams, extraHeaders)` | Lists all objects in the container with optional query parameters. |
| `getObjectMeta(objectName)`                                 | Retrieves metadata for a specific object.                          |
| `putObject(objectName, stream, meta, extraHeaders)`         | Uploads an object to the container.                                |
| `deleteObject(objectName, when)`                            | Deletes a specified object with an optional delay.                 |
| `getObject(objectName)`                                     | Retrieves the specified object as a readable stream.               |
| `patchObjectMeta(objectName,  meta, extraHeaders)`          | Updates metadata for a specific object.                            |

---

### **SwiftClientOptions**

The configuration for `SwiftClient` supports three authentication versions:

#### **Version 1**

```typescript
{
    authVersion: 1;
    authUrl: string;
    username: string;
    password: string;
    tenant?: string;
}
```

#### **Version 2**

```typescript
{
    authVersion: 2;
    authUrl: string;
    username?: string;
    userId?: string;
    apiKey?: string;
    tenant?: string;
    tenantId?: string;
    domain?: string;
    domainId?: string;
    trustId?: string;
}
```

#### **Version 3**

```typescript
{
    authVersion: 3;
    authUrl: string;
    username?: string;
    userId?: string;
    domain?: string;
    domainId?: string;
    applicationCredentialId?: string;
    applicationCredentialName?: string;
    applicationCredentialSecret?: string;
    tenant?: string;
    tenantId?: string;
    tenantDomain?: string;
    tenantDomainId?: string;
    trustId?: string;
}
```

---

### **Examples**

#### **Listing Containers**

```typescript
const containers = await client.listAllContainers();
console.log('Containers:', containers);
```

#### **Uploading an Object**

```typescript
const stream = /* Your Readable stream */;
await container.putObject('example.txt', stream, { 'Content-Type': 'text/plain' }, null);
```

#### **Downloading an Object**

```typescript
const objectStream = await container.getObject('example.txt');
const reader = objectStream.getReader();

reader.read().then(({ value, done }) => {
  if (!done) {
    console.log(new TextDecoder().decode(value));
  }
});
```

---

## **Development**

To contribute to this library:

1. Clone the repository.
2. Install dependencies using `pnpm install`.
3. Run e2e tests using `pnpm e2e` (docker needed).

---

## **License**

This library is licensed under the MIT License. See the LICENSE file for more details.

---

## **Support**

For any issues or questions, please open an issue in the GitHub repository or contact the maintainers directly.

---

Happy coding! 🎉
