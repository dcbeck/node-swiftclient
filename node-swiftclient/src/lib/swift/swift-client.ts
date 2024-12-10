import { SwiftEntity } from './swift-entity';
import { SwiftCommonContainer } from './swift-common-container';
import { SwiftContainerData } from '../interfaces/swift-container-data';
import { SwiftContainer } from '../interfaces';
import { getAuthenticatorForVersion } from './swift-utils';

export type SwiftConnection = {
  authUrl: string;
  region?: string;
  userAgent?: string;

  apiKey?: string;
  userName?: string;
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
};

export type SwiftClientOptions =
  | {
      authVersion: 1;
      authUrl: string;
      userName: string;
      password: string;
      tenant?: string;
    }
  | ({
      authVersion: 2;
    } & SwiftConnection)
  | ({
      authVersion: 3;
    } & SwiftConnection);

/**
 * Represents the main client for interacting with a Swift storage service.
 * Provides methods to manage containers and objects within those containers.
 */
export class SwiftClient {
  private sw: SwiftEntity;
  constructor(config: SwiftClientOptions) {
    this.sw = new SwiftEntity(
      'Container',
      null,
      getAuthenticatorForVersion(config)
    );
  }

  /**
   * Creates a new container in the Swift storage.
   * @param containerName - The name of the container to create.
   * @param publicRead - Whether the container should be publicly readable.
   * @param meta - Optional metadata to associate with the container.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @returns A promise that resolves when the container is successfully created.
   */
  async createContainer(
    containerName: string,
    publicRead: boolean,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void> {
    if (typeof publicRead === 'undefined') {
      publicRead = false;
    }

    if (publicRead) {
      if (!extraHeaders) extraHeaders = {};
      extraHeaders['x-container-read'] = '.r:*';
    }

    const auth = await this.sw.authenticator.authenticate();
    const req = new Request(`${auth.url}/${containerName}`, {
      method: 'PUT',
      headers: this.sw.getHeaders(
        meta ?? null,
        extraHeaders ?? null,
        auth.token
      ),
    });

    const response = await fetch(req);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Retrieves information about the client configuration or state.
   * @returns A promise resolving with client information.
   */
  async getClientInfo() {
    const auth = await this.sw.authenticator.authenticate();
    const infoUrl = new URL(auth.url).origin + '/info';
    const response = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'x-auth-token': auth.token,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetches metadata for a specified container.
   * @param containerName - The name of the container.
   * @returns A promise resolving with the container's metadata as a key-value object.
   */
  getContainerMeta(containerName: string): Promise<Record<string, string>> {
    return this.sw.getMeta(containerName);
  }

  /**
   * Deletes a specified container.
   * @param containerName - The name of the container to delete.
   * @returns A promise that resolves when the container is successfully deleted.
   */
  deleteContainer(containerName: string): Promise<void> {
    return this.sw.delete(containerName);
  }

  /**
   * Lists all containers accessible to the client.
   * @param query - Optional query parameters as a string or key-value pairs.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @returns A promise resolving with an array of container data.
   */
  async listAllContainers(
    query?: string | { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): Promise<SwiftContainerData[]> {
    const containers = (await this.sw.list(
      query,
      extraHeaders
    )) as unknown as SwiftContainerData[];
    return containers;
  }

  /**
   * Retrieves an interface to interact with a specific container.
   * @param containerName - The name of the container.
   * @returns A SwiftContainer instance for interacting with the container.
   */
  getContainer(containerName: string): SwiftContainer {
    return new SwiftCommonContainer(containerName, this.sw.authenticator);
  }
}
