import { Authenticator, AuthResult } from '../interfaces';
import { fetchWithTimeout } from '../utils/fetch-with-timeout';

type EndpointType = 'public' | 'internal' | 'admin';

interface V2AuthResponse {
  access: {
    serviceCatalog: Array<{
      endpoints: Array<{
        internalUrl: string;
        publicUrl: string;
        adminUrl: string;
        internalURL: string;
        publicURL: string;
        adminURL: string;
        region: string;
        tenantId: string;
      }>;
      name: string;
      type: string;
    }>;
    token: {
      expires: string;
      id: string;
      tenant: {
        id: string;
        name: string;
      };
    };
    user: {
      defaultRegion: string;
      id: string;
      name: string;
      roles: Array<{
        description: string;
        id: string;
        name: string;
        tenantId: string;
      }>;
    };
  };
}

export type V2ConnectionConfig = {
  domain?: string;
  domainId?: string;
  userName: string;
  userId?: string;
  apiKey: string;
  applicationCredentialId?: string;
  applicationCredentialName?: string;
  applicationCredentialSecret?: string;
  authUrl: string;
  retries?: number;
  userAgent?: string;
  connectTimeout?: number;
  timeout?: number;
  region?: string;
  authVersion?: number;
  internal?: boolean;
  tenant?: string;
  tenantId?: string;
  endpointType?: string;
  tenantDomain?: string;
  tenantDomainId?: string;
  trustId?: string;
  transport?: unknown;
};

class V2Auth {
  auth: null | V2AuthResponse;
  region: string;
  useApiKey: boolean;
  useApiKeyOk: boolean;
  notFirst: boolean;

  constructor(useApiKey: boolean) {
    this.auth = null;
    this.region = '';
    this.useApiKey = useApiKey;
    this.useApiKeyOk = false;
    this.notFirst = false;
  }

  async request(connection: V2ConnectionConfig) {
    this.region = connection.region;

    if (this.notFirst && !this.useApiKeyOk) {
      this.useApiKey = !this.useApiKey;
    }
    this.notFirst = true;

    let body;
    if (!this.useApiKey) {
      body = {
        auth: {
          passwordCredentials: {
            username: connection.userName,
            password: connection.apiKey,
          },
          tenantName: connection.tenant || undefined,
          tenantId: connection.tenantId || undefined,
        },
      };
    } else {
      body = {
        auth: {
          'RAX-KSKEY:apiKeyCredentials': {
            username: connection.userName,
            apiKey: connection.apiKey,
          },
          tenantName: connection.tenant || undefined,
          tenantId: connection.tenantId || undefined,
        },
      };
    }

    let url = connection.authUrl;
    if (!url.endsWith('/')) url += '/';
    url += 'tokens';

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': connection.userAgent,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Authentication request failed with status: ${response.status}`
      );
    }

    return response;
  }

  async response(response: Response) {
    try {
      const jsonResponse = await response.json();
      this.auth = jsonResponse;

      this.useApiKeyOk = true;
    } catch (err) {
      throw new Error(
        'Failed to parse authentication response: ' + err.message
      );
    }
  }

  endpointUrl(type: string, endpointType: EndpointType): string {
    const catalog = this.auth?.access?.serviceCatalog || [];
    for (const service of catalog) {
      if (service.type === type) {
        for (const endpoint of service.endpoints) {
          if (
            this.region == undefined ||
            this.region === null ||
            this.region === endpoint.region
          ) {
            switch (endpointType) {
              case 'internal':
                return endpoint.internalURL || endpoint.internalUrl;
              case 'public':
                return endpoint.publicURL || endpoint.publicUrl;
              case 'admin':
                return endpoint.adminURL || endpoint.adminUrl;
              default:
                return '';
            }
          }
        }
      }
    }
    return '';
  }

  storageUrl(isInternal = false) {
    const endpointType = isInternal ? 'internal' : 'public';
    const url = this.endpointUrl('object-store', endpointType);
    return url.replace(new RegExp('//', 'g'), '/');
  }

  token(): string {
    return this.auth?.access?.token?.id || '';
  }

  expires(): Date {
    const expires = this.auth?.access?.token?.expires;
    if (!expires) return null;
    return new Date(expires);
  }

  cdnUrl(): string {
    return this.endpointUrl('rax:object-cdn', 'public');
  }
}

export class SwiftAuthenticatorV2 implements Authenticator {
  auth: V2Auth;
  constructor(private readonly connection: V2ConnectionConfig) {
    this.auth = new V2Auth( // Guess as to whether using API key or
      // password it will try both eventually so
      // this is just an optimization.
      connection.apiKey.length >= 32
    );
  }
  public async authenticate(): Promise<AuthResult> {
    const response = await this.auth.request(this.connection);
    await this.auth.response(response);

    return {
      url: this.auth.storageUrl(process.env.SWIFT_INTERNAL === 'true'),
      token: this.auth.token(),
    };
  }
}
