import { SwiftAuthenticatorV1 } from './swift-authenticator-v1';
import {
  ConnectionConfig,
  SwiftAuthenticatorV3,
} from './swift-authenticator-v3';
import { SwiftEntity } from './swift-entity';
import { UnsupportedAuthenticator } from './unsupported-authenticator';
import { SwiftContainer } from './swift-container';

export type SwiftClientOptions =
  | {
      authVersion: 1;
      authUrl: string;
      username: string;
      password: string;
    }
  | {
      authVersion: 3;
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

export class SwiftClient extends SwiftEntity {
  constructor(config: SwiftClientOptions) {
    super(
      'Container',
      null,
      config.authVersion === 1
        ? new SwiftAuthenticatorV1(
            config.authUrl,
            config.username,
            config.password
          )
        : config.authVersion === 3
        ? new SwiftAuthenticatorV3(config as ConnectionConfig)
        : new UnsupportedAuthenticator(
            (config as { authVersion: number }).authVersion
          )
    );
  }

  async create(
    name: string,
    publicRead: boolean,
    meta: Record<string, string> | null,
    extra: Record<string, string> | null
  ): Promise<void> {
    if (typeof publicRead === 'undefined') {
      publicRead = false;
    }

    if (publicRead) {
      if (!extra) extra = {};

      extra['x-container-read'] = '.r:*';
    }

    const auth = await this.authenticator.authenticate();

    const req = new Request(`${auth.url}/${name}`, {
      method: 'PUT',
      headers: this.headers(meta, extra, auth.token),
    });

    const response = await fetch(req);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async info() {
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

  container(name: string): SwiftContainer {
    return new SwiftContainer(name, this.authenticator);
  }
}
