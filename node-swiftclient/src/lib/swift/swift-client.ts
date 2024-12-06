import {
  ConnectionConfig,
  SwiftAuthenticatorV3,
} from './swift-authenticator-v3';
import { SwiftEntity } from './swift-entity';
import { UnsupportedAuthenticator } from './unsupported-authenticator';
import { SwiftContainer } from './swift-container';

import { SwiftContainerData } from '../interfaces/swift-container-data';
import { Authenticator } from '../interfaces';
import {
  SwiftAuthenticatorV2,
  V2ConnectionConfig,
} from './swift-authenticator-v2';
import { SwiftAuthenticatorV1 } from './swift-authenticator-v1';

export type Connection = {
  authUrl: string;
  region?: string;
  userAgent?: string;

  // Authentication options
  apiKey?: string;
  userName?: string;
  userId?: string;
  domain?: string;
  domainId?: string;

  // Application Credential options
  applicationCredentialId?: string;
  applicationCredentialName?: string;
  applicationCredentialSecret?: string;

  // Tenant/Project options
  tenant?: string;
  tenantId?: string;
  tenantDomain?: string;
  tenantDomainId?: string;

  // Trust option
  trustId?: string;
};

export type SwiftClientOptions =
  | {
      authVersion: 1;
      authUrl: string;
      username: string;
      password: string;
      tenant?: string;
    }
  | ({
      authVersion: 2;
    } & Connection)
  | ({
      authVersion: 3;
    } & Connection);

export class SwiftClient extends SwiftEntity {
  constructor(config: SwiftClientOptions) {
    super('Container', null, SwiftClient.getAuthenticatorForVersion(config));
  }

  async createContainer(
    containerName: string,
    publicRead: boolean,
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null
  ): Promise<void> {
    if (typeof publicRead === 'undefined') {
      publicRead = false;
    }

    if (publicRead) {
      if (!extraHeaders) extraHeaders = {};
      extraHeaders['x-container-read'] = '.r:*';
    }

    const auth = await this.authenticator.authenticate();
    const req = new Request(`${auth.url}/${containerName}`, {
      method: 'PUT',
      headers: this.getHeaders(meta, extraHeaders, auth.token),
    });

    const response = await fetch(req);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async getClientInfo() {
    const auth = await this.authenticator.authenticate();
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

  getContainerMeta(containerName: string): Promise<Record<string, string>> {
    return this.getMeta(containerName);
  }

  deleteContainer(containerName: string): Promise<void> {
    return this.delete(containerName);
  }

  async listAllContainers(
    query?: string | { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): Promise<SwiftContainerData[]> {
    const containers = (await this.list(
      query,
      extraHeaders
    )) as unknown as SwiftContainerData[];
    return containers;
  }

  getContainer(containerName: string): SwiftContainer {
    return new SwiftContainer(containerName, this.authenticator);
  }

  private static getAuthenticatorForVersion(
    config: SwiftClientOptions
  ): Authenticator {
    switch (config.authVersion) {
      case 1:
        return new SwiftAuthenticatorV1(
          config.authUrl,
          config.username,
          config.password,
          config.tenant ?? null
        );
      case 2:
        return new SwiftAuthenticatorV2(config as V2ConnectionConfig);
      case 3:
        return new SwiftAuthenticatorV3(config as ConnectionConfig);
      default:
        return new UnsupportedAuthenticator(
          (config as { authVersion: number }).authVersion
        );
    }
  }
}
