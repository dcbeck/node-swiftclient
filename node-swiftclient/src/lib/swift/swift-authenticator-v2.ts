import { Authenticator, AuthResult } from '../interfaces';

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
      defaultRegion: string; // Equivalent to json:"RAX-AUTH:defaultRegion"
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
  domain?: string; // User's domain name
  domainId?: string; // User's domain ID
  userName: string; // UserName for API
  userId?: string; // User ID
  apiKey: string; // Key for API access
  applicationCredentialId?: string; // Application Credential ID
  applicationCredentialName?: string; // Application Credential Name
  applicationCredentialSecret?: string; // Application Credential Secret
  authUrl: string; // Auth URL
  retries?: number; // Retries on error (default is 3)
  userAgent?: string; // HTTP User agent (default goswift/1.0)
  connectTimeout?: number; // Connect channel timeout in milliseconds (default 10s)
  timeout?: number; // Data channel timeout in milliseconds (default 60s)
  region?: string; // Region to use, e.g., "LON", "ORD" - default is to use the first region (v2, v3 auth only)
  authVersion?: number; // Set to 1, 2, or 3, or leave at 0 for autodetect
  internal?: boolean; // Set this to true to use the internal/service network
  tenant?: string; // Name of the tenant (v2, v3 auth only)
  tenantId?: string; // ID of the tenant (v2, v3 auth only)
  endpointType?: string; // Endpoint type (v2, v3 auth only) (default is public URL unless internal is set)
  tenantDomain?: string; // Name of the tenant's domain (v3 auth only), only needed if it differs from the user domain
  tenantDomainId?: string; // ID of the tenant's domain (v3 auth only), only needed if it differs from the user domain
  trustId?: string; // ID of the trust (v3 auth only)
  transport?: unknown; // Specialized HTTP transport (e.g., for Google App Engine)
};

class V2Auth {
  auth: null | V2AuthResponse;
  region: string;
  useApiKey: boolean;
  useApiKeyOk: boolean;
  notFirst: boolean;

  constructor(useApiKey: boolean) {
    this.auth = null; // Stores the authentication response
    this.region = ''; // The region to use
    this.useApiKey = useApiKey; // Toggle between password and API key
    this.useApiKeyOk = false; // Lock useApiKey once successful
    this.notFirst = false; // Indicates if this is the first run
  }

  // Make the authentication request
  async request(connection: V2ConnectionConfig) {
    this.region = connection.region;

    // Toggle useApiKey if not the first run and not locked
    if (this.notFirst && !this.useApiKeyOk) {
      this.useApiKey = !this.useApiKey;
    }
    this.notFirst = true;

    // Construct the request body
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

    // Prepare the request URL
    let url = connection.authUrl;
    if (!url.endsWith('/')) url += '/';
    url += 'tokens';

    // Make the POST request
    const response = await fetch(url, {
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

  // Parse the response
  async response(response: Response) {
    try {
      const jsonResponse = await response.json();
      this.auth = jsonResponse;

      // If successful, lock useApiKey
      this.useApiKeyOk = true;
    } catch (err) {
      throw new Error(
        'Failed to parse authentication response: ' + err.message
      );
    }
  }

  // Find the endpoint URL of a specific type and endpointType
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

  // Get the storage URL
  storageUrl(isInternal = false) {
    const endpointType = isInternal ? 'internal' : 'public';
    const url = this.endpointUrl('object-store', endpointType);
    return url.replace(new RegExp('//', 'g'), '/');
  }

  // Get the token
  token(): string {
    return this.auth?.access?.token?.id || '';
  }

  // Get the expiration time
  expires(): Date {
    const expires = this.auth?.access?.token?.expires;
    if (!expires) return null;
    return new Date(expires);
  }

  // Get the CDN URL
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
